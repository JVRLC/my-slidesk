#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT_DIR = process.cwd();
const SLIDES_DIR = path.join(ROOT_DIR, 'slides');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const TEMPLATE_HTML = path.join(ROOT_DIR, 'src', 'index.html');

// CLI arguments
const args = process.argv.slice(2);
function getArg(flag, defaultValue = '') {
  const index = args.indexOf(flag);
  if (index !== -1 && args[index + 1]) {
    return args[index + 1];
  }
  return defaultValue;
}
const hasFlag = (flag) => args.includes(flag);

const basePrefix = getArg('--base-prefix', '/');
const indexOnly = hasFlag('--index-only') || hasFlag('--json-only');

// Lightweight YAML frontmatter and markdown extractor
function parseFrontmatterAndContent(fileContent) {
  const frontmatter = {};
  let content = fileContent;

  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (match) {
    const yamlBlock = match[1];
    content = match[2] || '';

    let currentListKey = null;
    yamlBlock.split(/\r?\n/).forEach((line) => {
      // List item: "  - value"
      const listItemMatch = line.match(/^\s*-\s+(.+)$/);
      if (listItemMatch && currentListKey) {
        frontmatter[currentListKey].push(listItemMatch[1].trim().replace(/^['"]|['"]$/g, ''));
        return;
      }

      // Key-value pair: "key: value"
      const kvMatch = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
      if (kvMatch) {
        const key = kvMatch[1].trim();
        const value = kvMatch[2].trim();

        if (value.startsWith('[') && value.endsWith(']')) {
          frontmatter[key] = value
            .slice(1, -1)
            .split(',')
            .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
            .filter(Boolean);
          currentListKey = null;
        } else if (value === '') {
          frontmatter[key] = [];
          currentListKey = key;
        } else {
          frontmatter[key] = value.replace(/^['"]|['"]$/g, '');
          currentListKey = null;
        }
      }
    });
  }

  return { frontmatter, content };
}

// Extract presentation metadata from slides.md
function extractMetadata(folderName) {
  const slideDir = path.join(SLIDES_DIR, folderName);
  const slideMdPath = path.join(slideDir, 'slides.md');

  if (!fs.existsSync(slideMdPath)) {
    return null;
  }

  const raw = fs.readFileSync(slideMdPath, 'utf-8');
  const { frontmatter, content } = parseFrontmatterAndContent(raw);

  // Title fallback: first markdown H1
  let title = frontmatter.title;
  if (!title) {
    const h1Match = content.match(/^#\s+(.+)$/m);
    title = h1Match ? h1Match[1].trim() : folderName;
  }

  // Description fallback: first non-empty text paragraph
  let description = frontmatter.description;
  if (!description) {
    const cleanLines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#') && !l.startsWith('---') && !l.startsWith('!'));
    description = cleanLines.length > 0 ? cleanLines[0] : `Presentation ${title}`;
  }

  // Tags fallback
  let tags = frontmatter.tags;
  if (!tags || !Array.isArray(tags) || tags.length === 0) {
    tags = ['Slidev'];
  }

  // Date fallback: file modified date
  let date = frontmatter.date;
  if (!date) {
    const stats = fs.statSync(slideMdPath);
    const mtime = stats.mtime;
    date = `${mtime.toLocaleString('en-US', { month: 'long' })} ${mtime.getFullYear()}`;
  }

  // Calculate slide count based on markdown slide delimiters
  const slideDelimiters = content.match(/^---\s*$/gm) || [];
  const slidesCount = Math.max(1, slideDelimiters.length + 1);

  // Order priority (optional, default to 999)
  const order = frontmatter.order ? parseInt(frontmatter.order, 10) : 999;

  return {
    title,
    folder: folderName,
    description,
    date,
    tags,
    author: frontmatter.author || '',
    theme: frontmatter.theme || 'default',
    slidesCount,
    cover: frontmatter.cover || '',
    order,
  };
}

async function main() {
  console.log('[build] Starting Slide Desk compilation...');

  if (!fs.existsSync(SLIDES_DIR)) {
    console.error(`[error] Slides directory does not exist: ${SLIDES_DIR}`);
    process.exit(1);
  }

  // Prepare dist directory
  fs.mkdirSync(DIST_DIR, { recursive: true });

  // Copy portal template
  if (fs.existsSync(TEMPLATE_HTML)) {
    fs.copyFileSync(TEMPLATE_HTML, path.join(DIST_DIR, 'index.html'));
    console.log('[build] Portal template copied to dist/index.html');
  } else {
    console.warn(`[warning] Template not found at ${TEMPLATE_HTML}`);
  }

  // Scan slide folders
  const entries = fs.readdirSync(SLIDES_DIR, { withFileTypes: true });
  const slideFolders = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name);

  console.log(`[scan] Found ${slideFolders.length} presentation folder(s).`);

  const slidesMetadata = [];

  for (const folder of slideFolders) {
    console.log(`[scan] Inspecting "${folder}"...`);
    const meta = extractMetadata(folder);

    if (!meta) {
      console.warn(`[warning] Skipping "${folder}": slides.md not found.`);
      continue;
    }

    slidesMetadata.push(meta);
    console.log(`[metadata] "${meta.title}" (${meta.slidesCount} slides, author: ${meta.author || 'N/A'})`);

    if (!indexOnly) {
      const cleanPrefix = basePrefix.endsWith('/') ? basePrefix : `${basePrefix}/`;
      const deckBase = `${cleanPrefix}${folder}/`;
      const outDir = path.join(DIST_DIR, folder);

      console.log(`[compile] Building ${folder} with base "${deckBase}"...`);
      try {
        const slideMd = path.join(SLIDES_DIR, folder, 'slides.md');
        execSync(`npx slidev build "${slideMd}" --base "${deckBase}" --out "${outDir}"`, {
          stdio: 'inherit',
          cwd: ROOT_DIR,
        });
        console.log(`[compile] Success for "${folder}".`);
      } catch (err) {
        console.error(`[error] Build failed for "${folder}":`, err.message);
        process.exit(1);
      }
    }
  }

  // Sort by order priority ascending
  slidesMetadata.sort((a, b) => a.order - b.order);

  // Write catalog JSON
  const jsonPath = path.join(DIST_DIR, 'slides.json');
  fs.writeFileSync(jsonPath, JSON.stringify(slidesMetadata, null, 2), 'utf-8');
  console.log(`[build] Generated dist/slides.json with ${slidesMetadata.length} item(s).`);
  console.log('[build] Build completed successfully.');
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
