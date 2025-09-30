import type { Handler } from "@netlify/functions";
import { GoogleGenAI } from '@google/genai';

const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    let parsedBody;
    try {
        parsedBody = JSON.parse(event.body || '{}');
    } catch (error) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    const { content, task } = parsedBody;

    if (!content || !task) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing content or task' }) };
    }

    let systemInstruction = '';
    if (task === 'summarize') {
        systemInstruction = 'أنت خبير في تلخيص النصوص. قم بتلخيص النص التالي بشكل موجز وواضح باللغة العربية.';
    } else if (task === 'reorder') {
        systemInstruction = 'أنت خبير في تنظيم المحتوى. أعد ترتيب النص التالي على شكل نقاط رئيسية (باستخدام علامة - قبل كل نقطة) باللغة العربية. حافظ على جوهر المحتوى الأصلي ولكن اجعله أكثر تنظيماً وسهولة في القراءة.';
    } else {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid task specified' }) };
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: content,
            config: { systemInstruction }
        });

        if (!response.text) {
          throw new Error("Received an empty response from the AI.");
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ result: response.text }),
        };
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to process request with AI' }) };
    }
};

export { handler };