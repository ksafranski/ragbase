const API_BASE_URL = 'http://localhost:8000';

export interface Document {
  text: string;
  metadata?: Record<string, any>;
}

export interface SearchResult {
  id: string;
  score: number;
  text: string;
  metadata: Record<string, any>;
  vector?: number[];
}

export interface EmbedResponse {
  embeddings: number[][];
  model: string;
  dimension: number;
}

// Health Check
export async function checkHealth(): Promise<{ status: string; qdrant: string; models_loaded: number; default_model: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) throw new Error('Health check failed');
  return response.json();
}

// Models
export interface ModelInfo {
  name: string;
  dimension: number;
  description: string;
  is_default: boolean;
}

export async function listModels(): Promise<{ models: ModelInfo[]; default_model: string }> {
  const response = await fetch(`${API_BASE_URL}/models`);
  if (!response.ok) throw new Error('Failed to fetch models');
  return response.json();
}

// Collections
export async function listCollections(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/collections`);
  if (!response.ok) throw new Error('Failed to fetch collections');
  const data = await response.json();
  return data.collections;
}

export async function createCollection(
  collectionName: string,
  model?: string,
  distance?: string
): Promise<{ status: string; collection: string; model: string; dimension: number; distance: string }> {
  const response = await fetch(`${API_BASE_URL}/collections/${collectionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || null,
      distance: distance || 'cosine',
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create collection');
  }
  return response.json();
}

export async function deleteCollection(collectionName: string): Promise<{ status: string; collection: string }> {
  const response = await fetch(`${API_BASE_URL}/collections/${collectionName}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete collection');
  }
  return response.json();
}

export interface CollectionDocument {
  id: string;
  text: string;
  metadata: Record<string, any>;
}

export interface CollectionInfo {
  collection: string;
  model: string;
  vectors_count: number;
  points_count: number;
  status: string;
  vector_size: number;
  distance_metric: string;
  indexed_vectors_count: number;
  segments_count: number;
  optimizer_status: number | null;
  documents: CollectionDocument[];
  limit: number;
  offset: number;
}

export async function getCollectionInfo(
  collectionName: string,
  limit: number = 100,
  offset: number = 0
): Promise<CollectionInfo> {
  const response = await fetch(
    `${API_BASE_URL}/collections/${collectionName}/info?limit=${limit}&offset=${offset}`
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch collection info');
  }
  return response.json();
}

// Embeddings
export async function generateEmbeddings(text: string | string[]): Promise<EmbedResponse> {
  const response = await fetch(`${API_BASE_URL}/embed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error('Failed to generate embeddings');
  return response.json();
}

// Upsert Documents
export async function upsertDocuments(
  collection: string,
  documents: Document[]
): Promise<{ status: string; collection: string; inserted: number }> {
  const response = await fetch(`${API_BASE_URL}/upsert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ collection, documents }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upsert documents');
  }
  return response.json();
}

// Search
export async function searchDocuments(
  collection: string,
  query: string,
  limit: number = 5,
  scoreThreshold?: number
): Promise<{ query: string; query_vector: number[]; results: SearchResult[] }> {
  const response = await fetch(`${API_BASE_URL}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      collection,
      query,
      limit,
      score_threshold: scoreThreshold,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to search documents');
  }
  return response.json();
}


