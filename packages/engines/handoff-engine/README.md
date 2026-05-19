# @curdeeclau/handoff-engine

AI-to-human handoff with rule-based routing.

## Scope
- Rule engine for escalation decisions (keyword, intent, sentiment, time-of-day)
- Multi-level escalation: low → medium → high → critical → legal
- Target resolution (human, team, department, external)
- Abstract notification provider
- Cooldown windows to prevent handoff storms

## Status
Phase 2B — interfaces and types only. No real routing or notification yet.

## Usage (future)
```ts
import { HandoffEngine } from '@curdeeclau/handoff-engine';
const engine = new HandoffEngine({ rules: [...], targets: [...] });
const result = await engine.evaluate(conversationContext);
```
