import type { Handler } from "@netlify/functions";
import { GoogleGenAI, Modality } from '@google/genai';

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

    const { prompt, imageData, mimeType } = parsedBody;
    if (!prompt || !imageData || !mimeType) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing prompt, imageData, or mimeType' }) };
    }

    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: imageData,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        let editedImageUrl: string | null = null;
        let responseText: string | null = null;
        
        if (!response.candidates || response.candidates.length === 0) {
            throw new Error("لم يتم إرجاع أي نتيجة من الذكاء الاصطناعي.");
        }

        for (const part of response.candidates[0].content.parts) {
            if (part.text) {
                responseText = part.text;
            } else if (part.inlineData) {
                const base64ImageBytes = part.inlineData.data;
                editedImageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ editedImageUrl, responseText }),
        };

    } catch (error) {
        console.error('Error calling Gemini Image Edit API:', error);
        const errorMessage = error instanceof Error ? error.message : 'فشل تعديل الصورة.';
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
