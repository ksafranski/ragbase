# RAGBase UI - Features Documentation

## Overview

The RAGBase UI provides a clean, intuitive interface for managing your RAG (Retrieval Augmented Generation) service. Built with Next.js, TypeScript, and Ant Design, it offers a modern user experience without unnecessary dependencies.

## Core Features

### 1. Collections Management

**Location**: Sidebar → Collections

**Capabilities**:
- View all existing vector collections in a grid layout
- Create new collections with custom names
- Delete collections (with confirmation dialog)
- Refresh collection list to see latest updates

**Use Cases**:
- Organize documents by topic, project, or data source
- Create separate collections for different embedding strategies
- Clean up unused collections

---

### 2. Document Upsert

**Location**: Sidebar → Upsert Documents

**Capabilities**:
- Select target collection from dropdown
- Add single or multiple documents at once
- Include optional metadata in JSON format
- Automatic validation of JSON metadata
- Bulk document insertion

**Features**:
- Dynamic form with add/remove document controls
- Real-time JSON validation
- Auto-embedding generation (handled by backend)
- Support for rich metadata fields

**Example Metadata**:
```json
{
  "category": "technical",
  "author": "John Doe",
  "date": "2024-01-01",
  "tags": ["AI", "ML", "RAG"]
}
```

---

### 3. Semantic Search

**Location**: Sidebar → Search

**Capabilities**:
- Search across any collection using natural language
- Configure result limit (1-100)
- Optional score threshold filtering
- View detailed results with similarity scores
- Display document metadata

**Search Configuration**:
- **Query**: Natural language search text
- **Limit**: Maximum number of results (default: 5)
- **Score Threshold**: Minimum similarity score (0-1, optional)

**Result Display**:
- Document ID
- Similarity score (color-coded: green >0.8, blue >0.5)
- Full document text
- Associated metadata as tags

---

### 4. Embedding Generation

**Location**: Sidebar → Generate Embeddings

**Capabilities**:
- Generate embeddings for any text
- Single or batch processing (one text per line)
- View embedding vectors and dimensions
- Copy embeddings to clipboard
- Display model information

**Output Information**:
- Model name (e.g., all-MiniLM-L6-v2)
- Vector dimension (e.g., 384)
- Number of embeddings generated
- Full vector data (expandable/collapsible)

**Use Cases**:
- Testing embedding quality
- Debugging vector representations
- Preparing embeddings for external use
- Understanding model output

---

## User Interface Features

### Responsive Design
- Sidebar collapses on smaller screens
- Grid layouts adapt to screen size
- Mobile-friendly forms and controls

### Visual Feedback
- Loading states for all operations
- Success/error messages with Toast notifications
- Color-coded similarity scores
- Confirmation dialogs for destructive actions

### Data Management
- Form validation and error handling
- JSON syntax validation for metadata
- Automatic list refresh after mutations
- Reset/clear form functionality

---

## Technical Implementation

### API Integration
- All API calls use native Fetch API
- Centralized API utility functions in `lib/api.ts`
- Proper error handling and user feedback
- TypeScript interfaces for type safety

### Component Architecture
- Modular panel-based design
- Reusable UI components from Ant Design
- Client-side state management
- No external state management libraries needed

### Performance
- Efficient rendering with React Server Components
- Minimal JavaScript bundle size
- No unnecessary dependencies
- Fast page loads and interactions

---

## Best Practices

### Collections
- Use descriptive collection names
- Organize by domain or use case
- Regular cleanup of unused collections

### Metadata
- Include searchable fields
- Use consistent schema across documents
- Add timestamps and source information

### Search
- Start with higher limits to explore results
- Adjust score threshold based on use case
- Use specific queries for better results

### Embeddings
- Test different texts to understand model behavior
- Compare embeddings for similar/different texts
- Use batch processing for efficiency

---

## Future Enhancement Ideas

- Collection statistics (document count, size)
- Bulk delete for documents
- Export/import functionality
- Search history
- Advanced filtering options
- Visualization of embedding spaces
- User authentication
- API key management

