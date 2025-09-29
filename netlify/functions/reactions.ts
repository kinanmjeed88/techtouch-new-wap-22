
import type { Handler } from "@netlify/functions";

// This is our in-memory "database".
// It will be reset when the function instance is recycled (cold start),
// but provides a shared experience for users on a "warm" instance.
const reactionsStore: Record<string, Record<string, number>> = {};

// Generates deterministic initial counts to make posts feel more alive.
const generateInitialCounts = (postId: string) => {
    if (reactionsStore[postId]) {
        return reactionsStore[postId];
    }
    const salt = "techtouch0-global-reactions";
    const str = postId + salt;
    const hash = str
      .split('')
      .reduce((acc, char) => (char.charCodeAt(0) + ((acc << 5) - acc)), 0);
  
    const initialCounts = {
      like: Math.abs(hash % 70) + 5,
      dislike: Math.abs(hash % 10),
      love: Math.abs(hash % 40) + 3,
    };
    reactionsStore[postId] = initialCounts;
    return initialCounts;
};

const handler: Handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers,
        };
    }

    const { postId } = event.queryStringParameters;

    if (!postId) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'postId is required' }),
        };
    }

    // Ensure initial counts exist for the post.
    generateInitialCounts(postId);
    const postReactions = reactionsStore[postId];

    if (event.httpMethod === 'POST') {
        if (!event.body) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Request body is missing' }),
            };
        }
        try {
            const { increment, decrement } = JSON.parse(event.body);
            
            if (increment && postReactions[increment] !== undefined) {
                postReactions[increment]++;
            }
            if (decrement && postReactions[decrement] !== undefined) {
                postReactions[decrement] = Math.max(0, postReactions[decrement] - 1);
            }
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(postReactions),
            };
        } catch (e) {
            return { 
                statusCode: 400, 
                headers,
                body: JSON.stringify({ error: 'Invalid JSON body' }) 
            };
        }
    }

    // Default to GET request
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify(postReactions),
    };
};

export { handler };
