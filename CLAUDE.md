# Relay

A learning proof-of-concept for event-driven architecture inside a modular monolith: domain vs. integration events, the transactional outbox pattern, and queue-based messaging across bounded-context boundaries. The domain is expense approval feeding a double-entry accounting ledger. See `.claude/docs/overview.md` for the full vision and scope.

---

## Knowledge base layout

| Path | Holds |
|---|---|
| `.claude/docs/` | Self-contained reference files — vision, functional/module reference, topology & infrastructure, persistence, mechanism explanations, build approach |
| `.claude/rules/` | Conventions auto-loaded when a matching file is opened/edited, scoped via `paths:` frontmatter |
| `.claude/agents/` | Bounded, repeatable subagent tasks with their own tool access (none defined yet) |
| `.claude/skills/` | Capabilities pulled in across tasks — this project's own bootstrap/interview/write/verify pipeline (`surveyor`, `specifier`, `archivist`, `sentinel`) |
| `.claude/settings.json` | Permission policy — see Permissions below |
| `deltas/` | Per-slice spec/design/plan files: `<slice>.spec.md`, optional `<slice>.design.md`, optional `<slice>.plan.md` (none specced yet) |

## Repo layout

| Path | Purpose |
|---|---|
| `cmd/` | Process entrypoints — the API process and the worker process (outbox relay + queue consumer) |
| `source/` | Application source; only a placeholder exists so far |
| `docker/database/` | Database container definition, bootstrap scripts, env template |
| `compose.yml` | Root Docker Compose entrypoint |
| `VISION.md` | The project's own vision/approach source document |

## Setup & common commands

| Task | Command |
|---|---|
| Install dependencies | `bun install` |
| Run API process in dev | `bun run dev:service` |
| Run worker process in dev | `bun run dev:worker` |
| Start the database | `docker compose up -d` |

No test runner, lint step, or build step is configured yet.

## Permissions

The full policy lives in `.claude/settings.json`. Reading `.env` files and anything under a `secrets/` directory is denied by default; `git push`/`git pull` are denied; a set of read-only and local dev commands (dependency install/run, git inspection, Docker Compose, PowerShell) are pre-approved.

## Conventions

Follow the delta knowledge-base editing conventions in `.claude/rules/kb-edit-routing.md` when touching anything under `.claude/` or `deltas/` — route through the matching skill rather than hand-editing.

---

## Non-goals

No UI/frontend, no real authentication, no multi-currency support, no advanced accounting reports — see `.claude/docs/overview.md`'s Scope & non-goals for the full statement.
