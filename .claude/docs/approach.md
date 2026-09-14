# Approach

This file covers the order and philosophy behind building this project — what gets built together and why, and the phased roadmap. Why the project exists lives in overview.md, not here.

---

## Technical pillars

| Pillar | What it means here |
|---|---|
| Domain events vs. integration events | The project deliberately builds both kinds side by side so the distinction stays concrete: a domain event never leaves its bounded context or its transaction; an integration event is the only thing allowed to cross a context boundary, and always travels through the outbox mechanism below. |
| Transactional outbox | Tied directly to the event-boundary pillar above — it's the mechanism that makes "publish an integration event" safe to do transactionally, which is the whole point of separating the two event kinds in the first place. |
| Queue-based messaging | The delivery mechanism the outbox hands off to. Kept as a distinct piece (not folded into the outbox itself) specifically so outbox / relay / queue remain three separately reasoned-about pieces, per the project's stated learning goal. |
| Bounded-context isolation | Enforced by construction: the consuming context never queries or imports the producing context's own model, only the integration event's own stable payload — this is what the anti-corruption-layer pattern in expertise.md exists to protect. |

## Functional scope

- Submit an expense request and move it through the approval workflow (pending → in review → approved/rejected), enforcing valid transitions only.
- Require a second level of approval for expense requests above a defined amount threshold.
- Require at least one destination accounting account assigned before an expense request can be approved.
- Publish an integration event transactionally whenever an expense request reaches the approved state.
- Relay unpublished events from the outbox to the queue broker on a polling loop.
- Consume queued events in a worker process and post a corresponding, balanced accounting transaction.
- Guarantee that redelivering the same event never posts a duplicate accounting transaction.
- Support reversing a posted accounting transaction via a new offsetting transaction, never an edit.
- (Stretch) Query posted transactions by account.

## Roadmap

0. **Setup** — runtime, web framework, ORM, database, and queue broker dependencies installed and wired; queue-broker library compatibility with the runtime validated before building on top of it.
1. **Approvals core** — the expense-request aggregate, its state-transition invariants, and its use cases (submit / review / approve / reject), covered by invariant tests.
2. **Outbox** — the outbox table, written transactionally alongside the aggregate's own state change, plus a design for producer-side idempotency (never publishing the same event twice).
3. **Relay + queue** — the outbox polling loop, publication to the queue, and a basic consuming worker.
4. **Ledger core** — the ledger-transaction aggregate, its debit/credit balance invariant, and the use case that posts a transaction when triggered by the consumed integration event.
5. **Resilience** — queue-broker retry behavior, a defined answer for what happens when the Ledger side rejects an event (dead-lettering or equivalent), and end-to-end verification that redelivering the same event never duplicates a posted transaction.
6. **Stretch — query endpoint** — a simple read endpoint on the Ledger side (transactions by account), closing the loop from submission through to a queryable posted result.

Phase 0 is in progress: the database is provisioned and two process entrypoints exist; the web framework, ORM, and queue broker are chosen but not yet installed.

## Risks

- End-to-end idempotency is the easiest thing to underestimate here — without a durable record of already-processed events (or an equivalent uniqueness guarantee) on the consuming side, a queue redelivery can duplicate a posted accounting transaction.
- The outbox polling interval trades latency for simplicity — too long a interval makes the whole pipeline feel slow; too short adds needless database load. Start with something on the order of half a second to a second and adjust based on observed behavior.
- The temptation to let the consuming context couple to the exact shape of the producing context's aggregate is real and easy to fall into by accident — the integration event must stay an explicit, stable contract, never a convenience dump of internal aggregate state.

## Done criteria

- An expense request above the approval threshold cannot reach the approved state without both required approval levels, verified by a failing-then-passing invariant test.
- An expense request with no destination accounting account assigned cannot be approved, verified the same way.
- Approving an expense request results in exactly one posted, balanced ledger transaction, reachable end-to-end through the real outbox → relay → queue path (not a direct in-process call).
- Redelivering the same integration event a second time does not produce a second ledger transaction for it, verified by a test that forces a duplicate delivery.
- A posted ledger transaction can be reversed via a new transaction, and the original row is never mutated.

## Stretch goals

- A read endpoint on the Ledger side to query posted transactions by account, once the above done criteria are met.

---

## Non-goals

No additional boundary beyond what overview.md's Scope & non-goals already states.
