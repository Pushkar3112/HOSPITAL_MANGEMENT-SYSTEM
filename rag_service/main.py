from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import logging
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="HMS RAG Service", version="2.0.0", description="Hybrid RAG pipeline for MedCare HMS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG pipeline
rag_pipeline = None


@app.on_event("startup")
async def startup_event():
    global rag_pipeline
    try:
        from rag_pipeline import RAGPipeline
        logger.info("🚀 Initializing RAG pipeline...")
        rag_pipeline = RAGPipeline()
        rag_pipeline.initialize()
        logger.info("✅ RAG pipeline ready")
    except Exception as e:
        logger.error(f"❌ Failed to initialize RAG pipeline: {e}")
        # Don't crash — allow health check to report offline


class ChatRequest(BaseModel):
    query: str
    conversation_history: Optional[List[Dict[str, str]]] = []
    user_id: Optional[str] = None


class SearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5


class ChatResponse(BaseModel):
    answer: str
    sources: List[str]
    query_type: str
    confidence: float


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not rag_pipeline:
        raise HTTPException(status_code=503, detail="RAG pipeline not initialized")
    try:
        result = rag_pipeline.query(request.query, request.conversation_history)
        return ChatResponse(
            answer=result["answer"],
            sources=result.get("sources", []),
            query_type=result.get("query_type", "general"),
            confidence=result.get("confidence", 0.8),
        )
    except Exception as e:
        logger.error(f"Error in /chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search")
async def search(request: SearchRequest):
    if not rag_pipeline:
        raise HTTPException(status_code=503, detail="RAG pipeline not initialized")
    try:
        dense = rag_pipeline._dense_retrieve(request.query, k=request.top_k)
        sparse = rag_pipeline._sparse_retrieve(request.query, k=request.top_k)
        fused = rag_pipeline._rrf_fusion(dense, sparse, top_n=request.top_k)
        results = [
            {
                "content": doc.page_content,
                "source": doc.metadata.get("source", ""),
                "category": doc.metadata.get("category", ""),
            }
            for doc in fused
        ]
        return {"results": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {
        "status": "healthy" if rag_pipeline else "initializing",
        "pipeline_ready": rag_pipeline is not None,
        "model": "llama3-8b-8192",
        "retrieval": "hybrid (BM25 + ChromaDB) + RRF + reranking",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
