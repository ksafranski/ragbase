import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import uuid

app = FastAPI(title="RAG Service", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js default dev server
        "http://localhost:3001",  # Alternative port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, DELETE, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Configuration from environment
EMBED_MODEL = os.getenv("EMBED_MODEL", "all-MiniLM-L6-v2")
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))

# Initialize model and client
print(f"🔧 Loading embedding model: {EMBED_MODEL}")
model = SentenceTransformer(EMBED_MODEL)
embedding_dim = model.get_sentence_embedding_dimension()
print(f"✅ Model loaded! Dimension: {embedding_dim}")

qdrant = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)


# Request/Response Models
class EmbedRequest(BaseModel):
    text: str | List[str]


class EmbedResponse(BaseModel):
    embeddings: List[List[float]]
    model: str
    dimension: int


class Document(BaseModel):
    text: str
    metadata: Optional[dict] = None


class UpsertRequest(BaseModel):
    collection: str
    documents: List[Document]


class SearchRequest(BaseModel):
    collection: str
    query: str
    limit: int = 5
    score_threshold: Optional[float] = None


# API Endpoints
@app.get("/")
async def root():
    return {
        "service": "RAG Service",
        "model": EMBED_MODEL,
        "dimension": embedding_dim,
        "status": "ready"
    }


@app.get("/health")
async def health():
    try:
        qdrant.get_collections()
        return {"status": "healthy", "qdrant": "connected", "model": EMBED_MODEL}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")


@app.post("/embed", response_model=EmbedResponse)
async def embed(request: EmbedRequest):
    """Generate embeddings for text(s)"""
    texts = [request.text] if isinstance(request.text, str) else request.text
    embeddings = model.encode(texts).tolist()
    
    return EmbedResponse(
        embeddings=embeddings,
        model=EMBED_MODEL,
        dimension=embedding_dim
    )


@app.post("/collections/{collection_name}")
async def create_collection(collection_name: str):
    """Create a new collection"""
    try:
        qdrant.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=embedding_dim, distance=Distance.COSINE),
        )
        return {"status": "created", "collection": collection_name}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/collections")
async def list_collections():
    """List all collections"""
    collections = qdrant.get_collections()
    return {"collections": [c.name for c in collections.collections]}


@app.get("/collections/{collection_name}/info")
async def get_collection_info(collection_name: str, limit: int = 100, offset: int = 0):
    """Get collection information and browse documents"""
    try:
        # Get point count using the count API (more reliable)
        count_result = qdrant.count(collection_name=collection_name)
        points_count = count_result.count if hasattr(count_result, 'count') else 0
        
        # Get sample documents using scroll
        records, _ = qdrant.scroll(
            collection_name=collection_name,
            limit=limit,
            offset=offset,
            with_payload=True,
            with_vectors=False
        )
        
        documents = [
            {
                "id": str(record.id),
                "text": record.payload.get("text", ""),
                "metadata": {k: v for k, v in record.payload.items() if k != "text"}
            }
            for record in records
        ]
        
        return {
            "collection": collection_name,
            "vectors_count": points_count,
            "points_count": points_count,
            "status": "active",
            "documents": documents,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        # More detailed error logging
        import traceback
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Error fetching collection info: {error_detail}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/upsert")
async def upsert_documents(request: UpsertRequest):
    """Add documents to a collection"""
    try:
        # Ensure collection exists
        collections = [c.name for c in qdrant.get_collections().collections]
        if request.collection not in collections:
            qdrant.create_collection(
                collection_name=request.collection,
                vectors_config=VectorParams(size=embedding_dim, distance=Distance.COSINE),
            )
        
        # Generate embeddings
        texts = [doc.text for doc in request.documents]
        embeddings = model.encode(texts).tolist()
        
        # Prepare points
        points = [
            PointStruct(
                id=str(uuid.uuid4()),
                vector=embedding,
                payload={"text": doc.text, **(doc.metadata or {})}
            )
            for doc, embedding in zip(request.documents, embeddings)
        ]
        
        # Upsert to Qdrant
        qdrant.upsert(collection_name=request.collection, points=points)
        
        return {
            "status": "success",
            "collection": request.collection,
            "inserted": len(points)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/search")
async def search(request: SearchRequest):
    """Search for similar documents"""
    try:
        # Generate query embedding
        query_vector = model.encode(request.query).tolist()
        
        # Search in Qdrant with vectors
        results = qdrant.search(
            collection_name=request.collection,
            query_vector=query_vector,
            limit=request.limit,
            score_threshold=request.score_threshold,
            with_vectors=True
        )
        
        return {
            "query": request.query,
            "query_vector": query_vector,
            "results": [
                {
                    "id": hit.id,
                    "score": hit.score,
                    "text": hit.payload.get("text"),
                    "metadata": {k: v for k, v in hit.payload.items() if k != "text"},
                    "vector": hit.vector if hasattr(hit, 'vector') else None
                }
                for hit in results
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/collections/{collection_name}")
async def delete_collection(collection_name: str):
    """Delete a collection"""
    try:
        qdrant.delete_collection(collection_name=collection_name)
        return {"status": "deleted", "collection": collection_name}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))