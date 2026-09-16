---
paths:
  - "source/core/*/contexts/**"
---

# Bounded-Context Identifier Isolation

An identifier value object (e.g. a reference to another aggregate's identity) may have the exact same shape/definition in two different bounded contexts, but must never be the same shared type between them.

---

## Identifier types

- Each bounded context defines and extends its own identifier class, even when another context's identifier looks identical in shape — because a shared identifier type is a de facto shared type between the two aggregates, which silently reintroduces the coupling a bounded-context boundary exists to prevent.
- Both contexts' identifier classes may extend the same shared identity base (construction validation, equality) — that's legitimate shared kernel, since it's generic identity machinery, not a domain-specific type.
- No identifier value, foreign-key-like reference, or aggregate type crosses a bounded-context boundary directly. The only sanctioned channel between two bounded contexts is an explicit, versioned event contract.

## Non-goals

- Doesn't apply to a genuinely shared value shape with no cross-context coupling risk (e.g. a monetary amount type) — that kind of value is legitimate shared kernel and may be a single shared type. This rule is specifically about identifiers that reference one context's own aggregate identity.
