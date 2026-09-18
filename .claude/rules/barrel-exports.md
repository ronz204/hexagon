---
paths:
  - "source/core/*/contexts/**"
  - "source/core/*/contracts/**"
  - "source/core/*/index.ts"
---

# Bounded-Context Barrel Exports

Each bounded context under `source/core/` has one `index.ts` at its own root, re-exporting everything public the context makes available to the rest of the codebase. It exists so a consumer outside the context imports one path per context instead of reaching into that context's internal directory structure directly — the context's `contexts/`/`contracts/` split is an internal organizing detail, not something an external caller should have to know or depend on.

---

## What the barrel re-exports

- `export *` every file under the context's own `contexts/` directory (its pure domain layer — aggregate, entities, enums, errors, events, value objects), because that's the context's full public domain surface.
- `export *` every file under the context's own `contracts/` directory (its outbound ports, such as a repository), when that directory exists — a context with no port defined yet has no `contracts/` directory and its barrel skips this entirely, per [[contracts-naming]]'s own non-goal of not creating `contracts/` preemptively.
- Nothing from any other bounded context, and nothing that isn't already exported by one of the files above — the barrel re-exports, it doesn't add new surface of its own.

## Keeping the barrel current

- Adding a new file under a context's `contexts/` or `contracts/` directory (matching [[context-naming]]'s or [[contracts-naming]]'s own naming convention) means adding a matching `export *` line to that context's `index.ts` in the same change — an un-exported file is invisible to every consumer outside the context, silently, since nothing else fails when it's missing.
- Removing or renaming such a file means updating the barrel's `export *` line to match, for the same reason.

## Cross-context consumption goes through the barrel

- A consumer outside a bounded context's own directory — another bounded context, the infrastructure/data-access layer, an application layer — imports that context's public surface from its barrel (the context's own root), never by reaching directly into its `contexts/` or `contracts/` subdirectory. This keeps the internal domain/port split free to change shape without breaking every external caller that would otherwise have hardcoded a deep path into it.
- A file inside a bounded context's own directory — one `contexts/` file importing a sibling `contexts/` file, or a `contracts/*.repository.ts` file importing the aggregate it persists — keeps using its existing relative or direct import, exactly as before. Importing the context's own barrel from inside that same context would be circular in spirit and adds nothing a direct sibling import doesn't already give it.

## Non-goals

- Doesn't treat a shared-kernel-style context's lack of a `contracts/` directory as a defect — a context with no aggregate or repository of its own legitimately has a barrel covering `contexts/` only, until that changes.
