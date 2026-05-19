# Tasks: create-knowledge-engine

## Phase 1 — InMemoryKnowledgeProvider + Engine Core

**Goal:** Fully functional knowledge retrieval engine with in-memory keyword search. Source registration, retrieval, ranking, confidence scoring, memory windows, ownership gating.

- [ ] Define canonical knowledge entities in `packages/shared/src/knowledge/`:
  - `KnowledgeSource.ts` — `KnowledgeSource`, `KnowledgeCategory`
  - `KnowledgeDocument.ts` — `KnowledgeDocument`
  - `KnowledgeChunk.ts` — `KnowledgeChunk`
  - `RetrievalResult.ts` — `RetrievalQuery`, `RetrievalResult`
  - `MemoryWindow.ts` — `MemoryWindow`
- [ ] Add knowledge ID prefixes to `packages/shared/src/ids/EntityId.ts`:
  - `knw_` — KnowledgeSourceId
  - `kdc_` — KnowledgeDocumentId
  - `kch_` — KnowledgeChunkId
  - `mwd_` — MemoryWindowId
- [ ] Define `KnowledgeProvider` interface in `src/providers/KnowledgeProvider.ts`
- [ ] Define `EmbeddingProvider` interface in `src/providers/EmbeddingProvider.ts`
- [ ] Implement `InMemoryKnowledgeProvider` with Maps for sources, documents, chunks
- [ ] Implement keyword-based retrieval (text matching with scoring — Phase 1; vector search in Phase 2)
- [ ] Implement deterministic ranking (similarity, freshness, authority, composite strategies)
- [ ] Implement deterministic confidence scoring: f(similarity × authority × freshness)
- [ ] Implement `KnowledgeEngine` class implementing `Engine` contract (`engineName` + `execute`)
- [ ] Wire `OwnershipGuard` integration — LOCKED blocks source mutations, AI cannot register/disable sources, SHARED requires approval
- [ ] Implement `execute()` action router:
  - `retrieve`, `rank_results`, `score_confidence`
  - `create_memory_window`, `clear_memory_window`
  - `register_source`, `disable_source`
- [ ] Wire `DomainEvent` emission — every retrieval mutation produces an event with correlationId + causationId
- [ ] Implement memory window: conversation-scoped, TTL-governed, FIFO eviction, clear on handoff
- [ ] Implement hallucination boundary: below-threshold results flagged with `meetsThreshold: false`
- [ ] Implement source disabling as soft-disable (documents preserved, excluded from retrieval)
- [ ] Export public types and classes in `src/index.ts`
- [ ] Write tests:
  - `retrieval.test.ts` — keyword retrieval, empty sources, filters
  - `ranking.test.ts` — all 4 ranking strategies
  - `confidence.test.ts` — scoring computation, threshold gating
  - `sources.test.ts` — register, disable, soft-delete
  - `memory.test.ts` — create, clear, TTL, eviction
  - `ownership.test.ts` — LOCKED/AI/HUMAN/SHARED retrieval permissions
  - `orchestration.test.ts` — Engine contract, event emission, correlation
  - `integration.test.ts` — E2E: register source → index → retrieve → rank → score
- [ ] Verify: typecheck, tests passing, workspace integrity

**Deliverable:** Working knowledge retrieval engine usable by workflow-orchestrator, handoff-engine, and CRM engine.

## Phase 2 — Vector Store Adapters

**Goal:** Real vector store integrations as `KnowledgeProvider` implementations.

- [ ] Implement `PineconeKnowledgeAdapter` class implementing `KnowledgeProvider`
- [ ] Pinecone index management (create, configure, delete)
- [ ] Map canonical entities ↔ Pinecone records:
  - `KnowledgeSource` ↔ Pinecone index metadata
  - `KnowledgeDocument` ↔ Pinecone namespace
  - `KnowledgeChunk` ↔ Pinecone vector with metadata
  - `RetrievalResult` ↔ Pinecone query result + score
- [ ] Provider ID mapping: `providerIds.pinecone = pineconeRecord.id` on upsert
- [ ] Implement `QdrantKnowledgeAdapter` class implementing `KnowledgeProvider`
- [ ] Qdrant collection management
- [ ] Map canonical entities ↔ Qdrant points
- [ ] Implement `PgvectorKnowledgeAdapter` class implementing `KnowledgeProvider`
- [ ] PostgreSQL + pgvector tables with HNSW indexes
- [ ] Map canonical entities ↔ pgvector rows
- [ ] Error handling: rate limits, timeouts, 5xx → `PROVIDER_UNAVAILABLE`
- [ ] Tests with mocked Pinecone/Qdrant/pgvector APIs

**Deliverable:** Pinecone + Qdrant + pgvector backed knowledge engine — same interface, real vector stores.

## Phase 3 — Embedding Providers + Answer Generation

**Goal:** Real embedding generation and LLM answer generation.

- [ ] Implement `OpenAIEmbeddingProvider` implementing `EmbeddingProvider`
- [ ] Implement `CohereEmbeddingProvider` implementing `EmbeddingProvider`
- [ ] Implement `VoyageAIEmbeddingProvider` implementing `EmbeddingProvider`
- [ ] Wire embedding provider into retrieval pipeline (embed query → vector search)
- [ ] Implement chunk embedding during document indexing
- [ ] Implement answer generation via LLM (OpenRouter / Vercel AI SDK)
- [ ] Prompt template with source citation: "Based on [source], answer: [query]"
- [ ] Citation formatting in generated answers
- [ ] Confidence-gated generation: low confidence → no generation, fallback response
- [ ] Streaming answer support
- [ ] Tests with fake embedding providers and mock LLM

**Deliverable:** Full RAG pipeline — embed → retrieve → generate with citations.

## Phase 4 — Persistence

**Goal:** PostgreSQL-backed knowledge storage.

- [ ] Implement `PostgresKnowledgeProvider` (Supabase/Postgres)
- [ ] Schema: `knowledge_sources`, `knowledge_documents`, `knowledge_chunks`, `retrieval_events`, `memory_windows`
- [ ] pgvector column on `knowledge_chunks.embedding`
- [ ] HNSW index for efficient vector search
- [ ] GIN index on `knowledge_chunks.content` for hybrid keyword + vector
- [ ] JSONB columns for `providerIds` and `metadata`
- [ ] RLS policies for `tenant_id`
- [ ] Migrations
- [ ] Tests with real Postgres (testcontainers or Supabase local)

**Deliverable:** Persistent knowledge engine — data survives restarts, efficient vector + keyword queries.

## Phase 5 — Analytics + Reranker

**Goal:** Retrieval observability and precision improvements.

- [ ] Retrieval volume metrics (per vertical, per source, per category)
- [ ] Confidence distribution analytics
- [ ] Source utilization analytics (which sources serve most results)
- [ ] Cache hit rate for memory windows
- [ ] Low-confidence rate tracking (hallucination boundary triggering)
- [ ] Implement reranker model for post-retrieval precision improvement
- [ ] Retrieval latency tracking
- [ ] Event stream for external analytics ingestion

**Deliverable:** Knowledge dashboards and retrieval precision analytics.

## Phase 6 — Multitenancy + Knowledge Lifecycle

**Goal:** Full tenant isolation and knowledge lifecycle management.

- [ ] `tenantId` enforcement on all queries
- [ ] `workspaceId` for sub-tenant grouping
- [ ] `verticalId` for vertical-specific knowledge isolation
- [ ] Per-tenant knowledge provider configuration
- [ ] Knowledge freshness policies (auto-disable stale sources)
- [ ] Knowledge review workflow (human reviews flagged low-confidence retrievals)
- [ ] Knowledge versioning (source v1 → v2 with rollback)
- [ ] Tenant provisioning / deprovisioning

**Deliverable:** Multi-tenant, multi-vertical knowledge isolation with lifecycle governance.
