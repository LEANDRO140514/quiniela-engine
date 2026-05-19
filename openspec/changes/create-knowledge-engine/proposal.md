# Proposal: create-knowledge-engine

## Summary

Create `@curdeeclau/knowledge-engine` — the Knowledge Retrieval Runtime Engine of Algorithmus Platform. `knowledge-engine` governs retrieval lifecycle, grounding, source prioritization, retrieval confidence, hallucination boundaries, memory windows, and retrieval ownership through deterministic, event-driven knowledge retrieval semantics. Pinecone, Qdrant, OpenAI, and pgvector are **providers**, not the runtime model.

## Problem

Algorithmus Platform has message-buffer, workflow-orchestrator, handoff, CRM, and calendar engines. But there is no knowledge retrieval runtime. Conversations can route to humans, schedule appointments, and manage contacts — but cannot:

- Retrieve FAQ answers with provenance tracking
- Ground responses in verified knowledge sources
- Prioritize sources by freshness, authority, and relevance
- Score retrieval confidence deterministically
- Enforce hallucination boundaries (low confidence → defer to human)
- Manage temporal memory windows (conversation-scoped, expiring)
- Register and disable knowledge sources at runtime
- Integrate retrieval with workflow orchestration (pre-retrieval → retrieval → confidence → next step)

Without this, Sarah (dental) cannot ground clinical answers in procedure knowledge, and EVA (academic) cannot retrieve admission policies or curriculum information through conversational flows.

## Why Knowledge Engine Is NOT an OpenAI / Pinecone Wrapper

Knowledge retrieval is **runtime governance**, not a provider integration:

| Concern | Runtime Governance | Provider Integration |
|---|---|---|
| Retrieval | Query → embed → search → rank → confidence → ground | OpenAI Embeddings API |
| Grounding | Source provenance, citation, hallucination boundary | Pinecone metadata filters |
| Sources | Registration, prioritization, disabling, freshness | Pinecone index management |
| Confidence | Deterministic scoring with thresholds | Pinecone similarity score |
| Memory | Conversation-scoped windows, TTL, clearance | Pinecone namespace isolation |
| Ownership | AI/HUMAN/SHARED/LOCKED retrieval permission matrix | Pinecone API keys |
| Audit | DomainEvent chain with correlationId + causationId | Pinecone audit logs |

Pinecone, Qdrant, pgvector (Supabase), and Weaviate are **providers**. OpenAI, Cohere, and VoyageAI are **embedding providers**. The runtime model is **canonical knowledge retrieval coordination**.

## Why Providers MUST NOT Define the Runtime Model

| Anti-pattern | Consequence |
|---|---|
| Pinecone vector ID as primary key | Locked to Pinecone; cannot migrate to pgvector or Qdrant |
| OpenAI embedding as sole semantic model | Cannot swap embedding provider without rewriting retrieval logic |
| Pinecone query filter as source governance | Cannot enforce source hierarchy, freshness, or disabling independently |
| Pinecone namespace as memory window | Cannot integrate with conversation-scoped ownership and TTL |
| Direct LLM generation in retrieval pipeline | Mixes retrieval (deterministic) with generation (AI); violates deterministic-first |

**Correct approach:** canonical knowledge entities → provider adapters map to Pinecone / Qdrant / pgvector schemas.

## Benefits

1. **Provider portability** — swap Pinecone for pgvector or Qdrant without touching retrieval logic
2. **Vertical-agnostic** — same engine serves dental knowledge (Sarah), academic knowledge (EVA), future verticals
3. **Deterministic grounding** — retrieval confidence, source prioritization, and hallucination boundaries follow explicit rules
4. **Event-driven** — every retrieval mutation emits a `DomainEvent` with `correlationId` + `causationId`
5. **Ownership-aware** — `LOCKED` ownership blocks source mutations (legal hold, audit freeze)
6. **Multitenant-ready** — `tenantId` + `workspaceId` + `verticalId` on every entity and event
7. **Memory-governed** — conversation-scoped memory windows with TTL prevent context pollution
8. **Source provenance** — every retrieval result carries source lineage for citation and audit

## Relation to Sarah Dental

Sarah needs:
- **FAQ retrieval** — "¿Cuánto dura una limpieza?" → Retrieve FAQ-003 with score 0.98, source `faq.json`
- **Procedure grounding** — "¿Qué incluye una endodoncia?" → Retrieve procedure-endo with confidence 0.95
- **Policy enforcement** — "¿Puedo cancelar mi cita?" → Retrieve pol-001 with 24h cancellation rule
- **Confidence gating** — Low score (< 0.7) → "No tengo certeza sobre eso, te conecto con el equipo"
- **Memory windows** — Remember patient context within conversation, expire after handoff

knowledge-engine provides the retrieval runtime; Pinecone/pgvector provides the vector storage.

## Relation to EVA Académica

EVA needs:
- **Admission retrieval** — "¿Qué documentos necesito?" → Retrieve admission policy with source citation
- **Curriculum grounding** — "¿Cuántas materias tiene Ingeniería?" → Retrieve curriculum data with confidence
- **Regulation lookup** — "¿Cuál es el reglamento de becas?" → Retrieve scholarship regulation
- **Tutoring FAQ** — "¿Cómo agendo una tutoría?" → Retrieve tutoring FAQ

knowledge-engine serves both verticals without modification.

## Deterministic Retrieval Governance Principles

1. **Retrieval is rule-based, not AI-decided** — ranking, scoring, and grounding are deterministic
2. **Sources are first-class entities** — registered, prioritized, disabled; NOT inline Pinecone metadata
3. **Confidence is computed, not claimed** — score = f(similarity, source_authority, freshness, chunk_relevance)
4. **Hallucination boundary is policy** — below threshold → structured fallback, never fabricated answer
5. **Memory windows are bounded** — conversation-scoped, TTL-governed, clear on handoff
6. **Provider IDs are metadata** — canonical `id` is system of record; `providerIds.pinecone` is annotation
7. **Events are immutable** — every retrieval, ranking, source mutation produces a `DomainEvent`

## Scope

**In scope for Phase 8B (implementation):**
- InMemoryKnowledgeProvider with keyword retrieval, ranking, confidence scoring
- Engine contract compatible with workflow-orchestrator (`execute(action, context)`)
- Event emission for all retrieval lifecycle events
- Ownership-aware source mutation guards
- Source registration and disabling
- Memory window creation and clearance
- Confidence scoring with deterministic thresholds

**Out of scope:**
- Real Pinecone / Qdrant / pgvector integration (Phase 8C)
- Real OpenAI / Cohere embedding generation (Phase 8C)
- Real LLM answer generation (Phase 3)
- PostgreSQL persistence (Phase 4)
- Realtime sync, dashboards, analytics (Phase 5)
- Autonomous reasoning, agent memory (future)
- HTTP APIs
