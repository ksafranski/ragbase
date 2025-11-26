FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Install Qdrant - using a more recent stable version
RUN curl -L https://github.com/qdrant/qdrant/releases/download/v1.11.3/qdrant-x86_64-unknown-linux-musl.tar.gz \
    -o /tmp/qdrant.tar.gz && \
    tar xzf /tmp/qdrant.tar.gz -C /usr/local/bin && \
    rm /tmp/qdrant.tar.gz

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY app /app
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY startup.sh /startup.sh
RUN chmod +x /startup.sh

WORKDIR /app

# Create data directories
RUN mkdir -p /qdrant/storage /models/cache

# Set cache directories for sentence-transformers
ENV SENTENCE_TRANSFORMERS_HOME=/models/cache
ENV TRANSFORMERS_CACHE=/models/cache
ENV HF_HOME=/models/cache

# Environment variables with defaults
ENV EMBED_MODEL="all-MiniLM-L6-v2"
ENV QDRANT_HOST="localhost"
ENV QDRANT_PORT="6333"
ENV API_PORT="8000"

# Expose volumes
VOLUME ["/qdrant/storage", "/models/cache"]

EXPOSE 6333 8000

CMD ["/startup.sh"]