# Slide Desk

A curated collection of interactive presentations and technical briefings, built with [Slidev](https://sli.dev) and deployed automatically to GitHub Pages.

Designed with an editorial keynote aesthetic, featuring real-time search, tag filtering, slide count extraction, and keyboard navigation.

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Preview the portal locally

```bash
npm run dev:desk
```

The portal will be accessible at `http://localhost:3000`.

### 3. Create a new presentation

Generate a ready-to-use presentation scaffold with a single command:

```bash
npm run new "Autonomous Systems Architecture"
```

This automatically creates `slides/autonomous-systems-architecture/slides.md` and `style.css` pre-configured with the keynote theme.

### 4. Edit with Live Reload (HMR)

Launch the Slidev interactive development server with hot module replacement:

```bash
npm run dev slides/autonomous-systems-architecture/slides.md
```

The presentation will be live at `http://localhost:3030`.

---

## Presentation Metadata (Frontmatter)

Each presentation folder in `slides/<folder>/slides.md` defines its metadata in YAML frontmatter. The portal automatically extracts and indexes these properties:

```yaml
---
theme: default
title: Autonomous Systems Architecture
description: Comprehensive review of agent orchestration and alignment protocols.
tags: [Architecture, Systems, Keynote]
author: Research Team
date: October 2026
order: 1
background: '#141413'
class: text-left
---
```

### Supported Metadata Fields

| Field | Description | Default |
| :--- | :--- | :--- |
| `title` | Title displayed on the portal card and browser tab. | First markdown `# Header` |
| `description` | Summary shown on the presentation card. | First markdown paragraph |
| `tags` | Array of topics for filtering (e.g. `[AI, Design]`). | `["Slidev"]` |
| `author` | Author or team name displayed on the card footer. | `""` |
| `date` | Presentation date string (e.g. `October 2026`). | File modified date |
| `order` | Integer priority to pin or sort cards (1 = first). | `999` |
| `cover` | Path to an optional cover thumbnail image. | `""` |

---

## Project Structure

```text
my-slidesk/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions automated deployment
├── .gitignore                  # Clean gitignore rules
├── package.json                # Project dependencies and scripts
├── README.md                   # Project documentation
├── scripts/
│   ├── build.mjs               # Automated catalog builder & Slidev compiler
│   └── new-presentation.mjs    # Scaffold generator for new slide decks
├── slides/                     # Presentation decks directory
│   └── demo-presentation/
│       ├── slides.md           # Slide deck markdown source
│       └── style.css           # Presentation styles
└── src/
    └── index.html              # Portal source template
```

---

## Deployment to GitHub Pages

Deployments are fully automated via GitHub Actions:

1. Push your changes to the `main` branch:
   ```bash
   git add .
   git commit -m "feat: add new briefing deck"
   git push origin main
   ```
2. The workflow in `.github/workflows/deploy.yml` will:
   * Scan all decks in `slides/`.
   * Extract metadata and generate `dist/slides.json`.
   * Compile each slide deck with the correct base path.
   * Publish the entire `dist/` directory to GitHub Pages.

---

## Keyboard Shortcuts on Portal

* <kbd>/</kbd> : Focus the search input from anywhere on the page.
* <kbd>Esc</kbd> : Clear current search query and reset active filters.

