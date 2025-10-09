
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CWD = process.cwd();
const POSTS_DIR = path.join(CWD, 'content/posts');
const CATEGORIES_DIR = path.join(CWD, 'content/categories');
const POSTS_OUTPUT_PATH = path.join(CWD, 'public/posts.json');
const CATEGORIES_OUTPUT_PATH = path.join(CWD, 'public/categories.json');

function slugify(text) {
  return text.toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    // Remove characters that are not alphanumeric, dash, or Arabic letters/numbers
    .replace(/[^\w\u0600-\u06FF\u0660-\u0669\-]/g, '') 
    .replace(/\-\-+/g, '-') // Replace multiple dashes with a single dash
}

function generatePosts() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.log("Creating 'content/posts' directory...");
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }

  const fileNames = fs.readdirSync(POSTS_DIR).filter(file => file.endsWith('.md'));

  if (fileNames.length === 0) {
    console.warn("No markdown files found in 'content/posts'. Generating an empty posts.json.");
    return [];
  }

  const allPostsData = fileNames.map(fileName => {
    const filePath = path.join(POSTS_DIR, fileName);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    if (!data.timestamp || !data.title) {
        console.warn(`Skipping ${fileName}: missing 'timestamp' or 'title' in frontmatter.`);
        return null;
    }
    
    const id = new Date(data.timestamp).getTime();
    const slug = slugify(data.title);

    return {
      id,
      slug,
      ...data,
      content,
    };
  }).filter(Boolean);

  allPostsData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return allPostsData;
}

function generateCategories() {
  if (!fs.existsSync(CATEGORIES_DIR)) {
    console.log("Creating 'content/categories' directory...");
    fs.mkdirSync(CATEGORIES_DIR, { recursive: true });
  }

  const fileNames = fs.readdirSync(CATEGORIES_DIR).filter(file => file.endsWith('.md'));

  if (fileNames.length === 0) {
    console.warn("No markdown files found in 'content/categories'. Generating an empty categories.json.");
    return [];
  }

  const allCategoriesData = fileNames.map(fileName => {
    const filePath = path.join(CATEGORIES_DIR, fileName);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContents);

    if (!data.id || !data.title) {
        console.warn(`Skipping ${fileName}: missing 'id' or 'title' in frontmatter.`);
        return null;
    }

    return {
      id: data.id,
      title: data.title,
    };
  }).filter(Boolean);

  return allCategoriesData;
}

try {
  const posts = generatePosts();
  const categories = generateCategories();
  
  const postsOutputData = { posts };
  const categoriesOutputData = { categories };
  
  fs.writeFileSync(POSTS_OUTPUT_PATH, JSON.stringify(postsOutputData, null, 2));
  console.log(`✅ Successfully generated ${posts.length} posts to ${POSTS_OUTPUT_PATH}`);

  fs.writeFileSync(CATEGORIES_OUTPUT_PATH, JSON.stringify(categoriesOutputData, null, 2));
  console.log(`✅ Successfully generated ${categories.length} categories to ${CATEGORIES_OUTPUT_PATH}`);

} catch (error) {
  console.error('❌ Error during prebuild:', error);
  // Create empty files to prevent the site build from failing
  fs.writeFileSync(POSTS_OUTPUT_PATH, JSON.stringify({ posts: [] }, null, 2));
  fs.writeFileSync(CATEGORIES_OUTPUT_PATH, JSON.stringify({ categories: [] }, null, 2));
  process.exit(1);
}