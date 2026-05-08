# Deployment Guide

## Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose (optional)

## Local Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Docker Deployment

```bash
cd docker
docker-compose up -d
```

## Production

### Environment Variables
Set all environment variables in `backend/.env` for production:
- Change `SECRET_KEY` to a secure random string
- Set real API keys for OpenAI, Anthropic, Gemini
- Configure `DATABASE_URL` for PostgreSQL
- Set `FRONTEND_URL` for CORS

### Build Frontend
```bash
cd frontend
npm run build
```

### Run Backend
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```
