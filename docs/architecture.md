# Architecture Overview

## System Architecture

The AI Workspace Automation platform follows a modern full-stack architecture with clear separation of concerns.

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │Dashboard │ │ AI Chat  │ │  Files   │ │Workflows │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘   │
│       └─────────────┴────────────┴─────────────┘         │
│                         │ REST API                        │
└─────────────────────────┼────────────────────────────────┘
                          │
┌─────────────────────────┼────────────────────────────────┐
│                    Backend (FastAPI)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  Agents  │ │  Tools   │ │ Services │ │   RAG    │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘   │
│       └─────────────┴────────────┴─────────────┘         │
│                         │                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│  │ Database │ │  Vector  │ │  Memory  │                 │
│  │ (SQLite) │ │  Store   │ │  Store   │                 │
│  └──────────┘ └──────────┘ └──────────┘                 │
└──────────────────────────────────────────────────────────┘
```

## Key Components

### Frontend
- **Next.js 15** with App Router and TypeScript
- **Zustand** for state management
- **Tailwind CSS** for styling
- Component-based architecture with reusable UI elements

### Backend
- **FastAPI** for REST API
- **AI Agents** for task orchestration (Planner, Memory, Workflow, Browser, RAG)
- **RAG Pipeline** for document-based Q&A
- **Vector Store** for semantic search

### Data Flow
1. User interacts with the frontend
2. Frontend sends API requests to the backend
3. Backend routes requests to appropriate agents/services
4. Agents use tools and services to process requests
5. Results are returned to the frontend for display
