import os
import json
from pathlib import Path
from typing import List, Dict, Any, Optional, TypedDict, Annotated
import operator

from langchain_groq import ChatGroq
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_community.vectorstores import Chroma
try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:
    from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage, SystemMessage
from rank_bm25 import BM25Okapi
from langgraph.graph import StateGraph, END

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RAGState(TypedDict):
    query: str
    query_type: str
    conversation_history: List[Dict[str, str]]
    dense_results: List[Document]
    sparse_results: List[Document]
    reranked_results: List[Document]
    answer: str
    sources: List[str]
    confidence: float


class RAGPipeline:
    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.llm = None
        self.embeddings = None
        self.vectorstore = None
        self.bm25 = None
        self.all_documents: List[Document] = []
        self.graph = None

    def initialize(self):
        """Initialize all components of the RAG pipeline."""
        logger.info("Initializing Groq LLM...")
        self.llm = ChatGroq(
            api_key=self.groq_api_key,
            model_name="llama-3.1-8b-instant",
            temperature=0.1,
            max_tokens=1024,
        )

        logger.info("Initializing SentenceTransformer embeddings (local)...")
        self.embeddings = SentenceTransformerEmbeddings(
            model_name="all-MiniLM-L6-v2"
        )

        # Load and index documents
        self._load_documents()
        self._build_vectorstore()
        self._build_bm25()
        self._build_graph()
        logger.info("RAG pipeline fully initialized.")

    def _load_documents(self):
        """Load and chunk all documents from the documents directory."""
        docs_dir = Path(__file__).parent / "documents"
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,
            separators=["\n\n", "\n", ". ", " "],
        )

        for doc_file in docs_dir.glob("*.txt"):
            logger.info(f"Loading document: {doc_file.name}")
            with open(doc_file, "r", encoding="utf-8") as f:
                content = f.read()
            chunks = splitter.create_documents(
                [content],
                metadatas=[{"source": doc_file.name, "category": doc_file.stem}],
            )
            self.all_documents.extend(chunks)

        logger.info(f"Total chunks loaded: {len(self.all_documents)}")

    def _build_vectorstore(self):
        """Build ChromaDB vector store from loaded documents."""
        chroma_dir = Path(__file__).parent / "chroma_db"
        self.vectorstore = Chroma.from_documents(
            self.all_documents,
            self.embeddings,
            collection_name="hms_knowledge_base",
            persist_directory=str(chroma_dir),
        )
        logger.info("ChromaDB vector store built and persisted.")

    def _build_bm25(self):
        """Build BM25 sparse retrieval index."""
        tokenized = [doc.page_content.lower().split() for doc in self.all_documents]
        self.bm25 = BM25Okapi(tokenized)
        logger.info("BM25 sparse index built.")

    def _classify_query(self, query: str) -> str:
        """Classify the query into one of several medical categories."""
        q = query.lower()
        if any(w in q for w in ["timing", "hour", "open", "close", "schedule",
                                  "available", "when", "time", "opd", "emergency",
                                  "visiting", "appointment", "pharmacy"]):
            return "schedule"
        elif any(w in q for w in ["doctor", "specialist", "dr.", "dr ", "fee", "consult",
                                   "appointment", "cardiologist", "neurologist",
                                   "pediatrician", "dermatologist", "psychiatrist",
                                   "gynecologist", "orthopedic", "physician"]):
            return "doctor_info"
        elif any(w in q for w in ["diabetes", "sugar", "insulin", "glucose", "type 1",
                                   "type 2", "hba1c", "diabetic", "hyperglycemia",
                                   "hypoglycemia", "metformin", "ketoacidosis", "ketone"]):
            return "diabetes"
        elif any(w in q for w in ["symptom", "pain", "fever", "headache", "cough", "cold",
                                   "pressure", "heart", "blood pressure", "cholesterol",
                                   "bmi", "stroke", "attack", "flu", "covid", "vaccination",
                                   "sleep", "water", "hydration", "mental", "lab", "test"]):
            return "symptoms"
        elif any(w in q for w in ["hospital", "address", "contact", "phone", "parking",
                                   "insurance", "payment", "upi", "service", "ambulance"]):
            return "hospital_info"
        else:
            return "general"

    def _dense_retrieve(self, query: str, k: int = 6) -> List[Document]:
        """Retrieve documents using dense embeddings (ChromaDB similarity search)."""
        return self.vectorstore.similarity_search(query, k=k)

    def _sparse_retrieve(self, query: str, k: int = 6) -> List[Document]:
        """Retrieve documents using BM25 sparse retrieval."""
        tokens = query.lower().split()
        scores = self.bm25.get_scores(tokens)
        top_indices = sorted(
            range(len(scores)), key=lambda i: scores[i], reverse=True
        )[:k]
        return [self.all_documents[i] for i in top_indices if scores[i] > 0]

    def _rrf_fusion(
        self,
        dense: List[Document],
        sparse: List[Document],
        k: int = 60,
        top_n: int = 5,
    ) -> List[Document]:
        """
        Reciprocal Rank Fusion (RRF) to combine dense and sparse retrieval results.
        RRF score = sum of 1 / (k + rank) for each retrieval list.
        """
        scores: Dict[str, float] = {}
        doc_map: Dict[str, Document] = {}

        for rank, doc in enumerate(dense):
            key = doc.page_content[:120]
            scores[key] = scores.get(key, 0) + 1.0 / (k + rank + 1)
            doc_map[key] = doc

        for rank, doc in enumerate(sparse):
            key = doc.page_content[:120]
            scores[key] = scores.get(key, 0) + 1.0 / (k + rank + 1)
            doc_map[key] = doc

        sorted_keys = sorted(scores, key=lambda x: scores[x], reverse=True)
        return [doc_map[key] for key in sorted_keys[:top_n]]

    def _rerank(self, query: str, docs: List[Document]) -> List[Document]:
        """
        Simple keyword-overlap reranker as a lightweight cross-encoder alternative.
        Scores each doc by the fraction of query words found in document text.
        """
        query_words = set(query.lower().split())

        def score_doc(doc: Document) -> float:
            doc_words = set(doc.page_content.lower().split())
            overlap = len(query_words & doc_words)
            return overlap / (len(query_words) + 1e-9)

        return sorted(docs, key=score_doc, reverse=True)

    def _build_context(self, docs: List[Document], max_docs: int = 4) -> str:
        """Format retrieved documents into a context string for the LLM prompt."""
        parts = []
        for i, doc in enumerate(docs[:max_docs]):
            source = doc.metadata.get("source", "unknown")
            category = doc.metadata.get("category", "")
            parts.append(
                f"[Source {i + 1}: {source} | Category: {category}]\n{doc.page_content}"
            )
        return "\n\n---\n\n".join(parts)

    def _build_graph(self):
        """Build the LangGraph state machine for the RAG pipeline."""

        def analyze_query(state: RAGState) -> RAGState:
            """Node 1: Classify the incoming query."""
            state["query_type"] = self._classify_query(state["query"])
            logger.info(f"Query classified as: {state['query_type']}")
            return state

        def hybrid_retrieve(state: RAGState) -> RAGState:
            """Node 2: Hybrid retrieval — dense + sparse, fused via RRF."""
            query = state["query"]
            dense = self._dense_retrieve(query, k=6)
            sparse = self._sparse_retrieve(query, k=6)
            state["dense_results"] = dense
            state["sparse_results"] = sparse
            fused = self._rrf_fusion(dense, sparse)
            state["reranked_results"] = fused
            logger.info(
                f"Retrieved: dense={len(dense)}, sparse={len(sparse)}, fused={len(fused)}"
            )
            return state

        def rerank_docs(state: RAGState) -> RAGState:
            """Node 3: Rerank fused results using keyword overlap scoring."""
            reranked = self._rerank(state["query"], state["reranked_results"])
            state["reranked_results"] = reranked
            return state

        def generate_answer(state: RAGState) -> RAGState:
            """Node 4: Generate the final answer using Groq LLM."""
            context = self._build_context(state["reranked_results"])
            sources = list(
                set(
                    doc.metadata.get("source", "")
                    for doc in state["reranked_results"]
                )
            )

            # Build conversation history context
            conv_context = ""
            if state.get("conversation_history"):
                recent = state["conversation_history"][-4:]  # Keep last 4 messages
                conv_lines = [
                    f"{m['role'].upper()}: {m['content']}" for m in recent
                ]
                conv_context = (
                    "\n\nPrevious conversation:\n" + "\n".join(conv_lines) + "\n"
                )

            system_prompt = """You are MedBot, a helpful and empathetic medical assistant for MedCare Hospital.

You help patients and visitors with:
- Hospital timings, department information, and services
- Doctor information, specializations, consultation fees, and timings
- Health information about conditions like diabetes, heart disease, and general health
- First aid guidance and when to seek emergency care
- Appointment booking guidance

Guidelines:
- Always be empathetic, professional, and accurate
- Use the provided context to answer questions
- If the answer is not fully in the context, say so clearly and recommend consulting a doctor
- For medical emergencies, always advise to call emergency services or visit the ER immediately
- Format responses with bullet points or numbered lists for clarity when appropriate
- Do NOT make up medical information not supported by the context
- Keep answers concise but complete"""

            user_message = f"""{conv_context}
Context from MedCare Hospital knowledge base:
{context}

Patient question: {state['query']}

Please provide a helpful, accurate answer based on the context. Be empathetic and professional."""

            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_message),
            ]

            response = self.llm.invoke(messages)
            state["answer"] = response.content
            state["sources"] = [s for s in sources if s]
            state["confidence"] = 0.85 if state["reranked_results"] else 0.5
            logger.info("Answer generated successfully.")
            return state

        # Build the LangGraph workflow
        workflow = StateGraph(RAGState)

        # Add nodes
        workflow.add_node("analyze_query", analyze_query)
        workflow.add_node("hybrid_retrieve", hybrid_retrieve)
        workflow.add_node("rerank_docs", rerank_docs)
        workflow.add_node("generate_answer", generate_answer)

        # Set entry point and edges
        workflow.set_entry_point("analyze_query")
        workflow.add_edge("analyze_query", "hybrid_retrieve")
        workflow.add_edge("hybrid_retrieve", "rerank_docs")
        workflow.add_edge("rerank_docs", "generate_answer")
        workflow.add_edge("generate_answer", END)

        self.graph = workflow.compile()
        logger.info("LangGraph workflow compiled.")

    def query(
        self,
        user_query: str,
        conversation_history: Optional[List[Dict]] = None,
    ) -> Dict[str, Any]:
        """
        Main entry point for querying the RAG pipeline.

        Args:
            user_query: The user's question
            conversation_history: Optional list of previous messages

        Returns:
            Dictionary with answer, sources, query_type, and confidence
        """
        initial_state: RAGState = {
            "query": user_query,
            "query_type": "general",
            "conversation_history": conversation_history or [],
            "dense_results": [],
            "sparse_results": [],
            "reranked_results": [],
            "answer": "",
            "sources": [],
            "confidence": 0.0,
        }

        result = self.graph.invoke(initial_state)

        return {
            "answer": result["answer"],
            "sources": result["sources"],
            "query_type": result["query_type"],
            "confidence": result["confidence"],
        }
