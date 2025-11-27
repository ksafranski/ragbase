# Docker Image Deployment Guide

This guide explains how to publish the Docker image to GitHub Container Registry (GHCR) and how users can pull and run it.

## Publishing the Image

### Automatic Publishing via GitHub Actions

The repository includes a GitHub Actions workflow (`.github/workflows/docker-publish.yml`) that automatically builds and publishes the Docker image when you:

1. **Push to main branch** - Publishes with `latest` tag
2. **Create a git tag** (e.g., `v1.0.0`) - Publishes with version tags
3. **Manually trigger** - Use "Run workflow" button in GitHub Actions

### Setup Steps

1. **Push the workflow file** to your repository:
   ```bash
   git add .github/workflows/docker-publish.yml
   git commit -m "Add Docker image publishing workflow"
   git push
   ```

2. **Verify the workflow runs**:
   - Go to your repository on GitHub
   - Click on "Actions" tab
   - You should see the workflow running

3. **Find your published image**:
   - Go to your repository's "Packages" section (or visit `https://github.com/ksafranski/ragbase/pkgs/container/ragbase`)
   - The image will be available at: `ghcr.io/ksafranski/ragbase:latest`

### Making the Package Public

By default, GitHub packages are private. To make it public:

1. Go to your repository's Packages page
2. Click on the package (ragbase)
3. Click "Package settings"
4. Scroll down to "Danger Zone"
5. Click "Change visibility" → "Public"

## Using the Published Image

### Pull and Run

Users can pull and run your image directly without cloning the repository:

```bash
docker run -d \
  --name rag-service \
  -p 6333:6333 \
  -p 8000:8000 \
  -p 3000:3000 \
  -v $(pwd)/qdrant_data:/qdrant/storage \
  -v $(pwd)/models_cache:/models/cache \
  ghcr.io/ksafranski/ragbase:latest
```

### Pulling a Specific Version

If you've tagged releases, users can pull specific versions:

```bash
# Pull a specific version
docker pull ghcr.io/ksafranski/ragbase:v1.0.0

# Run it
docker run -d \
  --name rag-service \
  -p 6333:6333 \
  -p 8000:8000 \
  -p 3000:3000 \
  -v $(pwd)/qdrant_data:/qdrant/storage \
  -v $(pwd)/models_cache:/models/cache \
  ghcr.io/ksafranski/ragbase:v1.0.0
```

### Using with Docker Compose

Users can also use docker-compose with the published image:

```yaml
services:
  rag-service:
    image: ghcr.io/ksafranski/ragbase:latest
    container_name: rag-service
    ports:
      - "6333:6333"
      - "8000:8000"
      - "3000:3000"
    volumes:
      - ./qdrant_data:/qdrant/storage
      - ./models_cache:/models/cache
    environment:
      - EMBED_MODEL=all-MiniLM-L6-v2
    restart: unless-stopped
```

## Image Tags

The workflow automatically creates the following tags:

- `latest` - Always points to the latest main branch build
- `main` - Points to the latest main branch build
- `v1.0.0` - Semantic version tags (when you create git tags)
- `1.0.0` - Version without 'v' prefix
- `1.0` - Major.minor version
- `1` - Major version

## Troubleshooting

### Authentication Required

If the package is private, users need to authenticate:

```bash
# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Or use a personal access token
docker login ghcr.io -u USERNAME -p YOUR_TOKEN
```

### Image Not Found

- Make sure the workflow has completed successfully
- Check that the package visibility is set correctly (public/private)
- Verify the image name matches your repository name

### Build Failures

If the GitHub Actions workflow fails:

1. Check the Actions tab for error messages
2. Ensure all required files are in the repository
3. Verify the Dockerfile is correct
4. Check that Node.js dependencies can be installed (package.json, package-lock.json)

## Manual Publishing (Alternative)

If you prefer to build and push manually:

```bash
# Build the image
docker build -t ghcr.io/ksafranski/ragbase:latest .

# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u ksafranski --password-stdin

# Push the image
docker push ghcr.io/ksafranski/ragbase:latest
```

Set `GITHUB_TOKEN` to a personal access token with `write:packages` permission.

