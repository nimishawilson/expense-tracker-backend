# Documentation

This folder holds project-level technical documentation — the "how it works" and "why it's built this way" that isn't obvious from reading the code alone.

## Structure

- **`architecture.md`** — High-Level Design (HLD). A living document describing the current system shape: modules, data flow, how auth works, how the database is structured. Update it in place as the system evolves — it should always reflect "now."
- **`adr/`** — Architecture Decision Records. One file per significant technical decision, numbered sequentially (`0001-title.md`, `0002-title.md`, ...). Each ADR is an immutable snapshot of *why* a choice was made at that point in time. If a later decision reverses an earlier one, write a new ADR that supersedes it (update the old one's `Status` to `Superseded by 000X`) rather than editing history.
- **`concepts-to-learn/`** — personal learning notes, gitignored. Not project documentation; excluded from version control on purpose.

## ADR template

```markdown
# NNNN. Title

**Status:** Proposed | Accepted | Superseded by NNNN

## Context
What problem or constraint led to this decision?

## Decision
What did we decide to do?

## Consequences
What trade-offs did we accept? What becomes easier or harder as a result?
```
