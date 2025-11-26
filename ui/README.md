# RAGBase UI

A simple Next.js TypeScript application for managing RAG collections and embeddings.

## Features

- **Collections Management**: Create, list, and delete vector collections
- **Upsert Documents**: Add documents with automatic embedding generation
- **Semantic Search**: Search for similar documents using vector similarity
- **Generate Embeddings**: Generate vector embeddings for any text

## Getting Started

### Prerequisites

Make sure the RAGBase API is running on `http://localhost:8000`

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Ant Design** - UI component library
- **Fetch API** - HTTP requests (no additional dependencies)

## Project Structure

```
ui/
├── app/
│   ├── layout.tsx       # Root layout with Ant Design registry
│   ├── page.tsx         # Main page with sidebar navigation
│   └── globals.css      # Global styles
├── components/
│   ├── CollectionsPanel.tsx  # Manage collections
│   ├── UpsertPanel.tsx       # Add documents
│   ├── SearchPanel.tsx       # Search interface
│   └── EmbedPanel.tsx        # Generate embeddings
├── lib/
│   └── api.ts           # API utility functions
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

## API Endpoints

The UI connects to the following backend endpoints:

- `GET /health` - Health check
- `GET /collections` - List all collections
- `POST /collections/{name}` - Create a collection
- `DELETE /collections/{name}` - Delete a collection
- `POST /embed` - Generate embeddings
- `POST /upsert` - Upsert documents
- `POST /search` - Search documents

