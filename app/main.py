import os
import yaml
from typing import List, Optional, Dict
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
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
MODELS_CONFIG_PATH = os.getenv("MODELS_CONFIG_PATH", "/app/models_config.yaml")

# Load models configuration from YAML file
print(f"📄 Loading models configuration from: {MODELS_CONFIG_PATH}")
try:
    with open(MODELS_CONFIG_PATH, 'r') as f:
        config = yaml.safe_load(f)
        models_config = config.get('models', [])
except FileNotFoundError:
    print(f"⚠️  Config file not found at {MODELS_CONFIG_PATH}, using default model")
    models_config = [{
        "name": "all-MiniLM-L6-v2",
        "dimension": 384,
        "description": "Fast and efficient, good for general purpose",
        "default": True
    }]
except Exception as e:
    print(f"❌ Error loading config: {e}, using default model")
    models_config = [{
        "name": "all-MiniLM-L6-v2",
        "dimension": 384,
        "description": "Fast and efficient, good for general purpose",
        "default": True
    }]

# Build AVAILABLE_MODELS dictionary from config
AVAILABLE_MODELS = {}
DEFAULT_MODEL = None

for model_config in models_config:
    model_name = model_config['name']
    AVAILABLE_MODELS[model_name] = {
        "name": model_name,
        "dimension": model_config['dimension'],
        "description": model_config['description']
    }
    if model_config.get('default', False):
        DEFAULT_MODEL = model_name

# Set first model as default if none specified
if DEFAULT_MODEL is None and AVAILABLE_MODELS:
    DEFAULT_MODEL = list(AVAILABLE_MODELS.keys())[0]

print(f"📋 Available models: {list(AVAILABLE_MODELS.keys())}")
print(f"🎯 Default model: {DEFAULT_MODEL}")

# Load all models at startup
print("🔧 Loading embedding models...")
models: Dict[str, SentenceTransformer] = {}
for model_name, model_info in AVAILABLE_MODELS.items():
    print(f"  Loading {model_name}...")
    try:
        models[model_name] = SentenceTransformer(model_name)
        print(f"  ✅ {model_name} loaded! Dimension: {model_info['dimension']}")
    except Exception as e:
        print(f"  ❌ Failed to load {model_name}: {e}")

if not models:
    raise RuntimeError("❌ No models could be loaded! Check your configuration.")

print(f"✅ Successfully loaded {len(models)}/{len(AVAILABLE_MODELS)} models!")

qdrant = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)

# Helper functions
def get_model(model_name: Optional[str] = None) -> tuple[SentenceTransformer, str, int]:
    """Get model instance, name, and dimension. Returns default if model_name is None."""
    if model_name is None:
        model_name = DEFAULT_MODEL
    
    if model_name not in models:
        raise HTTPException(
            status_code=400, 
            detail=f"Model '{model_name}' not available. Available models: {list(models.keys())}"
        )
    
    return models[model_name], model_name, AVAILABLE_MODELS[model_name]["dimension"]


def get_collection_metadata(collection_name: str) -> Optional[dict]:
    """Retrieve collection metadata including model info"""
    try:
        # Use a special UUID for metadata: all zeros
        metadata_id = "00000000-0000-0000-0000-000000000000"
        result = qdrant.retrieve(
            collection_name=collection_name,
            ids=[metadata_id]
        )
        if result and len(result) > 0:
            return result[0].payload
    except:
        pass
    return None


# Request/Response Models
class EmbedRequest(BaseModel):
    text: str | List[str]
    model: Optional[str] = None  # If None, uses default model


class EmbedResponse(BaseModel):
    embeddings: List[List[float]]
    model: str
    dimension: int


class Document(BaseModel):
    text: str
    metadata: Optional[dict] = None


class CreateCollectionRequest(BaseModel):
    model: Optional[str] = None  # If None, uses default model
    distance: str = "cosine"


class UpsertRequest(BaseModel):
    collection: str
    documents: List[Document]
    model: Optional[str] = None  # Only used when creating new collection; must match existing collection's model


class SearchRequest(BaseModel):
    collection: str
    query: str
    limit: int = 5
    score_threshold: Optional[float] = None
    model: Optional[str] = None  # Must match collection's model if specified; validation enforced


# API Endpoints
@app.get("/")
async def root():
    return {
        "service": "RAG Service",
        "available_models": list(AVAILABLE_MODELS.keys()),
        "default_model": DEFAULT_MODEL,
        "models_info": AVAILABLE_MODELS,
        "status": "ready"
    }


@app.get("/health")
async def health():
    try:
        qdrant.get_collections()
        return {
            "status": "healthy",
            "qdrant": "connected",
            "models_loaded": len(models),
            "default_model": DEFAULT_MODEL
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")


@app.get("/models")
async def list_models():
    """List all available embedding models"""
    return {
        "models": [
            {
                "name": name,
                "dimension": info["dimension"],
                "description": info["description"],
                "is_default": name == DEFAULT_MODEL
            }
            for name, info in AVAILABLE_MODELS.items()
        ],
        "default_model": DEFAULT_MODEL
    }


@app.post("/embed", response_model=EmbedResponse)
async def embed(request: EmbedRequest):
    """Generate embeddings for text(s)"""
    model, model_name, dimension = get_model(request.model)
    texts = [request.text] if isinstance(request.text, str) else request.text
    embeddings = model.encode(texts).tolist()
    
    return EmbedResponse(
        embeddings=embeddings,
        model=model_name,
        dimension=dimension
    )


@app.post("/collections/{collection_name}")
async def create_collection(collection_name: str, config: CreateCollectionRequest):
    """Create a new collection with specified model"""
    try:
        _, model_name, dimension = get_model(config.model)
        
        # Map distance metric
        distance_map = {
            "cosine": Distance.COSINE,
            "euclidean": Distance.EUCLID,
            "dot": Distance.DOT
        }
        distance = distance_map.get(config.distance.lower(), Distance.COSINE)
        
        qdrant.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=dimension, distance=distance),
        )
        
        # Store model info in collection metadata (using payload in a special document)
        # This allows us to retrieve the model later
        # Use a special UUID for metadata: all zeros
        metadata_id = "00000000-0000-0000-0000-000000000000"
        qdrant.upsert(
            collection_name=collection_name,
            points=[
                PointStruct(
                    id=metadata_id,
                    vector=[0.0] * dimension,
                    payload={
                        "_is_metadata": True,
                        "model": model_name,
                        "dimension": dimension,
                        "distance": config.distance
                    }
                )
            ]
        )
        
        return {
            "status": "created",
            "collection": collection_name,
            "model": model_name,
            "dimension": dimension,
            "distance": config.distance
        }
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
        # Get collection metadata (model info) first
        metadata = get_collection_metadata(collection_name)
        collection_model = metadata.get("model", "unknown") if metadata else "unknown"
        
        # Get point count using the count API (more reliable)
        count_result = qdrant.count(collection_name=collection_name)
        points_count = count_result.count if hasattr(count_result, 'count') else 0
        
        # Subtract 1 for metadata point if it exists
        if metadata:
            points_count = max(0, points_count - 1)
        
        # Get sample documents using scroll (exclude metadata)
        records, _ = qdrant.scroll(
            collection_name=collection_name,
            limit=limit + 1,  # Get one extra in case metadata is included
            offset=offset,
            with_payload=True,
            with_vectors=False
        )
        
        # Filter out metadata record (using special UUID)
        metadata_id = "00000000-0000-0000-0000-000000000000"
        documents = [
            {
                "id": str(record.id),
                "text": record.payload.get("text", ""),
                "metadata": {k: v for k, v in record.payload.items() if k != "text" and not k.startswith("_")}
            }
            for record in records
            if str(record.id) != metadata_id and not record.payload.get("_is_metadata", False)
        ][:limit]  # Limit to requested amount
        
        # Try to get detailed collection info, but handle parsing errors gracefully
        try:
            collection_info = qdrant.get_collection(collection_name=collection_name)
            status = collection_info.status.name if hasattr(collection_info, 'status') else "green"
            
            # Safely extract vector config
            vector_size = 384  # default
            distance_metric = "COSINE"  # default
            
            if hasattr(collection_info, 'config') and hasattr(collection_info.config, 'params'):
                if hasattr(collection_info.config.params, 'vectors'):
                    vector_config = collection_info.config.params.vectors
                    if hasattr(vector_config, 'size'):
                        vector_size = vector_config.size
                    if hasattr(vector_config, 'distance') and hasattr(vector_config.distance, 'name'):
                        distance_metric = vector_config.distance.name
            
            indexed_vectors_count = points_count
            if hasattr(collection_info, 'indexed_vectors_count') and collection_info.indexed_vectors_count is not None:
                indexed_vectors_count = max(0, collection_info.indexed_vectors_count - (1 if metadata else 0))
            
            segments_count = 0
            if hasattr(collection_info, 'segments') and collection_info.segments:
                segments_count = len(collection_info.segments)
            
        except Exception as info_error:
            print(f"Warning: Could not parse full collection info: {info_error}")
            # Use defaults if we can't get detailed info
            status = "green"
            vector_size = metadata.get("dimension", 384) if metadata else 384
            distance_metric = metadata.get("distance", "cosine").upper() if metadata else "COSINE"
            indexed_vectors_count = points_count
            segments_count = 0
        
        return {
            "collection": collection_name,
            "model": collection_model,
            "vectors_count": points_count,
            "points_count": points_count,
            "status": status,
            "vector_size": vector_size,
            "distance_metric": distance_metric,
            "indexed_vectors_count": indexed_vectors_count,
            "segments_count": segments_count,
            "optimizer_status": 20000,  # Default indexing threshold
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
        # Check if collection exists
        collections = [c.name for c in qdrant.get_collections().collections]
        
        # Determine which model to use
        if request.collection not in collections:
            # New collection - use specified model or default
            model, model_name, dimension = get_model(request.model)
            
            # Create collection with metadata
            qdrant.create_collection(
                collection_name=request.collection,
                vectors_config=VectorParams(size=dimension, distance=Distance.COSINE),
            )
            
            # Store metadata
            # Use a special UUID for metadata: all zeros
            metadata_id = "00000000-0000-0000-0000-000000000000"
            qdrant.upsert(
                collection_name=request.collection,
                points=[
                    PointStruct(
                        id=metadata_id,
                        vector=[0.0] * dimension,
                        payload={
                            "_is_metadata": True,
                            "model": model_name,
                            "dimension": dimension,
                            "distance": "cosine"
                        }
                    )
                ]
            )
        else:
            # Existing collection - MUST use collection's model
            metadata = get_collection_metadata(request.collection)
            
            if metadata and metadata.get("model"):
                collection_model = metadata["model"]
                
                # Check if user is trying to override with a different model
                if request.model and request.model != collection_model:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Cannot change embedding model for existing collection. "
                               f"Collection '{request.collection}' uses model '{collection_model}'. "
                               f"You requested '{request.model}'. "
                               f"To use a different model, create a new collection."
                    )
                
                # Use collection's model
                model, model_name, dimension = get_model(collection_model)
            else:
                # Collection exists but has no metadata (legacy collection)
                # Use default model but warn
                model, model_name, dimension = get_model(None)
                print(f"⚠️  Warning: Collection '{request.collection}' has no model metadata. Using default: {model_name}")
        
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
            "model": model_name,
            "inserted": len(points)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/search")
async def search(request: SearchRequest):
    """Search for similar documents"""
    try:
        # Get collection's model
        metadata = get_collection_metadata(request.collection)
        
        if metadata and metadata.get("model"):
            collection_model = metadata["model"]
            
            # Check if user is trying to override with a different model
            if request.model and request.model != collection_model:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot use different embedding model for search. "
                           f"Collection '{request.collection}' uses model '{collection_model}'. "
                           f"You requested '{request.model}'. "
                           f"Search must use the same model as the collection's documents."
                )
            
            # Use collection's model
            model, model_name, dimension = get_model(collection_model)
        else:
            # Collection exists but has no metadata (legacy collection)
            # Use default model but warn
            model, model_name, dimension = get_model(None)
            print(f"⚠️  Warning: Collection '{request.collection}' has no model metadata. Using default: {model_name}")
        
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
        
        # Filter out metadata record from results (using special UUID)
        metadata_id = "00000000-0000-0000-0000-000000000000"
        filtered_results = [
            hit for hit in results 
            if str(hit.id) != metadata_id and not hit.payload.get("_is_metadata", False)
        ]
        
        return {
            "query": request.query,
            "model": model_name,
            "query_vector": query_vector,
            "results": [
                {
                    "id": hit.id,
                    "score": hit.score,
                    "text": hit.payload.get("text"),
                    "metadata": {k: v for k, v in hit.payload.items() if k != "text" and not k.startswith("_")},
                    "vector": hit.vector if hasattr(hit, 'vector') else None
                }
                for hit in filtered_results
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