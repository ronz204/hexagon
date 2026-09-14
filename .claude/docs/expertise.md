# Expertise

This file explains how the non-trivial mechanisms this project depends on actually work — not whether or where they're used, which is structure.md's and database.md's job.

---

## Glossary

| Term | Meaning |
|---|---|
| Aggregate root | The single entry point object for a cluster of related data that must change together consistently — external code only ever reaches the cluster through it. |
| Anti-corruption layer | A translation boundary that converts an external system's or context's data shape into a component's own internal model, so the component never depends on the external shape directly. |
| Idempotency | The property that applying the same operation more than once produces the same result as applying it once — no duplicate side effect. |

## Transactional outbox pattern

The core problem this pattern solves: a component needs to both change its own state and reliably tell another system about that change, but a database write and a message-queue publish cannot be made atomic across two different systems directly — a crash between the two leaves either an unpublished state change or a published message whose state change never actually committed.

The pattern's fix is to turn the cross-system problem into a single-system one: instead of publishing to the queue directly, the component writes a row describing the event into its own database, in the very same local transaction as its state change. Because both writes share one transaction, they either both commit or neither does — there is no window where one happened and the other didn't. A separate process then reads unpublished rows and forwards them to the real message queue, retrying that step independently until it succeeds; only that separate process, not the original write, deals with the unreliability of the network hop to the queue.

The consequence: message delivery becomes at-least-once, not exactly-once. The separate forwarding process can crash after publishing to the queue but before marking the row published, causing the same event to be forwarded twice. Every consumer of these events must therefore be idempotent — this is the direct reason idempotent event consumption is called out as a cross-cutting requirement, not an optional nicety.

## Double-entry balance invariant

Every accounting transaction is recorded as a set of entries, each tagged debit or credit, and the sum of the debit entries must always equal the sum of the credit entries. This isn't a validation rule bolted on top of the data — it's the actual definition of a balanced transaction, and any write path that could produce an unbalanced set of entries has produced invalid data by definition, not merely data that failed a check.

The immutability rule that pairs with this (a posted transaction is never edited) exists because editing a posted entry in place can silently break the balance invariant for anyone who already read the transaction before the edit — a system relying on "the transaction I saw is still what's posted" would be wrong. Reversing via a new offsetting transaction preserves a complete, append-only history where every state the ledger was ever in remains reconstructable, instead of overwriting it.

## Queue redelivery and at-least-once delivery

A message queue that guarantees a job is never silently lost typically cannot also guarantee it's delivered exactly once — the two guarantees are in tension, because guaranteeing no loss requires redelivering a job whenever the consumer's acknowledgment can't be confirmed, and that same redelivery is what makes duplicate delivery possible (the consumer may have actually finished the job before the acknowledgment was lost). Systems that need exactly-once *effects* on top of at-least-once *delivery* achieve it by making the consumer idempotent, not by trying to make delivery itself exactly-once — the same principle underlying the outbox pattern's own at-least-once guarantee above.

---

## Non-goals

No mechanism explanation beyond the three above; a mechanism not yet decided (e.g. the specific queue broker's own retry/backoff configuration) belongs in structure.md's Open architecture decisions once it exists, not here.
