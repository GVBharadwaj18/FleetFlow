"""
RAG (Retrieval-Augmented Generation) router
Supports PDF ingestion and natural-language querying of vehicle manuals
"""
import os
import uuid
import logging
import tempfile
from typing import Optional

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse

from models.schemas import RAGQueryRequest, RAGQueryResponse, RAGSource, IngestResponse
from utils.chroma_client import get_or_create_collection

router = APIRouter(prefix="/rag", tags=["rag"])
logger = logging.getLogger("rag")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
EMBED_MODEL    = os.getenv("EMBED_MODEL", "text-embedding-3-small")
CHAT_MODEL     = os.getenv("CHAT_MODEL", "gpt-4o-mini")
USE_LOCAL_LLM  = os.getenv("USE_LOCAL_LLM", "false").lower() == "true"


# ─── Embedding helpers ────────────────────────────────────────────────────────

def get_embedder():
    """Return a LangChain embeddings object. Prefer OpenAI; fall back to HuggingFace."""
    if OPENAI_API_KEY and not USE_LOCAL_LLM:
        from langchain_openai import OpenAIEmbeddings
        return OpenAIEmbeddings(model=EMBED_MODEL, api_key=OPENAI_API_KEY)
    else:
        # Free local fallback – uses sentence-transformers (no API key needed)
        try:
            from langchain_community.embeddings import HuggingFaceEmbeddings
            return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        except ImportError:
            raise RuntimeError(
                "No embedding provider available. "
                "Set OPENAI_API_KEY or install sentence-transformers."
            )


def get_llm():
    """Return a LangChain LLM for answer generation."""
    if OPENAI_API_KEY and not USE_LOCAL_LLM:
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(model=CHAT_MODEL, api_key=OPENAI_API_KEY, temperature=0.2)
    else:
        try:
            from langchain_community.llms import Ollama
            return Ollama(model=os.getenv("OLLAMA_MODEL", "llama3.2"))
        except ImportError:
            return None


# ─── PDF Ingestion ─────────────────────────────────────────────────────────────

@router.post("/ingest", response_model=IngestResponse)
async def ingest_pdf(
    file: UploadFile = File(...),
    vehicleModel: Optional[str] = Form(None),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=422, detail="Only PDF files are accepted")

    try:
        from pypdf import PdfReader
        from langchain.text_splitter import RecursiveCharacterTextSplitter

        # Save upload to temp file
        content = await file.read()
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        # Extract text from all pages
        reader = PdfReader(tmp_path)
        os.unlink(tmp_path)

        full_text = ""
        page_map: dict[int, str] = {}
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            page_map[i + 1] = page_text
            full_text += f"\n\n[Page {i+1}]\n{page_text}"

        # Chunk text
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=100,
            separators=["\n\n", "\n", ". ", " ", ""],
        )
        chunks = splitter.split_text(full_text)

        if not chunks:
            raise HTTPException(status_code=422, detail="No extractable text found in PDF")

        # Embed and store in ChromaDB
        embedder = get_embedder()
        collection = get_or_create_collection()

        ids       = [str(uuid.uuid4()) for _ in chunks]
        metadatas = [
            {
                "documentName": file.filename,
                "vehicleModel": vehicleModel or "unknown",
                "chunkIndex":   i,
            }
            for i in range(len(chunks))
        ]

        embeddings = embedder.embed_documents(chunks)

        collection.add(
            ids=ids,
            documents=chunks,
            metadatas=metadatas,
            embeddings=embeddings,
        )

        logger.info(f"Ingested {len(chunks)} chunks from {file.filename}")
        return IngestResponse(
            success=True,
            chunksIndexed=len(chunks),
            documentName=file.filename,
            message=f"Successfully indexed {len(chunks)} chunks from {file.filename}",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ingestion failed: {e}")
        raise HTTPException(status_code=500, detail=f"Ingestion error: {str(e)}")


# ─── RAG Query ────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are VMS-AI, an expert automotive technician assistant.
Answer the user's question using ONLY the provided context excerpts from vehicle service manuals.
If the context doesn't contain enough information, say so clearly rather than guessing.
Be concise, structured, and cite which document each piece of information comes from.
Format your answer with clear sections if the answer is complex."""


@router.post("/query", response_model=RAGQueryResponse)
async def rag_query(req: RAGQueryRequest):
    if not req.question.strip():
        raise HTTPException(status_code=422, detail="Question cannot be empty")

    try:
        embedder   = get_embedder()
        collection = get_or_create_collection()

        # Check collection is populated
        if collection.count() == 0:
            return RAGQueryResponse(
                answer="No vehicle manuals have been ingested yet. Please upload a PDF manual first using the Upload Manual feature.",
                sources=[],
                modelUsed="none",
            )

        # Embed the question
        query_embedding = embedder.embed_query(req.question)

        # Build optional vehicle filter
        where_filter = None
        if req.vehicleModel:
            where_filter = {"vehicleModel": {"$eq": req.vehicleModel}}

        # Retrieve top-K chunks
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(req.topK or 5, collection.count()),
            where=where_filter,
            include=["documents", "metadatas", "distances"],
        )

        docs      = results.get("documents", [[]])[0]
        metas     = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        if not docs:
            return RAGQueryResponse(
                answer="No relevant information found in the knowledge base for your query.",
                sources=[],
                modelUsed="none",
            )

        # Build context string
        context_parts = []
        sources: list[RAGSource] = []
        for doc, meta, dist in zip(docs, metas, distances):
            relevance = max(0.0, 1.0 - float(dist))
            context_parts.append(
                f"[Source: {meta.get('documentName','unknown')}, Chunk {meta.get('chunkIndex','')}]\n{doc}"
            )
            sources.append(RAGSource(
                documentName=meta.get("documentName", "unknown"),
                pageNumber=None,
                excerpt=doc[:200] + ("..." if len(doc) > 200 else ""),
                relevance=round(relevance, 3),
            ))

        context = "\n\n---\n\n".join(context_parts)

        # Generate answer with LLM
        llm = get_llm()
        if llm is None:
            # Graceful fallback: return raw context excerpt
            answer = (
                "AI generation not available (no API key or local LLM configured). "
                "Here is the most relevant excerpt:\n\n" + docs[0][:600]
            )
            model_used = "fallback-excerpt"
        else:
            from langchain.schema import SystemMessage, HumanMessage
            messages = [
                SystemMessage(content=SYSTEM_PROMPT),
                HumanMessage(content=f"Context:\n{context}\n\nQuestion: {req.question}"),
            ]
            response = llm.invoke(messages)
            answer = response.content if hasattr(response, "content") else str(response)
            model_used = CHAT_MODEL if OPENAI_API_KEY else "ollama"

        return RAGQueryResponse(
            answer=answer,
            sources=sources,
            modelUsed=model_used,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"RAG query failed: {e}")
        raise HTTPException(status_code=500, detail=f"Query error: {str(e)}")
