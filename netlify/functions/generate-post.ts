import type { Handler } from "@netlify/functions";
import fs from 'fs/promises';
import path from 'path';
import process from 'process';

// Helper function to manually call the Gemini API via fetch
const callGeminiApi = async (apiKey: string, userPrompt: string, systemInstruction: string) => {
    const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    const requestBody = {
        contents: [{
            parts: [{ text: userPrompt }]
        }],
        systemInstruction: {
            parts: [{ text: systemInstruction }]
        },
        generationConfig: {
            // Optional: configure temperature, etc.
        },
        tools: [{
            googleSearch: {}
        }]
    };

    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorBody = await response.json();
        console.error("Direct API call failed:", errorBody);
        throw new Error(`Google API responded with status ${response.status}: ${JSON.stringify(errorBody.error)}`);
    }

    const responseData = await response.json();
    
    if (!responseData.candidates || !responseData.candidates[0].content.parts[0].text) {
        throw new Error("AI returned an invalid or empty response structure from direct API call.");
    }
    
    return responseData;
};

// ... (appendSources function remains the same)
const appendSources = (content: string, response: any): string => {
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
        .map((chunk: any) => chunk.web)
        .filter((web: any) => web && web.uri)
        .reduce((acc: any[], current: any) => {
            if (!acc.find(item => item.uri === current.uri)) {
                acc.push(current);
            }
            return acc;
        }, [])
        .slice(0, 5)
        .map((web: any) => `- [${web.title || web.uri}](${web.uri})`);

    if (sources.length > 0) {
        return `${content}\n\n## المصادر\n${sources.join('\n')}`;
    }
    return content;
};


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
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'خدمة الذكاء الاصطناعي غير مكونة.' }) };
    }

    let parsedBody;
    try {
        parsedBody = JSON.parse(event.body || '{}');
    } catch (error) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    const { title, description, link } = parsedBody;
    if (!title) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'العنوان مطلوب.' }) };
    }
    
    let categories: { id: string, title: string }[] = [];
    let categoryListForPrompt = 'any relevant category';
    try {
        const categoriesPath = path.join(process.cwd(), 'public/categories.json');
        const categoriesFile = await fs.readFile(categoriesPath, 'utf-8');
        const categoriesData = JSON.parse(categoriesFile);
        if(categoriesData && categoriesData.categories) {
            categories = categoriesData.categories;
        }
        if (categories.length > 0) {
            categoryListForPrompt = categories.map(c => `'${c.id}' (${c.title})`).join(', ');
        }
    } catch (e) {
        console.warn("Could not load categories.json, proceeding without category suggestions.", e);
    }

    const userPrompt = `
        Topic/Title: ${title}
        Description: ${description || 'غير متوفر.'}
        Reference Link: ${link || 'غير متوفر.'}
    `;

    const systemInstruction = `You are an expert content creator for a tech blog... [Your full system instruction here] ... The JSON object must have four keys: "description", "content", "youtubeUrl", and "category".`;

    try {
        console.log("Attempting AI generation with direct fetch call...");
        const responseData = await callGeminiApi(API_KEY, userPrompt, systemInstruction);
        
        const responseText = responseData.candidates[0].content.parts[0].text;
        let jsonString = responseText.trim();
        const jsonMatch = jsonString.match(/\{[\s\S]*\}/);

        if (!jsonMatch || !jsonMatch[0]) {
            throw new Error("AI did not return a valid JSON object structure.");
        }

        jsonString = jsonMatch[0];
        let parsedResult = JSON.parse(jsonString);
        
        parsedResult.content = appendSources(parsedResult.content, responseData);

        const selectedCategory = categories.find(c => c.id === parsedResult.category);
        parsedResult.categoryTitle = selectedCategory ? selectedCategory.title : parsedResult.category;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(parsedResult),
        };
    } catch (error) {
        console.error('Final error in generate-post function:', error);
        const errorMessage = error instanceof Error ? error.message : 'فشل إنشاء المحتوى.';
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: `فشل إنشاء المحتوى بالذكاء الاصطناعي: ${errorMessage}` }),
        };
    }
};

export { handler };
