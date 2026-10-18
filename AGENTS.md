# CapAble — AI Agent Instructions

> This file is loaded automatically by Claude (Anthropic) and Gemini (via Antigravity IDE).
> All agents working in this workspace MUST read this file first.

## Project Overview

**CapAble** is a React 19 + Vite SPA (TypeScript) for campus placement intelligence.
It connects students, employers, institutions, faculty, and academicians.

## Tech Stack (DO NOT DEVIATE)

| Layer | Tech |
|---|---|
| Framework | React 19 + Vite 8 |
| Language | TypeScript |
| Styling | Vanilla CSS with design tokens (src/styles/tokens.css) |
| Animations | Framer Motion v13 |
| Icons | lucide-react |
| Backend | Firebase (Firestore, Auth, Storage) |
| Express API | server/ directory, port 5000 |
| AI | Gemini via src/lib/gemini.ts |

## Absolute Rules

1. NO Tailwind CSS — all styles must use CSS variables from tokens.css
2. NO path aliases (@/) — use relative imports only
3. NO shadcn CLI — use Radix UI primitives unstyled if needed
4. Always read src/styles/tokens.css before writing any CSS
5. Design tokens first — never hardcode colors; use var(--color-*) tokens

## File Conventions

- Pages: src/pages/{role}/{PageName}.tsx + co-located {PageName}.css
- Services: src/services/{domain}Service.ts
- Components: src/components/{category}/{ComponentName}.tsx
- Styles: src/styles/ (global tokens, utilities)

## Before ANY UI Work

1. Read DESIGN_SYSTEM.md for the full design language
2. Read COMPONENT_CATALOG.md for existing reusable components
3. Read .agents/skills/ui-ux-expert/SKILL.md for the full UI/UX decision framework
4. Never recreate a component that already exists in src/components/

## Firestore Rules

- Composite queries (where + orderBy) require composite indexes
- Always prefer client-side sort/filter for small collections to avoid index failures
- Index file: firestore.indexes.json

## Running the App

npm run dev:all   # starts Vite (port 5173) + Express API (port 5000)

Python ArcLight API: python -m uvicorn main:app --port 8000 from ArcLight/ dir.
