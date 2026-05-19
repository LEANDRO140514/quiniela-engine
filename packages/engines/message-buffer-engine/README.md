# @curdeeclau/message-buffer-engine

Conversational message buffer engine. Provider-agnostic, deterministic-first.

## Scope
- **Buffering** — accumulates messages by `conversationId`
- **Deduplication** — by `messageId + sourceId`, with configurable eviction window
- **Debounce** — resets timer on each new message; auto-transitions to `READY_TO_FLUSH`
- **Batching** — consolidates messages sorted by timestamp into a single payload
- **Flush** — manual (`flushConversation`) or automatic (after `waitWindowMs` silence)

## States
| State | Description |
|-------|-------------|
| `IDLE` | No messages for this conversation |
| `BUFFERING` | Accumulating messages within debounce window |
| `READY_TO_FLUSH` | Debounce expired or maxMessages reached — batch ready |
| `FLUSHED` | Batch was consumed via `flushConversation()` |

## API
```ts
const engine = new MessageBufferEngine({ waitWindowMs: 10000, maxMessages: 50 });

engine.bufferMessage(message)       // → BufferResult
engine.flushConversation(id)        // → FlushResult
engine.getConversationState(id)     // → ConversationState
engine.clearConversation(id)        // → void
engine.dedupeMessage(message)       // → boolean
```

## Internal Architecture
```
MessageBufferEngine (coordinator)
  ├── InMemoryBufferStore     — messages, buffers, state per conversation
  ├── MessageDeduplicator     — dedup by messageId:sourceId, time-window eviction
  ├── DebounceService         — per-conversation timers with reset-on-activity
  └── MessageBatcher          — sort + consolidate into BatchedConversation
```

## Future: Connection to Workflow Orchestrator
When `workflow-orchestrator` is implemented:
1. `READY_TO_FLUSH` state becomes a trigger event → `ConversationReadyToFlush`
2. Orchestrator calls `flushConversation()` and passes the `BatchedConversation` to the next step
3. The buffer engine stays **pure** — it never knows about workflows, agents, or channels

## Future: Redis Adapter
- `InMemoryBufferStore` → implements `BufferStore` interface
- `RedisBufferStore` — same interface, persistent, shared across processes
- `DebounceService` timers → replaced by Redis key TTL notifications
- Dedup → Redis SET with TTL

## Non-Scope
This engine does NOT handle:
- WhatsApp / Chatwoot / GHL / YCloud specifics
- AI / LLM logic
- HTTP / webhooks
- Dashboard / UI
- Distributed queues (Kafka, BullMQ, RabbitMQ)
