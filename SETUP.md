# 🛠️ FleetFlow — Setup & Execution Guide

This document provides step-by-step instructions on setting up, configuring, running, and verifying the **FleetFlow Enterprise Vehicle Command Center** across all microservices (Node.js Backend, React Frontend, and Python FastAPI AI Microservice).

---

## 📋 Prerequisites

Before setting up FleetFlow locally, ensure you have the following software installed on your machine:

| Dependency | Minimum Required Version | Purpose |
|---|---|---|
| **Node.js** | `v18.x` or `v20.x` | Runtime for Backend API and Frontend Vite Dev Server |
| **npm** | `v9.x` or `v10.x` | Package manager for frontend and backend dependencies |
| **MongoDB** | `v6.0+` (Local or Atlas) | Primary database for storing vehicles, users, and invoices |
| **Python** | `v3.10+` | Runtime for FastAPI AI & ChromaDB microservice |
| **Docker & Docker Compose** *(Optional)* | `v24.x+` | Containerized setup for running all microservices |

---

## ⚙️ Environment Variables Configuration

Create `.env` configuration files for each component of the application:

### 1. Backend Environment File (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/fleetflow
JWT_SECRET=fleetflow_super_secret_jwt_key_2026
CLIENT_URL=http://localhost:5173
AI_SERVICE_URL=http://localhost:8000
```

### 2. Frontend Environment File (`frontend/.env`)
```env
VITE_BACKEND_URL=http://localhost:5000
VITE_AI_SERVICE_URL=http://localhost:8000
```

### 3. AI Microservice Environment File (`ai-service/.env`)
```env
PORT=8000
CHROMA_DB_DIR=./chroma_data
OPENAI_API_KEY=optional_openai_key_if_using_gpt
EMBEDDING_MODEL=all-MiniLM-L6-v2
```

---

## 🚀 Local Development Setup (Step-by-Step)

Follow these steps to set up and seed the project locally:

### Step 1: Clone the Repository
```bash
git clone https://github.com/GVBharadwaj18/FleetFlow.git
cd FleetFlow
```

### Step 2: Install & Seed Backend Service
```bash
cd backend

# Install Node dependencies
npm install

# Seed database with Bengaluru fleet data, Indian vehicles, and demo users
node seed.js
```

*Console output upon successful seeding:*
```text
✔ Database connected successfully
✔ Created demo users (Admin, Mechanic, Driver)
✔ Created 5 customer organizations/owners
✔ Created 6 fleet vehicles (Tata, Mahindra, Ashok Leyland, Eicher)
✔ Created inventory parts with low-stock warnings
✔ Created maintenance records, bills, and invoices
✔ Created active roadside assistance dispatches
🎉 FleetFlow Database Seeded Successfully!
```

### Step 3: Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### Step 4: Install Python AI Microservice Dependencies
```bash
cd ../ai-service

# Create Python virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
# On macOS / Linux:
source .venv/bin/activate

# Install required Python packages
pip install -r requirements.txt
```

---

## 🏃 How to Run the Application (Post-Setup)

Once setup and database seeding are complete, follow these instructions to launch the services:

### Method 1: Running Individual Microservices (Local Development)

Open 3 terminal windows to run all 3 microservices simultaneously:

#### Terminal 1: Start Backend API & Telemetry WebSocket Stream
```bash
cd backend
npm run dev
# Server listening on http://localhost:5000
# WebSockets active on ws://localhost:5000
```

#### Terminal 2: Start Frontend Web App
```bash
cd frontend
npm run dev
# React Vite App running on http://localhost:5173 (or http://localhost:5174)
```

#### Terminal 3: Start FastAPI AI Microservice
```bash
cd ai-service
# Activate virtual environment first (.venv\Scripts\activate or source .venv/bin/activate)
uvicorn main:app --reload --port 8000
# FastAPI service running on http://localhost:8000
# Swagger API docs available at http://localhost:8000/docs
```

---

### Method 2: Running with Docker Compose (1-Command Orchestration)

If you prefer containerized deployment, run the entire stack using Docker Compose:

```bash
# Build and launch all containerized microservices
docker compose up --build
```

**Exposed Docker Services & Ports:**
- **Frontend App**: `http://localhost` (or `http://localhost:5173`)
- **Backend Express API**: `http://localhost:5000`
- **FastAPI AI Microservice**: `http://localhost:8000`
- **MongoDB**: `localhost:27017`

---

## 🎯 Post-Setup Action & Verification Steps

After starting the application, perform these verification steps in your browser:

### 1. Sign In & Test Demo Accounts
1. Navigate to `http://localhost:5173/` in your browser.
2. Click any of the **Instant Demo Login** buttons on the sign-in screen:
   - **⚡ Sign in as Admin** (`admin@fleetflow.com / admin123`)
   - **🔧 Sign in as Mechanic** (`mechanic@fleetflow.com / mechanic123`)
   - **🚚 Sign in as Driver** (`driver@fleetflow.com / driver123`)
3. Verify that you are redirected to the **FleetFlow Dashboard** (`/dashboard`).

### 2. Verify Live GPS Telemetry Map
1. Click **Live GPS Map** in the left sidebar menu (`/live-map`).
2. Observe real-time vehicle GPS coordinates updating dynamically around **Bengaluru, Karnataka** (MG Road, Koramangala, Indiranagar, Whitefield, Electronic City, Hebbal).
3. Click any vehicle pin on the map to inspect speed, fuel level, battery level, and OBD-II fault codes.

### 3. Test RAG AI Diagnostic Assistant
1. Click the floating **AI Drawer Icon** at the bottom-right corner of any screen.
2. Ask diagnostic queries such as:
   - *"How do I fix P0300 Engine Misfire on a Tata Prima truck?"*
   - *"What is the recommended brake pad replacement procedure?"*
3. Verify that the AI returns structured answers with semantic relevance citations.

---

## 🔍 Port Mapping & Application Routes

| Path / Endpoint | Microservice | Description |
|---|---|---|
| `http://localhost:5173/` | Frontend | Sign In & Authentication Page |
| `http://localhost:5173/dashboard` | Frontend | Fleet Command Center & Analytics Dashboard |
| `http://localhost:5173/live-map` | Frontend | Real-time WebSocket GPS Telemetry Map |
| `http://localhost:5173/api-docs` | Frontend | Interactive REST API Documentation Explorer |
| `http://localhost:5000/api/auth/login` | Backend API | User Login & JWT Token Generator |
| `http://localhost:5000/api/vehicles` | Backend API | Vehicles CRUD API |
| `http://localhost:8000/docs` | AI Service | FastAPI Swagger API Explorer |
| `http://localhost:8000/predict/maintenance` | AI Service | Predictive Health Score & RUL API |

---

## ❓ Troubleshooting & Frequently Asked Questions (FAQ)

### Q1: The backend throws `EADDRINUSE: address already in use :::5000`
**Solution**: Another process is already running on port 5000. Terminate the process using:
- **Windows**: `netstat -ano | findstr :5000` then `taskkill /PID <PID> /F`
- **macOS / Linux**: `kill -9 $(lsof -t -i:5000)`

### Q2: MongoDB connection error `MongooseServerSelectionError`
**Solution**: Ensure local MongoDB service is running (`mongod` or MongoDB Compass), or update `MONGO_URI` in `backend/.env` to point to a MongoDB Atlas cluster URI.

### Q3: Login shows "User not found"
**Solution**: Run `node seed.js` inside the `backend/` directory to seed the default demo accounts, or click any of the 1-click **Instant Demo Login** buttons on the sign-in page.

### Q4: CORS blocked request in browser console
**Solution**: Ensure `CLIENT_URL=http://localhost:5173` is correctly specified in `backend/.env` and that backend CORS middleware is enabled.

---

## 📄 License
This project is licensed under the **MIT License**.
