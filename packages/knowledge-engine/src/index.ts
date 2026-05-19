export { KnowledgeEngine } from './engine';

export type {
  KnowledgeDocument,
  KnowledgeCategory,
  SearchQuery,
  SearchResult,
  KnowledgeEngineConfig,
} from './types';

export {
  FaqSchema,
  type Faq,
  FaqArraySchema,
  ProcedureSchema,
  type Procedure,
  ProcedureArraySchema,
  AppointmentSchema,
  type Appointment,
  type AppointmentStatus,
  AppointmentArraySchema,
  PatientSchema,
  type Patient,
  PatientArraySchema,
  KnowledgeChunkSchema,
  type KnowledgeChunk,
  type KnowledgeChunkCategory,
  KnowledgeChunkArraySchema,
} from './schemas';

export { loadFAQs, loadProcedures, loadPolicies, loadKnowledge, searchKnowledgeByCategory } from './loaders';
export type { KnowledgeIndex } from './loaders';

export { chunkText, chunkDocument, chunkDocuments } from './chunking';
export { EmbeddingService } from './embedding';
export { RetrievalService } from './retrieval';
export type { SearchResult as RetrievalSearchResult, RetrievalOptions, VectorStore } from './retrieval';
