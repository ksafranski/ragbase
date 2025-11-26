# RAG Service - All-in-One Vector Search & Embeddings

A Docker-based service that combines [Qdrant](https://qdrant.tech/) vector database with embedding models to build support RAG (Retrieval Augmented Generation) applications in a single container.


## 🚀 Quick Start

### Prerequisites

- Docker installed on your machine
- Basic understanding of command line
- (Optional) curl or Postman for testing API calls

> **Note**: The service now uses a configurable `models_config.yaml` file to manage embedding models. See [Models Configuration Guide](MODELS_CONFIG.md) for details.

### 1. Clone or Create the Project

Create a directory structure:

```bash
mkdir rag-service
cd rag-service
mkdir app
```

Download or create the files from this repository (see Project Structure below).

### 2. Build the Docker Image

```bash
docker build -t rag-service .
```

This will take a few minutes the first time as it installs all dependencies.

### 3. Run the Service

```bash
docker run -d \
  --name my-rag \
  -p 6333:6333 \
  -p 8000:8000 \
  -v $(pwd)/qdrant_data:/qdrant/storage \
  -v $(pwd)/models_cache:/models/cache \
  rag-service
```

**What this does:**
- `-d`: Runs in background
- `--name my-rag`: Names your container
- `-p 6333:6333`: Exposes Qdrant's port
- `-p 8000:8000`: Exposes the API port
- `-v`: Saves your data between restarts

### 4. Verify It's Running

```bash
# Check the service status
curl http://localhost:8000/health

# You should see:
# {"status":"healthy","qdrant":"connected","model":"all-MiniLM-L6-v2"}
```

## 📖 Step-by-Step Tutorial

### Example 1: Store Some Documents

Let's add some documents about programming languages:

```bash
curl -X POST http://localhost:8000/upsert \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "programming",
    "documents": [
      {
        "text": "Python is a high-level programming language known for its simplicity and readability. It is widely used in data science and web development.",
        "metadata": {"topic": "python", "difficulty": "beginner"}
      },
      {
        "text": "JavaScript is the programming language of the web. It runs in browsers and enables interactive websites.",
        "metadata": {"topic": "javascript", "difficulty": "beginner"}
      },
      {
        "text": "Rust is a systems programming language focused on safety and performance. It prevents memory errors at compile time.",
        "metadata": {"topic": "rust", "difficulty": "advanced"}
      },
      {
        "text": "SQL is used to manage and query relational databases. It allows you to retrieve and manipulate structured data.",
        "metadata": {"topic": "sql", "difficulty": "intermediate"}
      }
    ]
  }'
```

**What happened?**
- Your documents were converted to embeddings (vectors)
- They were stored in a collection called "programming"
- Metadata was attached to each document

### Example 2: Search by Meaning

Now ask a question:

```bash
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "programming",
    "query": "Which language is good for beginners?",
    "limit": 2
  }'
```

**Result:** You'll get Python and JavaScript as top results, even though your query didn't use the exact words from the documents. The system understood the *meaning*.

### Example 3: Build a Simple RAG Pipeline

Here's a Python script that demonstrates a complete RAG workflow:

```python
import requests
import json

# 1. Add your documents
def add_documents(collection, docs):
    response = requests.post(
        "http://localhost:8000/upsert",
        json={"collection": collection, "documents": docs}
    )
    return response.json()

# 2. Search for relevant context
def search(collection, query, limit=3):
    response = requests.post(
        "http://localhost:8000/search",
        json={"collection": collection, "query": query, "limit": limit}
    )
    return response.json()

# Example: Store company knowledge base
documents = [
    {"text": "Our company's vacation policy allows 15 days of PTO per year for all employees.", "metadata": {"category": "HR"}},
    {"text": "To submit an expense report, log into the finance portal and upload receipts.", "metadata": {"category": "Finance"}},
    {"text": "Our office hours are Monday-Friday, 9 AM to 5 PM EST.", "metadata": {"category": "Operations"}},
]

# Add documents
add_documents("company_kb", documents)

# Ask a question
question = "How many vacation days do I get?"
results = search("company_kb", question, limit=1)

# Get the most relevant context
context = results['results'][0]['text']
print(f"Question: {question}")
print(f"Relevant Context: {context}")

# Now you would send 'context' + 'question' to your LLM (ChatGPT, Claude, etc.)
# The LLM can answer based on your actual company data!
```

## 🎛️ Configuration Options

### Managing Embedding Models

The service uses a `models_config.yaml` file to manage available embedding models. This allows you to:
- Control which models are loaded at startup
- Set a default model
- Add or remove models without code changes
- See detailed model information

**Quick Start:**
1. Edit `models_config.yaml` to add/remove models
2. Restart the service: `docker-compose restart`

For detailed configuration instructions, see [Models Configuration Guide](MODELS_CONFIG.md).

### Choosing an Embedding Model

Different models offer different trade-offs:

#### General Purpose Models

| Model | Dimensions | Size | Speed | Quality | Use Case |
|-------|-----------|------|-------|---------|----------|
| `all-MiniLM-L6-v2` | 384 | ~80MB | ⚡⚡⚡ | ⭐⭐ | Fast prototyping, small datasets |
| `all-mpnet-base-v2` | 768 | ~420MB | ⚡⚡ | ⭐⭐⭐ | Balanced - good default choice |
| `BAAI/bge-large-en-v1.5` | 1024 | ~1.3GB | ⚡ | ⭐⭐⭐⭐ | Highest quality, production use |
| `thenlper/gte-large` | 1024 | ~670MB | ⚡⚡ | ⭐⭐⭐⭐ | High performance, good speed/quality balance |
| `paraphrase-multilingual-mpnet-base-v2` | 768 | ~970MB | ⚡⚡ | ⭐⭐⭐ | Multiple languages (50+) |

#### Long Context Models (For Full Documents)

| Model | Dimensions | Max Tokens | Size | Quality | Use Case |
|-------|-----------|-----------|------|---------|----------|
| `jinaai/jina-embeddings-v2-base-en` | 768 | 8192 | ~130MB | ⭐⭐⭐ | Long documents, full articles/papers |
| `jinaai/jina-embeddings-v2-small-en` | 512 | 8192 | ~65MB | ⭐⭐ | Long context, faster processing |

#### Domain-Specific Models (Research & Technical)

| Model | Dimensions | Size | Domain | Use Case |
|-------|-----------|------|--------|----------|
| `allenai/scibert_scivocab_uncased` | 768 | ~440MB | Scientific | Research papers, academic content |
| `pritamdeka/BioBERT-mnli-snli-scinli-scitail-mednli-stsb` | 768 | ~420MB | Biomedical | Medical research, healthcare documents |
| `nlpaueb/legal-bert-base-uncased` | 768 | ~440MB | Legal | Legal documents, case law, contracts |
| `AI-Growth-Lab/PatentSBERTa` | 768 | ~440MB | Patents | Patent documents, technical specifications |

#### Code-Specific Models

| Model | Dimensions | Size | Quality | Use Case |
|-------|-----------|------|---------|----------|
| `microsoft/codebert-base` | 768 | ~500MB | ⭐⭐⭐ | Code search, documentation |
| `Salesforce/codet5-base` | 768 | ~440MB | ⭐⭐⭐ | Code understanding, code-to-text |


**To change models:**

```bash
docker run -d \
  --name my-rag \
  -p 6333:6333 \
  -p 8000:8000 \
  -v $(pwd)/qdrant_data:/qdrant/storage \
  -v $(pwd)/models_cache:/models/cache \
  -e EMBED_MODEL="all-mpnet-base-v2" \
  rag-service
```

⚠️ **Important:** If you change models, you'll need to re-embed your existing data, as different models produce different vector dimensions.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `EMBED_MODEL` | `all-MiniLM-L6-v2` | Which embedding model to use |
| `QDRANT_HOST` | `localhost` | Qdrant server host |
| `QDRANT_PORT` | `6333` | Qdrant server port |
| `API_PORT` | `8000` | FastAPI server port |

## 🔌 API Reference

### Base URL
`http://localhost:8000`

### Endpoints

#### `GET /`
Get service information and status.

```bash
curl http://localhost:8000/
```

Response:
```json
{
  "service": "RAG Service",
  "model": "all-MiniLM-L6-v2",
  "dimension": 384,
  "status": "ready"
}
```

---

#### `GET /health`
Check if the service is healthy.

```bash
curl http://localhost:8000/health
```

---

#### `GET /models`
List all available embedding models.

```bash
curl http://localhost:8000/models
```

Response includes model name, dimension, description, and which is the default.

---

#### `POST /embed`
Generate embeddings for text.

```bash
curl -X POST http://localhost:8000/embed \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "model": "all-MiniLM-L6-v2"}'
```

You can also embed multiple texts at once:
```bash
curl -X POST http://localhost:8000/embed \
  -H "Content-Type: application/json" \
  -d '{"text": ["First text", "Second text", "Third text"]}'
```

The `model` parameter is optional. If not specified, the default model is used.

---

#### `POST /collections/{collection_name}`
Create a new collection.

```bash
curl -X POST http://localhost:8000/collections/my_docs \
  -H "Content-Type: application/json" \
  -d '{"model": "all-MiniLM-L6-v2", "distance": "cosine"}'
```

Parameters (all optional):
- `model`: Embedding model to use (default: uses default model from config)
- `distance`: Distance metric - "cosine", "euclidean", or "dot" (default: "cosine")

---

#### `GET /collections`
List all collections.

```bash
curl http://localhost:8000/collections
```

---

#### `POST /upsert`
Add or update documents in a collection.

```bash
curl -X POST http://localhost:8000/upsert \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "my_docs",
    "documents": [
      {
        "text": "Your document text here",
        "metadata": {"source": "manual", "date": "2024-11-25"}
      }
    ],
    "model": null
  }'
```

Parameters:
- `collection`: Name of the collection
- `documents`: Array of documents with text and optional metadata
- `model`: (Optional) Only used when creating a new collection. Must match the collection's model for existing collections.

**Important:** Once a collection is created with a specific model, that model cannot be changed. All documents in a collection must use the same embedding model to ensure search results are meaningful.

---

#### `POST /search`
Search for similar documents.

```bash
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "my_docs",
    "query": "your search query",
    "limit": 5,
    "score_threshold": 0.7
  }'
```

Parameters:
- `collection`: Name of the collection to search
- `query`: Your search text
- `limit`: Maximum number of results (default: 5)
- `score_threshold`: Minimum similarity score (0-1, optional)
- `model`: (Optional) Must match the collection's model if specified

**Important:** Search queries are automatically embedded using the same model that was used to create the collection. This ensures search results are semantically meaningful. Attempting to use a different model will be rejected.

---

#### `DELETE /collections/{collection_name}`
Delete a collection and all its data.

```bash
curl -X DELETE http://localhost:8000/collections/my_docs
```

## 🐳 Docker Compose (Recommended)

For easier management, use Docker Compose:

**docker-compose.yml:**
```yaml
services:
  rag-service:
    build: .
    container_name: rag-service
    ports:
      - "6333:6333"
      - "8000:8000"
    volumes:
      - ./qdrant_data:/qdrant/storage
      - ./models_cache:/models/cache
    environment:
      - EMBED_MODEL=all-MiniLM-L6-v2
    restart: unless-stopped
```

**Commands:**
```bash
# Start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

## 🔧 Troubleshooting

### Service won't start
```bash
# Check logs
docker logs my-rag

# Common issues:
# 1. Ports already in use - change ports or stop conflicting services
# 2. Insufficient disk space - models can be large
# 3. Docker not running - start Docker Desktop
```

### Model download fails
```bash
# You may need to increase Docker's memory allocation
# Go to Docker Desktop > Settings > Resources > Memory
# Recommended: At least 4GB for smaller models, 8GB for large models
```

### Search returns no results
```bash
# Check if your collection exists
curl http://localhost:8000/collections

# Verify documents were added
# The upsert response should show "inserted": N

# Try lowering the score_threshold or removing it entirely
```

### Can't connect to the API
```bash
# Make sure the container is running
docker ps

# Check if ports are exposed
docker port my-rag

# Test with verbose curl
curl -v http://localhost:8000/health
```

## 🎯 Best Practices

### 1. Chunk Your Documents
Don't store entire entities as single documents. Break them into paragraphs or sections (200-500 words works well).

### 2. Add Meaningful Metadata
Include source, tags, type, labels, and other metadata and context; you can filter by metadata when searching.

### 3. Choose the Right Model
- Prototyping? Use `all-MiniLM-L6-v2` for speed
- Production? Use `all-mpnet-base-v2` or `BAAI/bge-large-en-v1.5`
- Multiple languages? Use `paraphrase-multilingual-mpnet-base-v2`

## 🎨 Web UI

A simple Next.js TypeScript UI is available in the `/ui` folder for managing collections and documents through a visual interface.

### Features
- **Collections Management**: Create, list, and delete collections
- **Upsert Documents**: Add documents with automatic embedding generation
- **Semantic Search**: Search for similar documents with configurable parameters
- **Generate Embeddings**: Generate and view vector embeddings for any text

### Quick Start

```bash
cd ui
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

See [ui/SETUP.md](ui/SETUP.md) for detailed setup instructions.

**Tech Stack**: Next.js 14, TypeScript, Ant Design, native Fetch API
