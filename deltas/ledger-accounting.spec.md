# Ledger Accounting — Spec

> Models the posting of double-entry accounting transactions: a set of debit/credit entries that must balance, posted immutably, corrected only by posting a new offsetting transaction.

## Intent

Every accounting effect in the system is recorded as a balanced, double-entry transaction: for every debit there is an equal and opposite credit. A transaction, once posted, is a permanent fact — it is never edited. Correcting one means posting a new transaction that reverses it, so the full history of what the ledger was ever in remains reconstructable.

## Scope

This slice owns the ledger-transaction aggregate itself — its balance invariant, its immutability, its reversal mechanism, and the domain events it raises — plus the persistence contract (the repository port) a future adapter must satisfy to store and reload it. It does not yet own a use-case/orchestration layer.

Explicit non-goals for this slice:
- A concrete repository implementation — this slice defines the persistence contract (the interface) only; the infrastructure adapter that actually satisfies it against a real datastore is not built yet.
- Use cases / orchestration — not built yet.
- Consuming the cross-context integration event that would actually trigger a posting from the expense-approval side, and the anti-corruption layer that translates it into this context's own model — neither is built yet; this slice only models the aggregate that layer will eventually invoke.
- Preventing the same posted transaction from being reversed more than once. The aggregate alone can't enforce this — it would require checking other already-posted transactions, which is a future repository/use-case concern, not something a single aggregate instance can know on its own.
- Querying posted transactions by account.

## Contract

The aggregate exposes:

| Member | Behavior |
|---|---|
| `post(id, entries)` (static) | Validates the entries balance (see Invariants), creates a new transaction with no reversal reference, and raises `TransactionPosted`. |
| `reverse(id, original)` (static) | Builds a new set of entries from `original`'s own entries with each one's direction inverted (same account, same amount), validates that set balances the same way `post` does, creates a new transaction referencing `original`'s identity, and raises `TransactionReversed` instead of `TransactionPosted`. |
| `getEntries()` | Returns the transaction's entries. |
| `getReversesTransactionId()` | Returns the identity of the transaction this one reverses, or nothing if this transaction isn't a reversal. |
| `pullDomainEvents()` | Drains and returns every domain event raised since the last call — the same-transaction event a persistence layer is expected to read and clear on each write. |
| `reconstitute(id, entries, reversesTransactionId, postedAt)` (static) | Rebuilds an existing transaction from state a repository already loaded from storage — sets every field exactly as given, performs no balance validation, and raises no domain event. Exists solely for a repository to rehydrate this aggregate; it is not an alternate construction path for application code, which must always go through `post`/`reverse`. |

An entry is a value — no identity of its own — made of an account reference, a monetary amount, and a debit-or-credit direction.

### Repository contract

The `LedgerTransactionRepository` port:

| Member | Behavior |
|---|---|
| `save(transaction)` | Persists the given transaction's full current state (id, entries, the transaction it reverses if any, posted-at timestamp). |
| `findById(id)` | Returns the transaction with the given id, rebuilt via `reconstitute`, or nothing if no transaction with that id has been saved. Required by `reverse`, which must load the original transaction before building its offsetting entries. |

No other method is defined yet — no listing, no query by account, matching this slice's own non-goals.

## Invariants

- A transaction must have at least one debit entry and at least one credit entry. Since an entry can't be both directions at once, this also means a transaction always has at least two entries — there's no separate minimum-count check beyond requiring both sides present.
- The sum of the debit entries must equal the sum of the credit entries, in both amount and currency. If the two sides use different currencies, that also counts as unbalanced — there is no separate currency-mismatch error, since the project doesn't support multi-currency accounting anyway.
- Every individual entry's amount must be strictly greater than zero — a zero-amount entry represents nothing and is rejected at construction.
- A posted transaction is immutable: the aggregate exposes no mutation method once created, only read accessors and the two static factories.
- The only way to correct a posted transaction is to post a new one that reverses it (see Contract's `reverse`). The reversal is itself a fully valid transaction subject to the same balance invariant as any other.
- Reversing a transaction that is itself already a reversal is allowed — reversals may be chained.
- Each factory raises exactly one domain event describing what it did: `post` raises a "transaction posted" event; `reverse` raises a distinct "transaction reversed" event (rather than reusing the posted one) so the event log makes the correction explicit.
- This slice's own identifier types (for the transaction and for an account reference) are UUID-backed via the shared kernel's identity base, but are distinct nominal types from any identically-shaped identifier defined by another bounded context — no identifier type is shared across a bounded-context boundary.
- `reconstitute` never re-validates the balance invariant and never raises a domain event — it trusts that the entries it's given already balanced when `save` persisted them, since they can only have been produced by `post`/`reverse`, which do validate. This is what keeps rehydration cheap and keeps a later invariant tightening from breaking replay of already-persisted rows.
- The repository contract exposes exactly `save` and `findById` today; neither takes a transaction/unit-of-work parameter (see Deferred / Open questions). Preventing a double reversal of the same original transaction is still not addressed by this contract — it remains a future use-case/repository-layer responsibility, per Scope.

## Deferred / Open questions

- Whether `save` should accept an explicit transaction/unit-of-work handle, so a future use-case layer can persist the aggregate atomically alongside other writes, is deferred to the outbox phase of the roadmap — not decided by this contract.
- The concrete adapter implementing `LedgerTransactionRepository` against the real datastore doesn't exist yet.
- Preventing a double reversal of the same original transaction is explicitly deferred to a future repository/use-case layer, since it requires knowledge of other already-posted transactions that a single aggregate instance doesn't have.
- The real integration event that would trigger a posting from the expense-approval side, and the anti-corruption layer translating it into this context's own model, don't exist yet — this slice only models what that future layer will invoke.
- Querying posted transactions by account is a stretch goal at the project level, not something this slice needs yet.

## Acceptance criteria

No test runner is configured yet for this project. Until one exists, this spec is verified by:
- A clean strict-mode type-check of the slice.
- A manual, line-by-line walkthrough of each invariant above against the aggregate's behavior.

Once a test runner exists, each invariant above should have a corresponding invariant test, replacing the manual walkthrough as the acceptance criterion.

---

Last updated: 2026-09-16.
