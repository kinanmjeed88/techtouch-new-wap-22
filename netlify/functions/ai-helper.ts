import type { Handler } from "@netlify/functions";
import { GoogleGenAI, GenerateContentConfig } from '@google/genai';

const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const { API_KEY } = process.env;
    if (!API_KEY) {
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: 'خدمة الذكاء الاصطناعي غير مكونة بشكل صحيح.' }) 
        };
    }

    let parsedBody;
    try {
        parsedBody = JSON.parse(event.body || '{}');
    } catch (error) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    const { content, task } = parsedBody;

    if ((!content && task !== 'complete') || !task) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing content or task' }) };
    }

    let systemInstruction = '';
    const config: GenerateContentConfig = {};
    let isCompletion = false;

    if (task === 'summarize') {
        systemInstruction = 'أنت خبير في تلخيص النصوص. قم بتلخيص النص التالي بشكل موجز وواضح باللغة العربية.';
    } else if (task === 'reorder') {
        systemInstruction = 'أنت خبير في تنظيم المحتوى. أعد ترتيب النص التالي على شكل نقاط رئيسية (باستخدام علامة - قبل كل نقطة) باللغة العربية. حافظ على جوهر المحتوى الأصلي ولكن اجعله أكثر تنظيماً وسهولة في القراءة.';
    } else if (task === 'complete') {
        isCompletion = true;
        systemInstruction = 'أنت كاتب محتوى خبير. أكمل النص التالي باللغة العربية بطريقة احترافية وغنية بالمعلومات، مستخدماً مصادر موثوقة. اجعل الإضافة طبيعية ومتكاملة مع النص الأصلي.';
        config.tools = [{ googleSearch: {} }];
    } else {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid task specified' }) };
    }

    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: content,
            config: { ...config, systemInstruction }
        });

        if (!response.text) {
          throw new Error("Received an empty response from the AI.");
        }
        
        const result = isCompletion ? `${content}\n\n${response.text}` : response.text;

        return {
            statusCode: 200,
            body: JSON.stringify({ result }),
        };
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to process request with AI' }) };
    }
};

export { handler };