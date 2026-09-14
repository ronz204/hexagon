# Database

This file covers the persistence layer: what's actually provisioned today, and the data model planned on top of it. No application tables exist yet — only schema and role provisioning are real as of this writing.

---

## Schema

A single application schema (distinct from the database engine's default schema) holds all application tables. Using a dedicated schema, rather than the default one, keeps application objects cleanly separated from anything the engine or an extension might place in the default schema, and gives the access-control split below a natural boundary to scope itself to.

## Access control

Two database roles exist, split by purpose rather than sharing one broad credential:

| Role | Purpose | Used by |
|---|---|---|
| Schema-owning role | Owns the application schema; the only role capable of creating tables/DDL in it (schema authorization, migrations) | Migration/setup tooling, not the running application |
| Runtime role | Granted USAGE on the schema plus default SELECT/INSERT/UPDATE on tables the schema-owning role creates — deliberately no DELETE and no DDL privilege | The running application processes (API and worker) |

This split exists so a compromised or buggy application process can read and write rows but can never drop/alter a table or delete data outright — the blast radius of anything running with the application's own credentials is capped at row-level insert/update, by database-enforced privilege rather than by application-code discipline alone.

A second, isolated database is provisioned automatically alongside the primary one, for automated testing — kept structurally identical (same bootstrap runs against both) but physically separate, so tests never share state with local development data.

## Data model

Not yet implemented. The planned shape, per the two bounded contexts described in overview.md:

```
ExpenseRequest (Approvals context)
  amount: Money (amount + currency)
  state: Pending | InReview | Approved | Rejected
  debitAccountId, creditAccountId

LedgerTransaction (Ledger context)
  entries: Entry[] (>= 2; at least one debit, one credit)
  each Entry: accountId, amount (Money), direction: debit | credit

Outbox record (shape not yet decided)
  event payload + published-at marker
```

Approvals and Ledger are expected to own entirely separate tables, with no foreign key or shared type between them — the only connection between the two aggregates is the integration event carried through the outbox mechanism, never a database-level relationship.

## Persistence invariants

- A `LedgerTransaction`'s entries must always sum to zero across debit/credit direction (double-entry balance) — this must hold for every write path that can create or reverse a transaction, not just the primary posting use case.
- A posted `LedgerTransaction` is immutable once written; correcting one is modeled as a new transaction, never an update to an existing row.
- Processing the same integration event twice must never produce two `LedgerTransaction` rows for it — an idempotency guarantee not yet implemented, flagged as a specific risk to get right (see approach.md).

## Infrastructure

PostgreSQL, run via Docker Compose, local-only. A named volume backs its data directory so state survives container restarts. Bootstrap scripts run once, automatically, on first container initialization via the engine's own init-script mechanism — they provision the roles and schema described above and create the second, test-only database. No backup or replication strategy exists; this is a single local instance for development and learning purposes only.

## Access patterns

Not yet implemented — no ORM or query layer exists on top of the provisioned database yet (see structure.md's Stack table for the planned ORM choice).

---

## Non-goals

No additional boundary beyond what Access control and Data model already state.
