---
paths:
  - "source/core/*/contexts/**"
---

# Bounded-Context Domain File Naming

Each bounded context's pure-domain layer lives under its own `contexts/` directory. Within that directory, split files by DDD building-block kind rather than grouping unrelated kinds into one file.

---

## File naming

- Name each file `<subject>.<kind>.ts`, where `<subject>` is the bounded context's own aggregate name (lowercase) and `<kind>` is one of: `aggregate`, `entities`, `vos` (value objects), `enums`, `errors`, `events` — because a reader can predict where a given concept lives without opening every file, and a new bounded context can be scaffolded by mirroring the same shape.
- Keep one aggregate's concept ("subject") per set of files within a bounded context — don't mix two aggregates' building blocks under one `<subject>` prefix, and don't introduce a file that doesn't map to one of the kinds above without first deciding whether a new kind is genuinely needed.

## Non-goals

- Doesn't mandate this split for files outside a bounded context's own `contexts/` directory (an application/use-case layer, infrastructure adapters, ports, etc.) — those are a different concern with their own eventual convention.
