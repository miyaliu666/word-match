# Word Match

A vocabulary match game for language learners. Swap words on a grid to match at least 3 words in a line.

## Prerequisites

- Node.js >= 18
- pnpm

## Quick Start

```bash
pnpm install
pnpm dev
```

Open `http://localhost:8000`.

## Scripts

```bash
pnpm dev        # start local development server
pnpm test       # run unit tests
pnpm typecheck  # run TypeScript checks
pnpm build      # build production assets
```

## Project Structure

```text
├── scripts/                 # helper scripts for QA/debug
├── src/
│   ├── app/                 # root app component
│   ├── assets/
│   │   └── audio/           # game sound effects
│   ├── components/          # UI components
│   ├── data/                # glossary datasets, runtime loader, and levels
│   │   └── glossaryChunks/  # CEFR split glossary chunks (A1/A2/B1/B2)
│   ├── game/
│   │   ├── animation/       # shared animation timing constants
│   │   ├── audio/           # audio manager
│   │   ├── engine/          # pure game rules
│   │   └── hooks/           # React controller hooks
│   ├── storage/             # localStorage adapters
│   ├── styles/              # global styles and tokens
│   └── main.tsx             # app entry
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```