# RAGBase UI Setup Guide

## Quick Start

1. **Install dependencies**
   ```bash
   cd ui
   npm install
   ```

2. **Make sure the RAGBase API is running**
   The API should be accessible at `http://localhost:8000`
   
   You can check by running from the project root:
   ```bash
   docker-compose up
   # or
   python app/main.py
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Features Overview

### Collections Management
- View all existing collections
- Create new collections
- Delete collections
- Refresh collection list

### Upsert Documents
- Select a collection
- Add one or multiple documents
- Include optional metadata (JSON format)
- Automatically generates embeddings

### Search Documents
- Select a collection
- Enter search query
- Configure result limit
- Optional score threshold
- View results with similarity scores

### Generate Embeddings
- Generate embeddings for any text
- Supports batch processing (multiple texts)
- View embedding vectors and dimensions

## Configuration

The UI is pre-configured to connect to `http://localhost:8000`. 

If you need to change the API endpoint, modify the `API_BASE_URL` constant in `lib/api.ts`.

## Troubleshooting

### API Connection Issues
- Ensure the backend is running on port 8000
- Check CORS settings if needed (FastAPI should allow localhost by default)

### Port 3000 Already in Use
Run on a different port:
```bash
npm run dev -- -p 3001
```

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **UI Library**: Ant Design 5
- **HTTP Client**: Native Fetch API
- **Styling**: CSS Modules + Ant Design theming

