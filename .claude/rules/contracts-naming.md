---
paths:
  - "source/core/*/contracts/**"
---

# Bounded-Context Port Naming

Each bounded context's outbound ports — interfaces a future infrastructure adapter must satisfy, such as a repository — live in their own `contracts/` directory, a sibling of that context's `contexts/` directory, never inside it. A port is a boundary the domain layer depends on inversely, not a domain building block itself, so it doesn't belong among the aggregate/entity/vo/enum/error/event files `contexts/` holds.

---

## File naming

- Name each file `<subject>.<kind>.ts` — the same pattern this project already uses for the sibling `contexts/` directory: `<subject>` is the bounded context's own aggregate name (lowercase), and `<kind>` identifies the port's role (`repository` is the only kind defined so far).
- One port interface per file — don't merge two aggregates' ports into one file, and don't introduce a new `<kind>` without first deciding whether it's genuinely a distinct port role rather than a variant of an existing one.

## Isolation

- The same cross-context isolation this project already enforces for identifier types applies to ports: a port interface defined in one bounded context's `contracts/` directory must never reference another bounded context's aggregate, entity, or identifier type. A port is still owned entirely by the context it serves — it's a contract for that context's own persistence, not a shared integration surface.

## Non-goals

- Doesn't mandate a `contracts/` directory for a bounded context that has no outbound port yet — create it only when a real port (e.g. a repository) is actually being defined, not preemptively.
- Doesn't cover the concrete adapter that implements a port against real infrastructure — that's a separate concern with its own eventual convention, not this rule's job.
