# Overview

This file covers the project's vision, scope, and core domain vocabulary. How components communicate and how the system is built live in structure.md and approach.md, not here.

---

## Vision

This is a learning proof-of-concept for event-driven architecture inside a modular monolith. It explores the distinction between domain events (internal, synchronous, same-transaction) and integration events (cross-boundary, asynchronous, queue-carried), the transactional outbox pattern for reliably publishing those integration events, and the real limits of a bounded-context boundary — a public interface plus events, never a direct dependency between contexts.

The domain used to exercise these ideas is expense approval and its downstream accounting effect: an expense request moves through an approval workflow, and once approved, it must be posted as a balanced accounting transaction in a separate bounded context that has no knowledge of the approval workflow itself.

The project deliberately does not pursue strict DDD/Hexagonal purity. The goal is to build judgment and a working method for this class of problem, not to produce an academically pure architecture.

## Scope & non-goals

The project owns: the expense-approval workflow, the accounting ledger, and the asynchronous mechanism connecting them (transactional outbox, relay, queue).

Explicitly out of scope:
- A UI/frontend — everything is exercised via API and manual HTTP tooling.
- Real authentication — the approving user is mocked, not authenticated.
- Multi-currency conversion — every transaction uses a single currency; no exchange-rate logic.
- Advanced accounting reports (general ledger balance, income statement) — only the core posting mechanism is in scope.

## Domain concepts

| Concept | Description |
|---|---|
| Expense request | The aggregate at the center of the approval workflow. Carries an amount/currency and moves through a state machine from submission to approval or rejection. Above a defined amount threshold, it requires a second level of approval before it can be approved. |
| Approval threshold | The amount boundary above which a second approver is required before an expense request can move to approved. |
| Domain event | An event that stays inside one bounded context, raised and handled synchronously within the same transaction as the state change it describes. |
| Integration event | An event that crosses a bounded-context boundary. Published asynchronously via the outbox/queue mechanism, and treated as a stable, explicit contract — never a direct dump of an aggregate's internal shape. |
| Ledger transaction | The aggregate representing a posted accounting entry. Must always balance (sum of debits equals sum of credits) and, once posted, is never edited — only reversed by a new transaction. |
| Reversing transaction | A new ledger transaction that offsets a previously posted one. The mechanism by which a posted transaction is corrected, since posted transactions are immutable. |
| Transactional outbox | The pattern connecting the two bounded contexts: a context's state change and the record of the integration event it produces are written in the same local transaction, so the event can never be lost or published without its corresponding state change (or vice versa). |

---

## Non-goals

No additional boundary beyond Scope & non-goals above.
