import type { Handler } from "@netlify/functions";
import { GoogleGenAI } from '@google/genai';

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
            body: JSON.stringify({ error: 'مفتاح API الخاص بـ Gemini غير موجود.' }),
        };
    }

    let parsedBody;
    try {
        parsedBody = JSON.parse(event.body || '{}');
    } catch (error) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    const { prompt } = parsedBody;
    if (!prompt) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing prompt' }) };
    }

    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
            },
        });

        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error('لم يتم إنشاء أي صور من قبل الذكاء الاصطناعي.');
        }

        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        const imageUrl = `data:image/png;base64,${base64ImageBytes}`;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ imageUrl }),
        };

    } catch (error) {
        console.error('Error calling Gemini Image API:', error);
        const errorMessage = error instanceof Error ? error.message : 'فشل إنشاء الصورة.';
        // A more user-friendly message for API key issues
        if (errorMessage.includes('API key')) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'حدث خطأ في الاتصال بالخادم. يرجى التحقق من إعدادات الاتصال والمحاولة لاحقاً.' })
            };
        }
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: errorMessage })
        };
    }
};

export { handler };