import type { KnowledgeChunk } from './schemas/knowledge-chunk';

interface EmbeddingOptions {
  model?: string;
  batchSize?: number;
}

interface EmbeddingResult {
  chunkId: string;
  embedding: number[];
  tokensUsed: number;
}

export class EmbeddingService {
  private model: string;
  private batchSize: number;

  constructor(options: EmbeddingOptions = {}) {
    this.model = options.model ?? 'text-embedding-3-small';
    this.batchSize = options.batchSize ?? 20;
  }

  async initialize(): Promise<void> {
    // Fase 3+: Inicializar cliente de embeddings (OpenAI / Proveedor)
  }

  async embedChunks(_chunks: KnowledgeChunk[]): Promise<EmbeddingResult[]> {
    // Fase 3+: Generar embeddings reales via API
    throw new Error('EmbeddingService.embedChunks() no implementado — Fase 3+');
  }

  async embedQuery(_text: string): Promise<number[]> {
    // Fase 3+: Generar embedding para consulta del usuario
    throw new Error('EmbeddingService.embedQuery() no implementado — Fase 3+');
  }
}
