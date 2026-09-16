# Common Domain — Spec

> The shared kernel: the small set of generic value objects (identity, monetary value) that every bounded context builds its own domain types on top of.

## Intent

Both bounded contexts need the same two kinds of primitive — a way to define a strongly-typed, validated identifier, and a way to represent a monetary amount safely — without either context depending on the other's domain model to get them. This slice exists to hold exactly those primitives once, so that using them never becomes a reason for two bounded contexts to share a domain-specific type.

## Scope

This slice owns the identity base (a protected-constructor base class plus a UUID-shape validator) and the monetary value object (`Money`), each with its own error type.

Explicit non-goals for this slice:
- Any domain-specific identifier type — those belong to each bounded context individually, never here (see the cross-context identifier-isolation rule this slice's identity base makes possible).
- Any aggregate, entity, enum, or domain-event file. This slice has no lifecycle or state machine of its own — it only supplies primitives that other bounded contexts' aggregates consume — so unlike a bounded context's own domain layer, only value-object/error pairs live here.
- Currency-specific business logic: format validation, a registry of valid currencies, multi-currency conversion, or presentation formatting.

## Contract

**Identity base** (abstract class):
- A protected constructor taking the identifier's underlying string value — only a subclass can construct an instance, so every concrete identifier is its own nominal type.
- `equals(other)` — true only if `other` is an instance of the exact same concrete subclass *and* holds the same value. A string-identical value under two different identifier subclasses is never equal.

**UUID-shape validator** (standalone function):
- Takes the candidate value and a descriptive label used in the error message.
- Throws an invalid-identifier error if the value isn't a generically UUID-shaped string (32 hex digits in the standard 8-4-4-4-12 grouping). Does not check the version or variant bits.

**`Money`**:
- A static factory taking an amount and a currency; throws an invalid-money error unless the amount is a non-negative integer.
- `equals(other)` — true only if both amount and currency match; returns `false` (never throws) when currencies differ.
- `isGreaterThan(other)` and `add(other)` — both throw a currency-mismatch error if the two operands' currencies differ.

## Invariants

- Identifier equality requires both the same concrete subclass and the same value. This is the runtime mechanism the project's bounded-context identifier-isolation rule actually depends on — not just a naming convention, but the reason two contexts' identically-shaped identifiers can never compare equal to each other even if constructed from the same string.
- UUID-shape validation is deliberately version-agnostic — it does not require any specific UUID version. This decouples identity validation in the shared kernel from whatever ID-generation strategy the project happens to use elsewhere, since generation strategy is an infrastructure decision, not a domain invariant this shared kernel should enforce.
- `Money`'s amount must always be a non-negative integer — never a float, never negative. Representing amounts as integers in minor units is the mechanism that avoids floating-point arithmetic on money entirely.
- `Money`'s currency accepts any non-empty string, with no format validation today. This is a deliberate decision, not a gap: the project has no multi-currency support in scope, so validating a currency-code format wouldn't add real protection yet.
- `Money.add`/`Money.isGreaterThan` throw on a currency mismatch; `Money.equals` does not — it simply returns `false`. Consumers that want "are these two amounts the same" to also silently cover "and are they even comparable" rely on `equals`'s non-throwing behavior for that purpose.
- `Money` currently exposes no subtraction operation — removed when it had no caller. An operation is added to this shared kernel only when a real caller needs it, never preemptively.

## Deferred / Open questions

- Should any boundary in the system ever need to enforce a specific UUID version (e.g. reject a well-formed but non-generated UUID), that's a deliberate, separate tightening of the UUID-shape validator — not something this spec currently requires.
- Should the project ever add real multi-currency support, `Money`'s currency field would need real format validation (and likely a registry of valid currencies) at that point — explicitly out of scope until that non-goal changes.
- Any additional `Money` operation (subtraction included) is added the moment a real caller needs it, not before.

## Acceptance criteria

No test runner is configured yet for this project. Until one exists, this spec is verified by:
- A clean strict-mode type-check of the slice.
- A manual, line-by-line walkthrough of each invariant above against the classes' actual behavior.

Once a test runner exists, each invariant above should have a corresponding invariant test, replacing the manual walkthrough as the acceptance criterion.

---

Last updated: 2026-09-15.
