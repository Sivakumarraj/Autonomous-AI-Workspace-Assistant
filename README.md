# AI Workspace Automation - Nexus AI

A full-stack AI workspace assistant with autonomous capabilities for document processing, conversational AI, workflow automation, and memory management.

## 🚀 Features

- **Dashboard** — Real-time overview of workspace activity, stats, and quick actions
- **AI Chat** — Multi-turn conversations with context-aware AI responses
- **File Manager** — Upload, process, and manage documents with AI indexing
- **Memory** — Persistent AI memory that learns from your interactions
- **Workflows** — Automated multi-step AI task pipelines
- **System Logs** — Real-time audit trail of all workspace activities
- **Settings** — Configure API keys, model routing, and AI behavior

## 🏗️ Architecture

```
ai-workspace-automation/
├── frontend/          # Next.js 15 + TypeScript + Tailwind CSS
├── backend/           # FastAPI + Python AI agents
├── uploads/           # File storage
├── vector_store/      # Embedding vector store
├── logs/              # Application logs
├── scripts/           # Setup and migration scripts
├── docs/              # Documentation
└── docker/            # Docker configuration
```

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Docker
```bash
cd docker
docker-compose up -d
```

## 📖 Documentation

- [Architecture](docs/architecture.md)
- [API Documentation](docs/api_docs.md)
- [Deployment Guide](docs/deployment.md)
- [Workflow Design](docs/workflow_design.md)

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Zustand |
| Backend | FastAPI, Python 3.11 |
| AI | OpenAI GPT-4o, Anthropic Claude, Google Gemini |
| Vector Store | ChromaDB |
| Database | SQLite / PostgreSQL |
| Deployment | Docker, Vercel, Render |

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.
