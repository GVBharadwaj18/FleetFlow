# FleetFlow

FleetFlow is a full-stack fleet and vehicle service management platform built for garages, rental fleets, and maintenance teams. It combines a modern React frontend, a Node.js/Express backend, and a Python AI service for predictive maintenance and intelligent support.

## What FleetFlow does

- Manage vehicles, customers, and maintenance records
- Track invoices, bills, and service items
- Handle roadside assistance requests and appointments
- Provide dashboards for operations and service status
- Use AI to forecast maintenance needs and answer vehicle-related questions through a RAG assistant

## Core modules

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express + MongoDB + Mongoose + JWT
- AI service: FastAPI + Chroma + predictive maintenance endpoints + RAG query support

## Project structure

```bash
FleetFlow/
├── frontend/          # React web app
├── backend/           # Express REST API and MongoDB models
├── ai-service/        # Python FastAPI microservice for AI features
└── README.md
```

## Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB instance (local or Atlas)
- Optional: OpenAI API key for enhanced AI features

## Getting started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd FleetFlow
```

### 2. Start the backend

```bash
cd backend
npm install
cp .env.example .env  # if available
npm run dev
```

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Start the AI service

```bash
cd ai-service
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Environment variables

Example variables for the backend and AI service:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/fleetflow
JWT_SECRET=your-secret-key
AI_SERVICE_URL=http://localhost:8000
```

## Testing

```bash
cd backend
npm test
```

Frontend tests can be run with:

```bash
cd frontend
npm test
```

## Notes

FleetFlow is designed as a practical full-stack application for fleet operations, maintenance workflows, and AI-assisted decision support. It can be extended with reporting, inventory control, and deeper automation.
