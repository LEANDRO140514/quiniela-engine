# Proposal Template

Use this template when proposing a new engine, provider adapter, or runtime concept.

---

# Proposal: <change-name>

## Summary

One paragraph explaining what this change is and why it matters.

## Problem

What problem does this solve? Be specific. Reference existing gaps in the platform.

Examples:
- "Sarah cannot create CRM contacts during conversation flow"
- "No engine governs pipeline-aware opportunity tracking"
- "Campaign lifecycle has no runtime governance"

## Why This Matters

Explain the architectural or operational consequence of NOT having this.

| Without This Change | With This Change |
|---|---|
| Problem description | Solution description |

## Scope

**In scope:**
- List specific deliverables
- Each item must be independently verifiable

**Out of scope:**
- List what is explicitly NOT included
- Prevents scope creep

## Relation to Existing Components

- Which engines does this interact with?
- Which canonical contracts does this use?
- Which verticals benefit?

## Deterministic Governance

How does this change respect deterministic-first principles?
- Are state transitions rule-based (not AI-decided)?
- Are events emitted for every mutation?
- Is ownership respected?

## References

- `workflows/extracted-patterns/<pattern>.md`
- `packages/shared/src/<module>/`
- `verticals/<vertical>/`
