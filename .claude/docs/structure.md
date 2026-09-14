# Structure

This file covers the technology stack, how parts of the system communicate, and static infrastructure. The data model itself lives in database.md, not here.

---

## Stack

| Layer | Choice | Rationale |
|---|---|---|
| Runtime | Bun | Single runtime for package management, script execution, and process entrypoints. |
| Language | TypeScript, strict mode | Strict null/index-access/override checking enabled project-wide, favoring compile-time safety over runtime checks for internal code. |
| Web framework | Elysia (planned, not yet installed) | Selected for the API process; not yet a dependency as of this writing. |
| ORM | Drizzle (planned, not yet installed) | Selected as the persistence-layer ORM. Superseded an earlier Prisma choice recorded in the project's own approach notes — Drizzle is the current, confirmed decision; nothing has been generated from it yet. |
| Database engine | PostgreSQL 17 | Provisioned and running via Docker Compose; see Infrastructure below and database.md. |
| Queue/broker | BullMQ + Redis (planned, not yet provisioned) | Chosen specifically to keep the outbox, the relay, and the queue as three conceptually distinct pieces — the deliberate learning goal of this project, rather than collapsing them into one mechanism. |
| Dependency injection | A DI container library | Installed; not yet wired into any component. |
| ID generation | UUIDv7 | Installed; implies time-ordered UUIDs are the intended identifier strategy for new records once persistence exists. |

## Topology

Two separate process entrypoints run over the same codebase:

```
service (API process)
  accepts inbound requests, exercises the Approvals component's use cases

worker (background process)
  runs the outbox-relay polling loop
  runs the queue consumer that applies Ledger's posting use case
```

The API process and the worker process share application code but run independently — the API process never runs the relay or queue consumer itself, and the worker process exposes no HTTP surface.

Cross-context communication is fully asynchronous: the producing context (Approvals) never calls the consuming context (Ledger) directly. The only channel between them is the integration event carried through the outbox → relay → queue path described in modules.md's Outbox Relay component.

## Infrastructure

Local-only setup via Docker Compose — no deployment or hosting target has been defined; this is a learning POC run on a developer machine, not a deployed system.

- A bridge network and a persistent volume back the database service.
- A second named volume is already reserved for the queue broker's own data, ahead of that service actually being defined — signaling the queue/broker addition is expected imminently, not an open-ended maybe.
- The database service binds to localhost only, not exposed beyond the host running it.
- Database bootstrap SQL scripts run automatically on first container initialization, handled by the database engine's own init mechanism — see database.md for what they provision.

## Cross-cutting patterns

- **Background processing.** All asynchronous work (outbox polling, queue consumption) is isolated to the worker process, never the API process — keeping request/response latency unaffected by background work and making the two independently scalable/restartable.
- **Idempotent event consumption (planned).** Because the queue broker can redeliver a job, the consumer side of the outbox/relay/queue mechanism must guard against processing the same integration event twice — this is called out as a specific risk to get right, not yet implemented.
- **Anti-corruption layer at the consuming boundary.** The Ledger component never trusts the producing context's internal shape directly — its event handler translates the integration event's payload into Ledger's own model, so the two contexts can evolve independently.

## Open architecture decisions

- **Per-context vs. global core/app layout.** The stated intent is hexagonal-by-bounded-context: each bounded context gets its own core/app/infra split, with no shared tables or domain types between contexts. The project's TypeScript path aliases, however, currently reserve a single global set of paths for application/core code and a single environment module, none of which have been created yet. Whether the eventual layout nests core/app/infra inside each bounded context, or keeps a shared core/app layer with contexts distinguished some other way, is not yet decided. Resolve this before the first bounded context's real implementation begins, since it fixes the shape every subsequent module follows.

---

## Non-goals

No additional boundary beyond the Infrastructure section's note that this project has no deployment target.
