# Technology Stack

## Framework & Runtime

- **Next.js 15.2.4** - React framework with App Router
- **React 18.3.1** - UI library
- **TypeScript 5** - Type safety
- **Node.js** - Runtime environment

## Styling & UI

- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Radix UI** - Headless UI components
- **Framer Motion** - Animation library
- **React Spring** - Physics-based animations
- **Lucide React** - Icon library

## Database & AI

- **TiDB (MySQL2)** - Vector database for embeddings
- **Google Gemini 2.0 Flash** - LLM for chat responses
- **Gemini Embedding API** - Text embeddings for RAG

## Key Libraries

- **LangChain** - Multiple AI provider integrations
- **React Hook Form + Zod** - Form handling and validation
- **Date-fns** - Date formatting with Thai locale
- **React Markdown** - Markdown rendering
- **Axios** - HTTP client

## Development Tools

- **ESLint** - Code linting (build errors ignored)
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

## Common Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Package Management
npm install          # Install dependencies
# Note: Project uses both npm and pnpm lock files
```

## Environment Variables Required

- `GEMINI_API_KEY` - Primary Gemini API key
- `GEMINI_API_KEY_1,2,3` - Additional keys for rotation
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - TiDB connection

## Build Configuration

- **Standalone output** for containerization
- **TypeScript/ESLint errors ignored** during builds
- **Memory optimizations** enabled
- **Source maps disabled** in production
