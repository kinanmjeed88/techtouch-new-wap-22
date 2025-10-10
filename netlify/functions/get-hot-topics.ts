import type { Handler } from "@netlify/functions";
import { GoogleGenAI, Type } from '@google/genai';

const handler: Handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers };
    }
    
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }
    
    const { API_KEY } = process.env;
    if (!API_KEY) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'خدمة الذكاء الاصطناعي غير مكونة.' }),
        };
    }

    let parsedBody;
    try {
        parsedBody = JSON.parse(event.body || '{}');
    } catch (error) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }
    const { topic } = parsedBody;
    if (!topic) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing topic' }) };
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on the latest news and trending topics from Google Search, list exactly 20 engaging and relevant blog post titles in Arabic related to the topic of "${topic}". The titles should be suitable for a tech blog. Your response must be a valid JSON array of strings, where each string is a title. For example: ["عنوان 1", "عنوان 2", ...]. Do not include any other text, formatting, or explanations.`,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });

        // The response text should be a JSON string representing an array
        return {
            statusCode: 200,
            headers,
            body: response.text.trim(),
        };
    } catch (error) {
        console.error('Error getting hot topics:', error);
        const errorMessage = error instanceof Error ? error.message : 'فشل جلب المواضيع.';
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: `فشل جلب المواضيع الرائجة: ${errorMessage}` }),
        };
    }
};

export { handler };