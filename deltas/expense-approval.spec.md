# Expense Approval — Spec

> Models the expense-approval workflow: an expense request moving from submission through optional review to approval or rejection, including the second-approval-level rule for larger amounts.

## Intent

A person submits an expense request for a given amount. Before it can be approved, it must have destination accounting accounts assigned, and — if the amount is large enough — it must clear a second level of approval rather than just one. Once approved, the request becomes the trigger for a downstream accounting posting in a separate bounded context; once rejected, it's final.

## Scope

This slice owns the expense-request aggregate itself: its state machine, its approval invariants, and the domain events it raises — the pure domain layer, with no persistence, no use-case/orchestration layer, and no outbound publishing yet.

Explicit non-goals for this slice:
- Persistence (a repository) — not built yet.
- Use cases / orchestration (an application layer that drives the aggregate from an inbound request) — not built yet.
- The actual cross-context integration event that reaches the ledger side via the outbox mechanism — not built yet; this slice only produces the same-transaction domain event that a future outbox layer would read from.
- Authenticating who is allowed to approve — the project has no real authentication; an approver is identified by an opaque string only.

## Contract

The aggregate exposes:

| Member | Behavior |
|---|---|
| `submit(id, amount)` (static) | Creates a new request in the `Pending` state. Rejects a zero amount. Raises `ExpenseSubmitted`. |
| `moveToReview()` | `Pending → InReview`. Rejects if not currently `Pending`. Raises `ExpenseMovedToReview`. |
| `assignAccounts(debitAccountId, creditAccountId)` | Sets the destination debit/credit accounts. Callable repeatedly while the request isn't `Approved`/`Rejected` — the latest call wins. |
| `recordApproval(level, approverId, threshold)` | Records one approval at one level. `threshold` is supplied by the caller on every call, not stored on the aggregate. May transition the request to `Approved` (see Invariants). Raises `ExpenseApproved` only when that transition happens. |
| `reject(reason?)` | `Pending`/`InReview → Rejected`. Raises `ExpenseRejected`. |
| `getState()` | Returns the current state. |
| `pullDomainEvents()` | Drains and returns every domain event raised since the last call — the same-transaction events a persistence/outbox layer is expected to read and clear on each write. |

`ExpenseApproved`'s payload carries `requestId`, `amount`, `debitAccountId`, `creditAccountId`, the set of `approvals` recorded, and `approvedAt` — enough for a future outbox/use-case layer to build the cross-context integration event without re-reading the aggregate's internal state.

## Invariants

- The only valid states are `Pending`, `InReview`, `Approved`, `Rejected`. `Approved` and `Rejected` are terminal — no method may transition the request out of either one.
- A request's amount must be strictly greater than zero at submission.
- `recordApproval` requires both a debit and a credit destination account to already be assigned; a request with neither (or only one) assigned can never be approved.
- The same approval level can approve a given request at most once.
- If the amount exceeds the threshold supplied to `recordApproval`, both a manager-level and a finance-level approval are required, and the manager-level approval must be recorded before the finance-level one — approving finance-level first is invalid.
- If the amount does not exceed the threshold, a single approval at either level is sufficient to reach `Approved`.
- Every state transition raises exactly one domain event describing it, in the same transaction as the state change; `Approved` additionally carries everything a future integration event needs (see Contract).
- This slice's own identifier types (for the request and for a destination account) are UUID-backed via the shared kernel's identity base, but are distinct nominal types from any identically-shaped identifier defined by another bounded context — no identifier type is shared across a bounded-context boundary.

## Deferred / Open questions

- The actual integration event that crosses to the ledger side via the outbox mechanism doesn't exist yet — `ExpenseApproved` is currently a domain event only. When the outbox/relay is built, decide whether the integration event is a direct translation of this payload or remapped again at that boundary.
- An approver is an unauthenticated opaque identifier — there's no check on who is allowed to approve at which level. Revisit only if/when the project's non-goal of skipping real authentication changes.
- There's no link between a `Rejected` (or `Approved`) request and any future resubmission — resubmitting means creating a brand-new request with a new identity. Revisit if the workflow ever needs to track that lineage.

## Acceptance criteria

No test runner is configured yet for this project. Until one exists, this spec is verified by:
- A clean strict-mode type-check of the slice.
- A manual, line-by-line walkthrough of each invariant above against the aggregate's behavior.

Once a test runner exists, each invariant above should have a corresponding invariant test, replacing the manual walkthrough as the acceptance criterion.

---

Last updated: 2026-09-15.
