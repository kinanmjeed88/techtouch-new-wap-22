import type { Handler } from "@netlify/functions";

interface BackupData {
    createdAt?: string;
    posts: { fileName: string; content: string }[];
    categories: { fileName: string; content: string }[];
    settings: string;
    profile: string;
}

interface TreeFile {
    path: string;
    mode: '100644';
    type: 'blob';
    sha?: string | null;
    content?: string;
}

const GITHUB_API_URL = 'https://api.github.com';

const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const { GITHUB_TOKEN, REPOSITORY_URL, HEAD } = process.env;

    if (!GITHUB_TOKEN) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Missing GITHUB_TOKEN. إعدادات الاستعادة غير مكتملة على الخادم.' }) };
    }
    if (!REPOSITORY_URL) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Missing REPOSITORY_URL. لا يمكن تحديد المستودع.' }) };
    }

    const repoMatch = REPOSITORY_URL.match(/github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/);
    if (!repoMatch || !repoMatch[1]) {
        return { statusCode: 500, body: JSON.stringify({ error: `Could not parse repository name from REPOSITORY_URL: ${REPOSITORY_URL}` }) };
    }
    const GITHUB_REPO = repoMatch[1];
    const GITHUB_BRANCH = HEAD || 'main';

    try {
        const backupData: BackupData = JSON.parse(event.body || '{}');
        const headers = {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };

        // 1. Get latest commit SHA of the branch
        const branchRes = await fetch(`${GITHUB_API_URL}/repos/${GITHUB_REPO}/branches/${GITHUB_BRANCH}`, { headers });
        if (!branchRes.ok) throw new Error(`فشل في جلب معلومات الفرع: ${await branchRes.text()}`);
        const branchData = await branchRes.json();
        const latestCommitSha = branchData.commit.sha;
        
        // 2. Get the file list of the current tree
        const treeRes = await fetch(`${GITHUB_API_URL}/repos/${GITHUB_REPO}/git/trees/${latestCommitSha}?recursive=1`, { headers });
        if (!treeRes.ok) throw new Error(`فشل في جلب شجرة الملفات: ${await treeRes.text()}`);
        const treeData = await treeRes.json();

        const filesToDelete = treeData.tree.filter((file: any) =>
            file.type === 'blob' &&
            (file.path.startsWith('content/posts/') || file.path.startsWith('content/categories/'))
        );

        // 3. Construct the new tree
        const newTree: TreeFile[] = [];

        // Mark old content files for deletion
        for (const file of filesToDelete) {
            newTree.push({ path: file.path, mode: '100644', type: 'blob', sha: null });
        }
        
        // Add/update settings and profile
        newTree.push({ path: 'public/settings.json', mode: '100644', type: 'blob', content: backupData.settings });
        newTree.push({ path: 'public/profile.json', mode: '100644', type: 'blob', content: backupData.profile });
        
        // Add new post files
        for (const post of backupData.posts) {
            if (post.fileName && post.content) {
                newTree.push({ path: `content/posts/${post.fileName}`, mode: '100644', type: 'blob', content: post.content });
            }
        }
        
        // Add new category files
        for (const category of backupData.categories) {
             if (category.fileName && category.content) {
                newTree.push({ path: `content/categories/${category.fileName}`, mode: '100644', type: 'blob', content: category.content });
            }
        }
        
        // 4. Create the new tree
        const createTreeRes = await fetch(`${GITHUB_API_URL}/repos/${GITHUB_REPO}/git/trees`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ tree: newTree }),
        });
        if (!createTreeRes.ok) throw new Error(`فشل في إنشاء شجرة جديدة: ${await createTreeRes.text()}`);
        const newTreeData = await createTreeRes.json();
        const newTreeSha = newTreeData.sha;

        // 5. Create a new commit
        const commitMessage = `Restore from backup created at ${backupData.createdAt || new Date().toISOString()}`;
        const createCommitRes = await fetch(`${GITHUB_API_URL}/repos/${GITHUB_REPO}/git/commits`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                message: commitMessage,
                tree: newTreeSha,
                parents: [latestCommitSha],
            }),
        });
        if (!createCommitRes.ok) throw new Error(`فشل في إنشاء الـ commit: ${await createCommitRes.text()}`);
        const newCommitData = await createCommitRes.json();
        const newCommitSha = newCommitData.sha;

        // 6. Update branch reference
        const updateRefRes = await fetch(`${GITHUB_API_URL}/repos/${GITHUB_REPO}/git/refs/heads/${GITHUB_BRANCH}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ sha: newCommitSha }),
        });
        if (!updateRefRes.ok) throw new Error(`فشل في تحديث الفرع: ${await updateRefRes.text()}`);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Restore successful!' }),
        };

    } catch (error: any) {
        console.error("Restore failed:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || 'An unknown error occurred during restore.' }),
        };
    }
};

export { handler };
