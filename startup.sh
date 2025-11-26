#!/bin/bash
set -e

echo "🚀 Starting RAG Service"
echo "📦 Embedding Model: $EMBED_MODEL"
echo "💾 Qdrant Data: /qdrant/storage"
echo "🤖 Model Cache: /models/cache"

# Check if model is already cached
MODEL_CACHE_DIR="/models/cache/sentence-transformers"
if [ -d "$MODEL_CACHE_DIR" ] && [ "$(ls -A $MODEL_CACHE_DIR 2>/dev/null)" ]; then
    echo "✅ Model cache found, checking for $EMBED_MODEL..."
fi

# Download/verify the model
echo "⬇️  Loading embedding model..."
python3 -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('$EMBED_MODEL')"

echo "✅ Model ready!"
echo "🔧 Starting Qdrant and API..."

# Start supervisor to manage both services
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf