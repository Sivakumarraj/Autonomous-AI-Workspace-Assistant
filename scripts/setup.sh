#!/bin/bash
# Setup script for AI Workspace Automation

echo "🚀 Setting up AI Workspace Automation..."

# Create directories
mkdir -p uploads/{pdfs,docs,images,temp}
mkdir -p vector_store
mkdir -p logs/{api_logs,workflow_logs,error_logs}

# Backend setup
echo "📦 Setting up backend..."
cd backend
python -m venv venv
source venv/bin/activate || venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env 2>/dev/null || true

# Frontend setup
echo "📦 Setting up frontend..."
cd ../frontend
npm install

echo "✅ Setup complete!"
echo ""
echo "To start the backend:  cd backend && uvicorn app.main:app --reload"
echo "To start the frontend: cd frontend && npm run dev"
