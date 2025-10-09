import type { Handler } from "@netlify/functions";
import fs from "fs/promises";
import path from "path";
// Fix: Import 'process' to provide type definitions for process.cwd()
import process from "process";

const CWD = process.cwd();
const POSTS_DIR = path.join(CWD, 'content/posts');
const CATEGORIES_DIR = path.join(CWD, 'content/categories');
const SETTINGS_PATH = path.join(CWD, 'public/settings.json');
const PROFILE_PATH = path.join(CWD, 'public/profile.json');

const readDirContents = async (dir: string) => {
    try {
        const fileNames = await fs.readdir(dir);
        return Promise.all(
            fileNames.filter(name => name.endsWith('.md')).map(async (fileName) => {
                const content = await fs.readFile(path.join(dir, fileName), 'utf-8');
                return { fileName, content };
            })
        );
    } catch (error: any) {
        // If directory doesn't exist, return empty array
        if (error.code === 'ENOENT') {
            console.warn(`Directory not found: ${dir}`);
            return [];
        }
        throw error;
    }
};

const readFileContent = async (filePath: string) => {
    try {
        return await fs.readFile(filePath, 'utf-8');
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.warn(`File not found: ${filePath}`);
            return "{}"; // Return empty JSON object as a string
        }
        throw error;
    }
};

const handler: Handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const posts = await readDirContents(POSTS_DIR);
        const categories = await readDirContents(CATEGORIES_DIR);
        const settings = await readFileContent(SETTINGS_PATH);
        const profile = await readFileContent(PROFILE_PATH);

        const backupData = {
            createdAt: new Date().toISOString(),
            posts,
            categories,
            settings,
            profile,
        };

        const fileName = `techtouch0-backup-${new Date().toISOString().split('T')[0]}.json`;

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="${fileName}"`,
            },
            body: JSON.stringify(backupData, null, 2),
        };
    } catch (error: any) {
        console.error("Backup failed:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to create backup.', details: error.message }),
        };
    }
};

export { handler };