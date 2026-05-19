import type { KnowledgeChunk } from './schemas/knowledge-chunk';

interface SearchResult {
  chunk: KnowledgeChunk;
  score: number;
}

interface RetrievalOptions {
  topK?: number;
  minScore?: number;
}

interface VectorStore {
  upsert(chunks: KnowledgeChunk[]): Promise<void>;
  query(embedding: number[], options: RetrievalOptions): Promise<SearchResult[]>;
  deleteBySourceId(sourceId: string): Promise<void>;
}

export class RetrievalService {
  private vectorStore: VectorStore | null = null;
  private defaultOptions: RetrievalOptions;

  constructor(options: RetrievalOptions = {}) {
    this.defaultOptions = {
      topK: options.topK ?? 5,
      minScore: options.minScore ?? 0.7,
    };
  }

  async initialize(store: VectorStore): Promise<void> {
    this.vectorStore = store;
    // Fase 3+: Inicializar conexión a Pinecone / vector store real
  }

  async search(_embedding: number[], _options?: RetrievalOptions): Promise<SearchResult[]> {
    if (!this.vectorStore) {
      throw new Error('RetrievalService no inicializado — llamar initialize() primero');
    }
    // Fase 3+: Búsqueda semántica real
    throw new Error('RetrievalService.search() no implementado — Fase 3+');
  }

  setVectorStore(store: VectorStore): void {
    this.vectorStore = store;
  }
}

export type { SearchResult, RetrievalOptions, VectorStore };
