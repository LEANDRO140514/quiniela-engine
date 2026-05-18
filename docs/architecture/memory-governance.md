# Runtime Memory Philosophy

**runtime-first, memory-second.**

Claude Mem is operational context, not architecture.

## What Claude Mem IS NOT

- source of truth
- persistence layer
- vector DB
- memory engine
- canonical architecture layer

## What Claude Mem IS

- lightweight operational memory
- short-horizon cognitive continuity
- recent-session runtime context

## Canonical Permanent Memory

The permanent memory lives in:

- CLAUDE.md
- OpenSpec
- docs/architecture
- shared contracts
- workflows

Claude Mem ONLY complements: recent cognitive continuity.

## What Claude Mem SHOULD Remember

- recent architectural decisions
- active blockers
- immediate roadmap
- active priorities
- recent tradeoffs
- naming decisions
- recent operational state

## What Claude Mem MUST NOT Remember

- complete code
- large outputs
- logs
- filesystem snapshots
- complete contracts
- infinite history
- filesystem state
- full repo structure

# Recommended Claude Mem Baseline Configuration

This is an operational recommendation — NOT a runtime requirement, NOT a canonical runtime contract.

```json
{
  "CLAUDE_MEM_CONTEXT_SESSION_COUNT": 2,
  "CLAUDE_MEM_CONTEXT_OBSERVATIONS": 15,
  "CLAUDE_MEM_CONTEXT_FULL_COUNT": 2,
  "CLAUDE_MEM_CONTEXT_SHOW_LAST_SUMMARY": true,
  "CLAUDE_MEM_CONTEXT_SHOW_LAST_MESSAGE": false
}
```

Horizon: ~2–6 weeks of relevant operational context.

Configuration is user-scoped, environment-scoped, runtime-local. It lives at `~/.claude-mem/settings.json` and is NOT versioned in the project repo.
