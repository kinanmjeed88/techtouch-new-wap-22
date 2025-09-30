import type { Handler } from "@netlify/functions";
import { Buffer } from "buffer";

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

    const { CLOUDFLARE_ACCOUNT_ID, API_KEY } = process.env;

    if (!CLOUDFLARE_ACCOUNT_ID || !API_KEY) {
        console.error('Cloudflare credentials are not set (CLOUDFLARE_ACCOUNT_ID or API_KEY).');
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'خدمة إنشاء الصور غير مكونة بشكل صحيح.' }),
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
        const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`;

        const cfResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt }),
        });

        if (!cfResponse.ok) {
            const errorText = await cfResponse.text();
            console.error('Cloudflare API Error:', errorText);
            throw new Error('فشل الاتصال بخدمة إنشاء الصور.');
        }

        const imageBuffer = await cfResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const imageUrl = `data:image/png;base64,${base64Image}`;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ imageUrl }),
        };

    } catch (error) {
        console.error('Error calling Cloudflare Image API:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error instanceof Error ? error.message : 'فشل إنشاء الصورة.' })
        };
    }
};

export { handler };