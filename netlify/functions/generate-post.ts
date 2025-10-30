import type { Handler } from "@netlify/functions";
import { GoogleGenAI } from '@google/genai';
import fs from 'fs/promises';
import path from 'path';
import process from 'process';

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

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const userPrompt = `
        Topic/Title: ${title}
        Description: ${description || 'غير متوفر.'}
        Reference Link: ${link || 'غير متوفر.'}
    `;

    const systemInstruction = `You are an expert content creator for a tech blog. Your task is to generate a complete blog post based on a given topic.
- The content must be concise, accurate, useful, and written in Arabic.
- It must be well-structured using Markdown for formatting (e.g., '##' for headings, '-' for bullet points).
- You must use Google Search to find up-to-date information and a relevant, working, publicly accessible YouTube video link. Do not link to private or unavailable videos.
- You must also select the most appropriate category ID for this post from the following list: [${categoryListForPrompt}].
- IMPORTANT: Your entire response MUST be a single, valid JSON object and nothing else. Do not wrap it in markdown code fences or add any explanations. The JSON object must have four keys: "description" (a concise and engaging summary of the post, 2-3 sentences), "content" (string, the full post body), "youtubeUrl" (string), and "category" (string).`;

    try {
        console.log("Attempting AI generation with JSON mode...");
        const response = await ai.models.generateContent({
            model: 'gemini-pro', // CHANGED to a stable model
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                tools: [{ googleSearch: {} }],
            }
        });

        let parsedResult = JSON.parse(response.text);
        parsedResult.content = appendSources(parsedResult.content, response);
        
        const selectedCategory = categories.find(c => c.id === parsedResult.category);
        parsedResult.categoryTitle = selectedCategory ? selectedCategory.title : parsedResult.category;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(parsedResult),
        };

    } catch (jsonModeError) {
        console.warn("JSON mode failed. Reason:", jsonModeError, "Falling back to manual parsing mode.");

        try {
            console.log("Attempting AI generation with manual parsing mode...");
            const response = await ai.models.generateContent({
                model: 'gemini-pro', // CHANGED to a stable model
                contents: userPrompt,
                config: {
                    systemInstruction,
                    tools: [{ googleSearch: {} }],
                }
            });

            if (!response.text) {
                throw new Error("AI returned an empty response in fallback mode.");
            }

            let jsonString = response.text.trim();
            const jsonMatch = jsonString.match(/\{[\s\S]*\}/);

            if (!jsonMatch || !jsonMatch[0]) {
                console.error("Fallback failed: Could not extract JSON from AI response:", response.text);
                throw new Error("AI did not return a valid JSON object structure in fallback mode.");
            }

            jsonString = jsonMatch[0];
            let parsedResult = JSON.parse(jsonString);
            parsedResult.content = appendSources(parsedResult.content, response);

            const selectedCategory = categories.find(c => c.id === parsedResult.category);
            parsedResult.categoryTitle = selectedCategory ? selectedCategory.title : parsedResult.category;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(parsedResult),
            };
        } catch (fallbackError) {
            console.error('Both JSON mode and fallback mode failed. Final error:', fallbackError);
            const errorMessage = fallbackError instanceof Error ? fallbackError.message : 'فشل إنشاء المحتوى.';
            let finalError = `فشل إنشاء المحتوى بالذكاء الاصطناعي: ${errorMessage}`;

            if (fallbackError instanceof SyntaxError) {
                finalError = `فشل تحليل استجابة الذكاء الاصطناعي في الوضع الاحتياطي.`;
            }
        
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: finalError }),
            };
        }
    }
};

export { handler };
