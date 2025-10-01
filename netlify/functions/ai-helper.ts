import type { Handler } from "@netlify/functions";
import { GoogleGenAI, GenerateContentConfig } from '@google/genai';

type AITask = 'summarize' | 'reorder' | 'complete';

interface CloudflareAIResponse {
  result: {
    response: string;
  };
  success: boolean;
  errors: any[];
  messages: any[];
}

const getGeminiPrompt = (task: AITask): string => {
    switch (task) {
        case 'summarize':
            return 'أنت خبير في تلخيص النصوص. قم بتلخيص النص التالي بشكل موجز وواضح باللغة العربية.';
        case 'reorder':
            return 'أنت خبير في تنظيم المحتوى. أعد هيكلة النص التالي باستخدام عناوين رئيسية (باستخدام ## قبل العنوان) ونقاط فرعية إذا لزم الأمر. اجعل المحتوى أكثر تنظيماً وسهولة في القراءة باللغة العربية.';
        case 'complete':
            return 'أنت كاتب محتوى خبير. أكمل النص التالي باللغة العربية بطريقة احترافية وغنية بالمعلومات، مستخدماً مصادر موثوقة. اجعل الإضافة طبيعية ومتكاملة مع النص الأصلي.';
        default:
            return 'You are a helpful AI assistant. Respond in Arabic.';
    }
}

const getCloudflarePrompt = (task: AITask, content: string): { system: string, user: string } => {
    switch (task) {
        case 'summarize':
            return {
                system: 'You are an expert text summarizer who responds in Arabic.',
                user: `Summarize the following text concisely in Arabic: "${content}"`
            };
        case 'reorder':
            return {
                system: 'You are an expert content organizer who responds in Arabic.',
                user: `Restructure the following text using main headings (using "##" before the heading) and sub-points if necessary. Make the content more organized and easy to read in Arabic: "${content}"`
            };
        case 'complete':
            return {
                system: 'You are an expert content writer who responds in Arabic.',
                user: `Complete the following text naturally and informatively in Arabic: "${content}"`
            };
        default:
            return {
                system: 'You are a helpful AI assistant who responds in Arabic.',
                user: content
            };
    }
}

const runWithGemini = async (content: string, task: AITask, apiKey: string) => {
    const ai = new GoogleGenAI({ apiKey });
    const config: GenerateContentConfig = {
        systemInstruction: getGeminiPrompt(task)
    };
    if (task === 'complete') {
        config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: content,
        config: config
    });

    if (!response.text) {
        throw new Error("Received an empty response from Gemini AI.");
    }

    return task === 'complete' ? `${content}\n\n${response.text}` : response.text;
};

const runWithCloudflare = async (content: string, task: AITask, accountId: string, apiKey: string) => {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-2-7b-chat-int8`;
    const prompts = getCloudflarePrompt(task, content);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages: [{ role: 'system', content: prompts.system }, { role: 'user', content: prompts.user }]
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Cloudflare AI Error:", errorText);
        throw new Error("Fallback AI service failed.");
    }

    const data: CloudflareAIResponse = await response.json();
    if (!data.success || !data.result?.response) {
        throw new Error("Fallback AI service returned an invalid response.");
    }

    return task === 'complete' ? `${content}\n\n${data.result.response}` : data.result.response;
};

const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const { API_KEY, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_KEY } = process.env;

    if (!API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'خدمة الذكاء الاصطناعي الأساسية غير مكونة.' })
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

    const validTasks: AITask[] = ['summarize', 'reorder', 'complete'];
    if (!validTasks.includes(task)) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid task specified' }) };
    }

    try {
        const result = await runWithGemini(content, task, API_KEY);
        return {
            statusCode: 200,
            body: JSON.stringify({ result }),
        };
    } catch (geminiError) {
        console.warn("Gemini AI failed, attempting fallback to Cloudflare AI. Reason:", geminiError);

        if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_KEY) {
            console.error("Cloudflare credentials not configured for fallback.");
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'فشل الطلب من الذكاء الاصطناعي الأساسي، والبديل غير مكوّن.' })
            };
        }

        try {
            const result = await runWithCloudflare(content, task, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_KEY);
            return {
                statusCode: 200,
                body: JSON.stringify({ result }),
            };
        } catch (cloudflareError) {
            console.error("Cloudflare AI fallback also failed. Reason:", cloudflareError);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'فشل الطلب من خدمتي الذكاء الاصطناعي الأساسية والبديلة.' })
            };
        }
    }
};

export { handler };