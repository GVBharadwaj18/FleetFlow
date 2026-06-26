"""
ChromaDB singleton client — persists embeddings to ./chroma_db/
"""
from __future__ import annotations
from typing import Optional
import chromadb
from chromadb.config import Settings
import logging

logger = logging.getLogger("chroma_client")

_client: Optional[chromadb.PersistentClient] = None
COLLECTION_NAME = "vms_vehicle_manuals"


def get_chroma_client() -> chromadb.PersistentClient:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(
            path="./chroma_db",
            settings=Settings(anonymized_telemetry=False),
        )
        logger.info("ChromaDB client initialised at ./chroma_db")
    return _client


def get_or_create_collection():
    client = get_chroma_client()
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )
    return collection
