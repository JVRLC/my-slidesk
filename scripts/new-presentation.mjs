#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const SLIDES_DIR = path.join(ROOT_DIR, 'slides');

// Parse argument
const rawTitle = process.argv.slice(2).join(' ').trim();

if (!rawTitle) {
  console.log('Usage: npm run new "Your Presentation Title"');
  console.log('Example: npm run new "Next Generation Architectures"');
  process.exit(1);
}

// Convert title to URL-safe slug
function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const slug = slugify(rawTitle);
const targetDir = path.join(SLIDES_DIR, slug);

if (fs.existsSync(targetDir)) {
  console.error(`[error] Presentation folder already exists: slides/${slug}`);
  process.exit(1);
}

// Ensure directory exists
fs.mkdirSync(targetDir, { recursive: true });

// Current month and year
const now = new Date();
const dateStr = `${now.toLocaleString('en-US', { month: 'long' })} ${now.getFullYear()}`;

// Template content
const slideContent = `---
theme: default
title: ${rawTitle}
description: Interactive presentation on ${rawTitle}.
tags: [Keynote, Architecture]
author: Research Team
date: ${dateStr}
order: 99
background: '#141413'
class: text-left
highlighter: shiki
lineNumbers: false
---

<div class="my-auto py-12">
  <span class="claude-badge mb-6">Briefing</span>
  <h1 class="text-6xl mb-4 font-normal">
    ${rawTitle}
  </h1>
  <p class="text-xl text-[#a8a29e] max-w-xl font-light leading-relaxed mb-8">
    Executive summary and core objectives of this briefing.
  </p>
  <div class="flex gap-6 text-sm text-[#78716c] font-mono">
    <span>${dateStr}</span>
  </div>
</div>

---

<div class="py-6">
  <span class="claude-badge mb-4">Analysis</span>
  <h2 class="text-4xl mb-8">Core Pillars</h2>

  <div class="grid grid-cols-2 gap-6">
    <div class="claude-box">
      <h3 class="text-xl mb-3 text-[#faf9f5]">Primary Vector</h3>
      <p class="text-sm text-[#a8a29e] leading-relaxed">
        Key architectural decisions and structural foundations.
      </p>
    </div>

    <div class="claude-box">
      <h3 class="text-xl mb-3 text-[#faf9f5]">Execution Framework</h3>
      <p class="text-sm text-[#a8a29e] leading-relaxed">
        Operational principles and forward-looking capabilities.
      </p>
    </div>
  </div>
</div>
`;

// Shared stylesheet content
const styleContent = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&display=swap');

:root {
  --slidev-theme-primary: #d97757;
  --slidev-theme-accents: #e28768;
}

.slidev-layout {
  background-color: #141413 !important;
  color: #cec9bf !important;
  font-family: 'Inter', -apple-system, sans-serif;
}

h1, h2, h3 {
  font-family: 'Newsreader', Georgia, serif !important;
  color: #faf9f5 !important;
  letter-spacing: -0.02em;
}

h1 { font-weight: 400; }
h2 { font-weight: 500; }

.claude-box {
  background-color: #1d1c1a;
  border: 1px solid rgba(235, 233, 227, 0.08);
  border-radius: 12px;
  padding: 1.5rem;
}

.claude-badge {
  display: inline-block;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #e28768;
  background-color: rgba(217, 119, 87, 0.12);
  border: 1px solid rgba(217, 119, 87, 0.25);
  border-radius: 9999px;
  padding: 0.25rem 0.75rem;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
}

.metric-number {
  font-family: 'Newsreader', Georgia, serif;
  font-size: 3rem;
  color: #faf9f5;
  line-height: 1;
}
`;

fs.writeFileSync(path.join(targetDir, 'slides.md'), slideContent, 'utf-8');
fs.writeFileSync(path.join(targetDir, 'style.css'), styleContent, 'utf-8');

console.log(`[create] New presentation initialized at slides/${slug}/`);
console.log(`[create] To start live preview:`);
console.log(`         npm run dev slides/${slug}/slides.md`);

