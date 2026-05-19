# Design: create-knowledge-engine

## 1. Conceptual Architecture

```
┌──────────────────────────────────────┐
│       KnowledgeEngine                 │  ← Engine contract + ownership gates + events
│   (owns KnowledgeProvider ref)        │
│   (owns MemoryWindow state)           │
│   (owns SourceRegistry)               │
└──────────┬───────────────────────────┘
           │ depends on interface (not implementation)
           ▼
┌──────────────────────────────────────┐
│   KnowledgeProvider (interface)       │  ← Defined in this engine
│                                       │
│   + retrieve(query, topK, filters)    │
│   + indexDocuments(docs)              │
│   + deleteBySource(sourceId)          │
│   + getSource(sourceId)               │
│   + registerSource(source)            │
│   + disableSource(sourceId)           │
└──────────┬───────────────────────────┘
           │
     ┌─────┴─────┬──────────┬──────────┬──────────┐
     ▼           ▼          ▼          ▼          ▼
InMemory     Pinecone    Qdrant     pgvector    Weaviate
Knowledge    Adapter     Adapter     Adapter     Adapter
Provider     (Phase 2)   (Phase 2)   (Phase 2)   (Phase 2)
(Phase 1)
```

The engine NEVER imports Pinecone, Qdrant, or OpenAI types directly. Providers are injected at construction time:

```typescript
// Phase 1
const engine = new KnowledgeEngine({ provider: new InMemoryKnowledgeProvider() });

// Phase 2
const engine = new KnowledgeEngine({ provider: new PineconeKnowledgeAdapter({ apiKey, index }) });
```

## 2. Canonical Entities

Defined in `packages/shared/src/knowledge/`. **The engine does not redefine these.**

### 2.1 KnowledgeSource

```typescript
{
  id: KnowledgeSourceId;               // "knw_<ulid>"
  tenantId?: TenantId;
  name: string;                        // "Dental FAQ v2"
  vertical: string;                    // "dental" | "academic"
  category: KnowledgeCategory;         // "faq" | "procedure" | "policy" | ...
  provider: string;                    // "pinecone" | "qdrant" | "pgvector"
  providerIds: Record<string, string>; // { pinecone: "index_abc", qdrant: "col_xyz" }
  active: boolean;
  priority: number;                    // 0-100, higher = preferred
  freshness: number;                   // Unix ms timestamp of last update
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, unknown>;
}
```

### 2.2 KnowledgeDocument

```typescript
{
  id: KnowledgeDocumentId;             // "kdc_<ulid>"
  sourceId: KnowledgeSourceId;
  title: string;
  content: string;
  category: KnowledgeCategory;
  tags: string[];
  embedding?: number[];
  createdAt: number;
  metadata: Record<string, unknown>;
}
```

### 2.3 KnowledgeChunk

```typescript
{
  id: KnowledgeChunkId;                // "kch_<ulid>"
  sourceId: KnowledgeSourceId;
  documentId: KnowledgeDocumentId;
  content: string;
  category: KnowledgeCategory;
  chunkIndex: number;
  totalChunks: number;
  embedding?: number[];
  metadata: Record<string, unknown>;
}
```

### 2.4 RetrievalQuery

```typescript
{
  text: string;
  vertical: string;
  topK?: number;                       // default 5
  minScore?: number;                   // default 0.7
  filters?: {
    categories?: KnowledgeCategory[];
    sources?: KnowledgeSourceId[];
    tags?: string[];
  };
}
```

### 2.5 RetrievalResult

```typescript
{
  chunk: KnowledgeChunk;
  document: KnowledgeDocument;
  source: KnowledgeSource;
  score: number;                       // 0-1 similarity
  confidence: number;                  // 0-1 composite (score × authority × freshness)
  provenance: {
    sourceName: string;
    sourceId: KnowledgeSourceId;
    documentTitle: string;
    chunkIndex: number;
    retrievedAt: number;
  };
}
```

### 2.6 MemoryWindow

```typescript
{
  id: MemoryWindowId;                  // "mwd_<ulid>"
  conversationId: string;
  results: RetrievalResult[];          // cached results within this window
  createdAt: number;
  expiresAt: number;                   // TTL
  clearedAt?: number;
  metadata: Record<string, unknown>;
}
```

## 3. Knowledge Categories

```typescript
type KnowledgeCategory =
  | 'faq'
  | 'procedure'
  | 'policy'
  | 'terminology'
  | 'emergency'
  | 'insurance'
  | 'pricing'
  | 'onboarding'
  | 'general';
```

Categories are vertical-agnostic. Dental uses `faq`, `procedure`, `policy`, `emergency`, `insurance`, `pricing`. Academic uses `faq`, `policy`, `procedure` (curricula), `onboarding` (admissions).

## 4. Engine Contract

```typescript
interface Engine {
  readonly engineName: string;  // "knowledge-engine"
  execute(action: string, context: Record<string, unknown>): Promise<Record<string, unknown>>;
}
```

The `context` MUST carry:
- `conversationId?: string` — for memory window scoping
- `tenantId?: string` — for tenant scoping
- `workflowId?: string` — for event correlation
- `correlationId?: string` — for event chaining
- `actorId?: string` — for audit trail
- `verticalId?: string` — for vertical-scoped retrieval

## 5. Capabilities (actions)

### 5.1 retrieve

```
Input:  { query: string, vertical: string, topK?: number, minScore?: number, categories?: string[], tags?: string[] }
Output: { results: RetrievalResult[], query: RetrievalQuery }
Event:  KnowledgeRetrieved { query, results, retrievalTimestamp }
Errors: NO_SOURCES_AVAILABLE, RETRIEVAL_TIMEOUT, INVALID_VERTICAL
```

### 5.2 rank_results

```
Input:  { results: RetrievalResult[], strategy?: 'similarity' | 'freshness' | 'authority' | 'composite' }
Output: { ranked: RetrievalResult[] }
Event:  KnowledgeRanked { ranked, strategy, previousOrder }
Errors: EMPTY_RESULT_SET
```

### 5.3 score_confidence

```
Input:  { results: RetrievalResult[], threshold?: number }
Output: { results: RetrievalResult[], belowThreshold: RetrievalResult[], meetsThreshold: boolean }
Event:  ConfidenceScored { results, threshold, meetsThreshold }
Errors: EMPTY_RESULT_SET
```

### 5.4 create_memory_window

```
Input:  { conversationId: string, ttlMs?: number }
Output: { memoryWindow: MemoryWindow }
Event:  MemoryWindowCreated { memoryWindow }
Errors: WINDOW_ALREADY_EXISTS
```

### 5.5 clear_memory_window

```
Input:  { conversationId: string }
Output: { memoryWindow: MemoryWindow }
Event:  MemoryWindowCleared { conversationId, resultCount, clearedAt }
Errors: WINDOW_NOT_FOUND
```

### 5.6 register_source

```
Input:  { name: string, vertical: string, category: KnowledgeCategory, priority?: number }
Output: { source: KnowledgeSource }
Event:  KnowledgeSourceRegistered { source }
Errors: SOURCE_ALREADY_EXISTS, INVALID_VERTICAL
```

### 5.7 disable_source

```
Input:  { sourceId: string }
Output: { source: KnowledgeSource }
Event:  KnowledgeSourceDisabled { sourceId, previousActive, disabledAt }
Errors: SOURCE_NOT_FOUND, SOURCE_ALREADY_DISABLED
```

## 6. Event Catalog

All events conform to `DomainEvent` from `packages/shared/src/events/DomainEvent.ts`.

| Event Type | Required Payload Fields | causationId |
|---|---|---|
| `KnowledgeRetrieved` | `query: RetrievalQuery, results: RetrievalResult[]` | workflow step |
| `KnowledgeRanked` | `ranked: RetrievalResult[], strategy: string` | `KnowledgeRetrieved` |
| `ConfidenceScored` | `results: RetrievalResult[], threshold, meetsThreshold` | `KnowledgeRanked` |
| `MemoryWindowCreated` | `memoryWindow: MemoryWindow` | workflow step |
| `MemoryWindowCleared` | `conversationId, resultCount, clearedAt` | handoff event |
| `KnowledgeSourceRegistered` | `source: KnowledgeSource` | workflow step |
| `KnowledgeSourceDisabled` | `sourceId, previousActive, disabledAt` | workflow step |

## 7. Invariants (MUST NOT be violated)

### 7.1 Identity Invariants

- **K1:** `providerIds` MUST be a separate map from the canonical `id`
- **K2:** Canonical `id` MUST use the correct prefix per entity type (`knw_`, `kdc_`, `kch_`, `mwd_`)
- **K3:** `providerIds` MUST NOT be used as the primary key in any engine operation

### 7.2 Retrieval Invariants

- **K4:** Every retrieval result MUST include provenance (source, document, chunk metadata)
- **K5:** Retrieval with zero available sources MUST return structured error, never fabricated answer
- **K6:** Disabled sources MUST be excluded from all retrieval operations
- **K7:** Confidence score MUST be computed deterministically (not claimed by AI)

### 7.3 Source Invariants

- **K8:** `priority` MUST be in range [0, 100]
- **K9:** Disabling a source MUST NOT delete its documents or chunks (soft disable)
- **K10:** Source registration requires `vertical` and `category` to be present
- **K11:** A source CANNOT be registered twice with the same name within the same vertical + category

### 7.4 Memory Window Invariants

- **K12:** Memory windows are conversation-scoped (one window per conversationId)
- **K13:** Memory window TTL MUST be respected — results past `expiresAt` are invalid
- **K14:** Clearing a memory window removes all cached results for that conversation
- **K15:** Memory windows MUST NOT persist across handoff (cleared on conversation close)

### 7.5 Confidence Invariants

- **K16:** Confidence = f(similarity_score, source_authority, knowledge_freshness)
- **K17:** Results below `minScore` threshold MUST be flagged (not discarded — caller decides)
- **K18:** Below-threshold retrieval MUST NOT be presented as certain knowledge

### 7.6 Ownership Invariants

- **K19:** `LOCKED` ownership blocks ALL source mutations (register, disable)
- **K20:** Under `AI` ownership, retrieval is allowed; source mutations are blocked
- **K21:** Under `SHARED` ownership, source mutations require explicit human approval
- **K22:** `HUMAN` ownership has full retrieval + source mutation permissions

### 7.7 Event Invariants

- **K23:** EVERY retrieval mutation MUST emit a `DomainEvent`
- **K24:** Every event MUST carry `correlationId` when emitted within a workflow execution
- **K25:** Every event MUST carry `actorId` identifying who triggered the action

## 8. Retrieval Governance

### 8.1 Retrieval Pipeline

```
User Query
  │
  ├─ 1. Validate query (text length, vertical exists)
  ├─ 2. Check active sources for vertical
  ├─ 3. Embed query (provider: OpenAI, Cohere, VoyageAI)
  ├─ 4. Search vector store(s) per source
  ├─ 5. Merge results from all active sources
  ├─ 6. Apply filters (categories, tags)
  ├─ 7. Rank: sort by composite score
  ├─ 8. Score confidence: f(similarity × authority × freshness)
  ├─ 9. Apply threshold: flag below minScore
  └─ 10. Return results with provenance
```

### 8.2 Ranking Semantics

```
rank(results, strategy):
  if strategy == 'similarity':  sort by score DESC
  if strategy == 'freshness':   sort by source.freshness DESC
  if strategy == 'authority':   sort by source.priority DESC
  if strategy == 'composite':   sort by (score × 0.5 + authority × 0.3 + freshness × 0.2) DESC
```

### 8.3 Confidence Model

```
confidence(result):
  similarityFactor = result.score                    // 0-1, from vector search
  authorityFactor  = result.source.priority / 100    // 0-1, from source registration
  freshnessFactor  = freshnessWeight(result.source.freshness)  // 0-1, decay function
  
  return (similarityFactor × 0.50) + (authorityFactor × 0.30) + (freshnessFactor × 0.20)
```

### 8.4 Hallucination Boundary

```
if all results below minScore:
  return {
    results: [],
    belowThreshold: all,
    meetsThreshold: false,
    fallback: "NO_CONFIDENT_ANSWER"
  }
```

The caller (workflow-orchestrator, message-buffer, or conversational agent) decides:
- Respond with "I don't have enough information"
- Escalate to human
- Re-query with broader parameters
- Use base LLM knowledge with explicit disclaimer

## 9. Memory Window Semantics

```
MemoryWindow:
  ├─ Created at conversation start or first retrieval
  ├─ Scoped to conversationId
  ├─ TTL: default 30 minutes (configurable per vertical)
  ├─ Stores last N retrieval results (default N = 50)
  ├─ Expired results auto-pruned on next retrieval
  ├─ Cleared on handoff (conversation closed, human takes over)
  └─ Queryable: "what did we retrieve earlier about X?"
```

## 10. Source Prioritization Model

```
Source priority:
  priority 100: Authoritative (regulatory, legal, official)
  priority 75:  Primary (internal policies, procedures)
  priority 50:  Secondary (FAQs, guides, onboarding)
  priority 25:  Supplementary (general knowledge, terminology)
  priority 0:   Deprecated (kept for audit, excluded from retrieval)
```

## 11. Ownership & Handoff Integration

knowledge-engine reads ownership from the conversation context. It does NOT manage ownership — that is handoff-engine's responsibility.

```typescript
const owner = ownershipResolver(context.conversationId) ?? 'AI';

if (owner === 'LOCKED') {
  return { error: 'OWNERSHIP_LOCKED', message: 'Knowledge source mutations blocked — ownership is LOCKED' };
}

const sourceMutationActions = ['register_source', 'disable_source'];

if (sourceMutationActions.includes(action) && owner === 'AI') {
  return { error: 'OWNERSHIP_INSUFFICIENT', message: 'Source mutations require HUMAN or SHARED ownership' };
}

if (sourceMutationActions.includes(action) && owner === 'SHARED' && !context.approvedBy) {
  return { error: 'APPROVAL_REQUIRED', message: 'Human approval required under SHARED ownership' };
}
```

**Permission Matrix:**

| Action | AI | HUMAN | SHARED | LOCKED |
|---|---|---|---|---|
| `retrieve` | ✓ | ✓ | ✓ | ✓ |
| `rank_results` | ✓ | ✓ | ✓ | ✓ |
| `score_confidence` | ✓ | ✓ | ✓ | ✓ |
| `create_memory_window` | ✓ | ✓ | ✓ | ✗ |
| `clear_memory_window` | ✓ | ✓ | ✓ | ✗ |
| `register_source` | ✗ | ✓ | ✗¹ | ✗ |
| `disable_source` | ✗ | ✓ | ✗¹ | ✗ |

¹ Allowed if `context.approvedBy` is present (human co-approval)

## 12. Workflow Orchestration Integration

knowledge-engine is a standard engine. Any workflow step can call it:

```json
{
  "id": "retrieve-faq",
  "name": "Retrieve FAQ Knowledge",
  "type": "action",
  "engine": "knowledge-engine",
  "action": "retrieve",
  "input": {
    "query": "{{state.userQuestion}}",
    "vertical": "{{state.vertical}}",
    "topK": 5,
    "minScore": 0.7,
    "categories": ["faq", "policy"]
  }
}
```

The workflow-orchestrator's `WorkflowExecutor` calls `engine.execute(action, context)` — the knowledge-engine resolves the action, performs retrieval, emits an event, and returns results to the workflow context.

## 13. KnowledgeProvider Interface

```typescript
interface KnowledgeProvider {
  readonly providerName: string;

  // Retrieval
  retrieve(query: RetrievalQuery): Promise<RetrievalResult[]>;

  // Indexing
  indexDocuments(documents: KnowledgeDocument[]): Promise<void>;
  indexChunks(chunks: KnowledgeChunk[]): Promise<void>;
  deleteBySource(sourceId: KnowledgeSourceId): Promise<void>;

  // Source management
  registerSource(source: KnowledgeSource): Promise<KnowledgeSource>;
  disableSource(sourceId: KnowledgeSourceId): Promise<KnowledgeSource>;
  getSource(sourceId: KnowledgeSourceId): Promise<KnowledgeSource | undefined>;
  getActiveSources(vertical: string): Promise<KnowledgeSource[]>;
}
```

**Phase 1 implementation:** `InMemoryKnowledgeProvider`
**Phase 2 implementation:** `PineconeKnowledgeAdapter`, `QdrantKnowledgeAdapter`, `PgvectorKnowledgeAdapter`

## 14. Provider Abstraction Model

```
┌──────────────────────────────┐
│      KnowledgeEngine          │  ← Engine contract + ownership gates + events
│   (owns KnowledgeProvider ref) │
└──────────┬───────────────────┘
           │ depends on interface (not implementation)
           ▼
┌──────────────────────────────┐
│  KnowledgeProvider (interface)│  ← Defined in this engine
└──────────┬───────────────────┘
           │
     ┌─────┴─────┬──────────┬──────────┬──────────┐
     ▼           ▼          ▼          ▼          ▼
InMemory     Pinecone    Qdrant     pgvector   Weaviate
Knowledge    Adapter     Adapter     Adapter    Adapter
Provider     (Phase 2)   (Phase 2)   (Phase 2)  (Phase 2)
(Phase 1)
```

Also separate: **EmbeddingProvider** interface:

```typescript
interface EmbeddingProvider {
  readonly providerName: string;
  embedText(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}
```

## 15. Error Model

All errors are **returned as structured results**, never thrown.

```typescript
// Success
{ results: RetrievalResult[], query: RetrievalQuery }
{ source: KnowledgeSource }
{ memoryWindow: MemoryWindow }

// Error
{ error: "NO_SOURCES_AVAILABLE", message: "No active knowledge sources registered for vertical 'dental'" }
{ error: "RETRIEVAL_TIMEOUT", message: "Retrieval timed out after 5000ms" }
{ error: "LOW_CONFIDENCE", message: "All results below confidence threshold 0.7" }
{ error: "SOURCE_NOT_FOUND", message: "KnowledgeSource knw_xxx does not exist" }
{ error: "SOURCE_ALREADY_DISABLED", message: "KnowledgeSource knw_xxx is already disabled" }
{ error: "OWNERSHIP_LOCKED", message: "Knowledge source mutations blocked — ownership is LOCKED" }
{ error: "OWNERSHIP_INSUFFICIENT", message: "Action 'register_source' requires HUMAN ownership" }
{ error: "APPROVAL_REQUIRED", message: "Human approval required under SHARED ownership" }
{ error: "INVALID_VERTICAL", message: "Vertical 'martian' is not registered" }
{ error: "EMPTY_RESULT_SET", message: "Cannot rank/score an empty result set" }
{ error: "WINDOW_NOT_FOUND", message: "No memory window for conversation conv_xxx" }
{ error: "WINDOW_ALREADY_EXISTS", message: "Memory window already exists for conversation conv_xxx" }
```

## 16. Failure Modes

| Failure | Behavior |
|---|---|
| No sources available | Return `NO_SOURCES_AVAILABLE` error |
| Retrieval timeout | Return `RETRIEVAL_TIMEOUT` error |
| Stale knowledge (> 90 days) | Include in results but flag `freshnessFactor = 0` |
| Low confidence (all < threshold) | Return results with `meetsThreshold: false`, fallback flag |
| Memory overflow (> 50 results) | Evict oldest results (FIFO) |
| Provider unavailable | Return `PROVIDER_UNAVAILABLE` error |
| Invalid source ID | Return `SOURCE_NOT_FOUND` error |
| Ranking failure (empty set) | Return `EMPTY_RESULT_SET` error |
| Hallucination boundary triggered | Return `LOW_CONFIDENCE` with empty results |

## 17. Future: Persistence (Phase 4)

- PostgreSQL tables: `knowledge_sources`, `knowledge_documents`, `knowledge_chunks`, `retrieval_events`, `memory_windows`
- pgvector column on `knowledge_chunks.embedding` for native vector search
- JSONB columns for `providerIds` and `metadata`
- RLS policies for `tenant_id`
- GIN index on `knowledge_chunks.content` for hybrid keyword + vector search
- Event sourcing for retrieval audit trail

## 18. Future: Multitenancy (Phase 6)

- `tenantId` enforcement on all queries
- `workspaceId` for sub-tenant grouping
- `verticalId` for vertical-specific knowledge isolation
- Per-tenant knowledge provider configuration
- Per-tenant embedding model selection
- Tenant provisioning / deprovisioning

## 19. Observability

- Every retrieval carries `correlationId` linking it to a workflow execution
- Every event carries `causationId` linking it to its parent event
- `metadata` on every entity for provider-specific tracing
- `provenance` on every `RetrievalResult` for citation
- Confidence tracing: score + authority + freshness decomposition
- Retrieval analytics: cache hit rate, confidence distribution, source utilization

## 20. What This Design Does NOT Cover

- OpenAI / Cohere embedding API (Phase 3)
- Pinecone / Qdrant vector store integration (Phase 2)
- LLM answer generation (Phase 3)
- PostgreSQL persistence (Phase 4)
- Reranker models (Phase 5)
- Analytics dashboards (Phase 5)
- Agent memory / autonomous reasoning
- Real-time knowledge updates
- Fine-tuned embedding models
