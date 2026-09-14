# Modules

This file covers the functional shape of each planned component — what it is responsible for and how it is meant to behave. Why these components exist lives in overview.md, not here. As of this writing, none of the components below have a real implementation yet — only two placeholder process entrypoints exist on disk. Every flow and data shape here is the stated design intent, not yet-verified running behavior; this file should be revisited once each component actually has source behind it.

---

## Approvals

**Purpose.** Owns the expense-approval workflow: submitting an expense request, moving it through review, and approving or rejecting it, including the second-approval-level rule for larger amounts.

**Flow.**
1. An expense request is submitted, entering a pending state.
2. It may move into a review state.
3. From pending or review, it can be approved or rejected — no other state may transition to approved or rejected, and an already-approved or already-rejected request can never transition again.
4. An amount above the defined approval threshold requires a second-level approval (e.g. a manager approval followed by a finance approval) before it can reach the approved state.
5. Approval requires at least one destination accounting account to already be assigned to the request; a request with no assigned account can never be approved.
6. Each state transition raises a same-transaction domain event describing what happened.
7. Reaching the approved state additionally produces the integration event that crosses into the Ledger component, written transactionally alongside the state change itself (see Outbox Relay below).

**Data shape.**
```
ExpenseRequest
  amount: Money (amount + currency)
  state: Pending | InReview | Approved | Rejected
  debitAccountId, creditAccountId (destination accounting accounts)

Integration event payload (ExpenseApproved):
  requestId, amount, currency, debitAccountId, creditAccountId, approvedAt
```

**Dependencies.** Produces the integration event consumed by Ledger, indirectly, through the Outbox Relay mechanism. Has no direct dependency on Ledger.

## Ledger

**Purpose.** Owns double-entry accounting. Reacts to an approved expense elsewhere in the system by posting a balanced accounting transaction — with no knowledge of the workflow that produced it.

**Flow.**
1. Consumes the integration event produced by Approvals once an expense request reaches its approved state.
2. The consuming handler acts as an anti-corruption layer: it translates the external event payload into this component's own model, so a future change in the event's shape doesn't leak into Ledger's internal types.
3. Posts a new ledger transaction with at least one debit entry and one credit entry, whose sums must be equal.
4. A posted transaction is never edited. Correcting one means posting a new reversing transaction that offsets it.

**Data shape.**
```
LedgerTransaction
  entries: Entry[] (>= 2 entries; at least one debit, one credit)
  each Entry: accountId (AccountId), amount (Money), direction: debit | credit
  invariant: sum(debit entries) == sum(credit entries)

ReversingTransaction
  a new LedgerTransaction that offsets a previously posted one
```

**Dependencies.** Consumes the integration event produced by Approvals via the Outbox Relay mechanism. Does not depend on Approvals' internal aggregate or domain events.

## Outbox Relay

**Purpose.** Carries an integration event reliably from the context that produces it to the context that consumes it, without ever losing an event or publishing one whose originating state change didn't actually commit.

**Flow.**
1. The producing context writes its own state change and a corresponding outbox record in one local transaction — so the two can never diverge.
2. A polling loop, running in the worker process, reads unpublished outbox records, publishes each to the queue broker, and marks it published.
3. A queue consumer, in the same worker process, receives the published job and runs the use case that applies its effect in the consuming context (posting a ledger transaction, in the current design).
4. The consumer path must be idempotent: processing the same event twice must never duplicate its effect (e.g. must never post the same ledger transaction twice).

**Data shape.**
```
Outbox record: event payload + published-at marker (null until published)
Queue job payload: the integration event's own payload (see Approvals' ExpenseApproved shape above)
```

**Dependencies.** Sits between Approvals (producer) and Ledger (consumer); owned by neither bounded context directly.

---

## Non-goals

No component-level scope boundary beyond what's already stated per component above.
