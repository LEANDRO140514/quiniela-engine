export interface KnowledgeDocument {
  id: string;
  vertical: string;
  category: KnowledgeCategory;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding?: number[];
}

export type KnowledgeCategory =
  | 'faq'
  | 'procedure'
  | 'policy'
  | 'terminology'
  | 'emergency'
  | 'insurance'
  | 'pricing'
  | 'onboarding'
  | 'general';

export interface SearchQuery {
  text: string;
  vertical: string;
  topK?: number;
  minScore?: number;
  filter?: {
    categories?: KnowledgeCategory[];
  };
}

export interface SearchResult {
  document: KnowledgeDocument;
  score: number;
}

export interface KnowledgeEngineConfig {
  vertical: string;
  indexPath: string;
  embeddingModel?: string;
  chunkSize?: number;
  chunkOverlap?: number;
}
