"""
VMS AI Microservice — FastAPI Entry Point
"""
from __future__ import annotations
import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers.predict import router as predict_router
from routers.rag     import router as rag_router

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: warm up ChromaDB client."""
    from utils.chroma_client import get_or_create_collection
    try:
        col = get_or_create_collection()
        logger.info(f"ChromaDB ready — {col.count()} chunks indexed")
    except Exception as e:
        logger.warning(f"ChromaDB warmup skipped: {e}")
    yield
    logger.info("AI microservice shutting down")


app = FastAPI(
    title="VMS AI Microservice",
    description=(
        "Predictive maintenance forecasting, inventory optimisation, "
        "and RAG-powered vehicle manual Q&A."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Allow the Node.js backend and local Vite dev server
allowed_origins = [
    "http://localhost:5000",   # Node.js backend
    "http://localhost:5173",   # Vite dev
    os.getenv("FRONTEND_URL", "http://localhost:5173"),
    os.getenv("BACKEND_URL",  "http://localhost:5000"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(predict_router)
app.include_router(rag_router)


@app.get("/")
async def root():
    return {
        "service": "VMS AI Microservice",
        "version": "1.0.0",
        "status":  "operational",
        "endpoints": ["/predict/maintenance", "/predict/inventory", "/rag/query", "/rag/ingest"],
    }


@app.get("/health")
async def health():
    from utils.chroma_client import get_or_create_collection
    try:
        col = get_or_create_collection()
        chroma_ok = True
        chunks    = col.count()
    except Exception:
        chroma_ok = False
        chunks    = 0

    return {
        "status":       "ok",
        "chromadb":     chroma_ok,
        "chunksIndexed": chunks,
        "openai":       bool(os.getenv("OPENAI_API_KEY")),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("AI_SERVICE_PORT", 8000)),
        reload=True,
    )
