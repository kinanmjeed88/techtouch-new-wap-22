import type { Handler } from "@netlify/functions";
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
// Fix: Import the 'process' module to make Node.js globals like `process.cwd()` available.
import process from 'process';

// Helper function to recursively read directory contents
const getAllFiles = (dirPath: string, arrayOfFiles: string[] = []): string[] => {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            arrayOfFiles.push(fullPath);
        }
    });

    return arrayOfFiles;
};

const handler: Handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers };
    }
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const zip = new JSZip();
        
        const CWD = process.cwd();
        const contentDir = path.join(CWD, 'content');
        const publicDir = path.join(CWD, 'public');

        // 1. Add content directory
        if (fs.existsSync(contentDir)) {
            const contentFiles = getAllFiles(contentDir);
            contentFiles.forEach(filePath => {
                const relativePath = path.relative(CWD, filePath);
                const fileData = fs.readFileSync(filePath);
                zip.file(relativePath, fileData);
            });
        }

        // 2. Add settings.json
        const settingsPath = path.join(publicDir, 'settings.json');
        if (fs.existsSync(settingsPath)) {
            const settingsData = fs.readFileSync(settingsPath);
            zip.file('public/settings.json', settingsData);
        }
        
        // 3. Add profile.json
        const profilePath = path.join(publicDir, 'profile.json');
        if (fs.existsSync(profilePath)) {
            const profileData = fs.readFileSync(profilePath);
            zip.file('public/profile.json', profileData);
        }

        const zipContent = await zip.generateAsync({ type: 'base64' });

        const today = new Date();
        const dateString = today.toISOString().split('T')[0];
        const filename = `techtouch0-backup-${dateString}.zip`;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ filename, data: zipContent }),
        };

    } catch (error) {
        const err = error as Error;
        console.error('Backup Error:', err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to create backup.', details: err.message }),
        };
    }
};

export { handler };
