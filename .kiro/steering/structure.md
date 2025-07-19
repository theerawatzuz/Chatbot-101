# Project Structure

## Root Configuration

- `package.json` - Dependencies and scripts
- `next.config.js/mjs` - Next.js configuration with user config merging
- `tsconfig.json` - TypeScript configuration with path aliases (`@/*`)
- `tailwind.config.ts` - Tailwind CSS with custom theme and animations
- `middleware.ts` - Next.js middleware
- `Dockerfile` & `docker-compose.yml` - Containerization setup

## Application Structure (`app/`)

```
app/
├── layout.tsx          # Root layout with Thai/English font setup
├── page.tsx           # Main chat interface (1000+ lines)
├── globals.css        # Global styles
├── api/               # API routes
│   ├── chat/          # Chat endpoint for both AI modes
│   ├── add-document/  # Document addition to knowledge base
│   ├── documents/     # Document CRUD operations
│   └── embeddings/    # Embedding generation
├── plan/              # Additional pages
└── talk/
```

## Component Architecture (`components/`)

```
components/
├── ui/                # Radix UI components (40+ files)
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   └── ...           # Complete shadcn/ui component library
├── chat/
│   └── ChatMessage.tsx
└── theme-provider.tsx # Dark/light theme provider
```

## Business Logic (`lib/`)

```
lib/
├── db.ts             # TiDB connection and vector operations
├── embeddings.ts     # Gemini embedding generation with API rotation
├── gemini-api.ts     # Chat response generation with memory
├── documents.ts      # Document management utilities
└── utils/
    ├── date.ts       # Date formatting utilities
    └── utils.ts      # General utilities (cn, etc.)
```

## Shared Resources

```
hooks/               # Custom React hooks
├── useKnowledgeBase.ts
├── use-mobile.tsx
└── use-toast.ts

types/               # TypeScript type definitions
└── index.ts         # Message and KnowledgeItem interfaces

public/              # Static assets
├── favicon.ico
└── placeholder-*    # Image placeholders

styles/              # Additional stylesheets
└── globals.css
```

## Key Architectural Patterns

- **API Routes**: RESTful endpoints in `app/api/`
- **Component Composition**: Radix UI + custom components
- **State Management**: React hooks with local state
- **Database Layer**: Connection pooling with TiDB
- **Error Handling**: Try-catch with user-friendly messages
- **Mobile Optimization**: iOS-specific viewport and keyboard handling
- **Internationalization**: Thai primary, English fallback
