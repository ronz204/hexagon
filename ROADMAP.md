# Roadmap — Relay

> Documento de trabajo personal (no forma parte de la knowledge base de `.claude/`). Fotografía del estado real del código al 2026-09-17, contrastada contra `.claude/docs/approach.md` y los specs en `deltas/`, para saber qué está hecho, qué falta y en qué orden conviene seguir.

---

## 1. Resumen general

| # | Etapa | Estado |
|---|---|---|
| 0 | Setup e infraestructura | ✅ Hecho |
| 1 | Common Domain (shared kernel) | ✅ Hecho |
| 2 | Expense Approval — dominio (aggregate) | ✅ Hecho |
| 3 | Ledger Accounting — dominio (aggregate) | ✅ Hecho |
| 4 | Persistencia (Drizzle: schema + adaptadores) | 🟡 Parcial |
| 5 | Unit of Work (transacción compartida aggregate+outbox) | ⬜ No empezado |
| 6 | Casos de uso — Expense Approval | ⬜ No empezado |
| 7 | Endpoints HTTP de dominio | ⬜ No empezado |
| 8 | Outbox — escritura transaccional del evento | ⬜ No empezado |
| 9 | Relay — polling del outbox + publicación a la cola | ⬜ No empezado |
| 10 | Consumidor + caso de uso de Ledger (con ACL) | ⬜ No empezado |
| 11 | Resilience — reintentos, dead-lettering, idempotencia end-to-end | ⬜ No empezado |
| 12 | Stretch — query endpoint (transacciones por cuenta) | ⬜ No empezado |

Leyenda: ✅ hecho y verificado contra el código real · 🟡 parcial (la infraestructura/esquema existe, falta la lógica que la usa) · ⬜ no empezado.

---

## 2. Detalle por etapa

### Etapa 0 — Setup e infraestructura ✅

- [x] Bun + TypeScript strict configurados, path aliases (`@core/*`, `@drizz/*`, `@env`) funcionando.
- [x] PostgreSQL 17 provisionado vía `docker/database` (esquema `core`, roles owner/runtime separados, DB de test aislada).
- [x] Redis provisionado vía `docker/messaging` (`redis.conf` propio), listo para BullMQ.
- [x] Drizzle instalado, con 2 migraciones aplicadas (`drizzle/migrations/`).
- [x] Elysia instalado con plugins base: `HealthPlugin`, `OriginsPlugin` (CORS), `ScalarsPlugin` (OpenAPI en `/docs`).
- [x] `dockdi` (DI) wireado para los repositorios (`DrizzleDock`).
- [x] Vitest + Biome configurados y corriendo (`bun run test`, `bun run lint`).

### Etapa 1 — Common Domain (shared kernel) ✅

- [x] `Identifier` base + validador de forma UUID.
- [x] `Money` (entero no negativo, `equals` / `isGreaterThan` / `add`).
- [x] Tests de invariantes (`testing/core/common-domain/`).

### Etapa 2 — Expense Approval — dominio ✅

- [x] Aggregate `ExpenseRequest`: `submit`, `moveToReview`, `assignAccounts`, `recordApproval` (regla de segundo nivel por umbral), `reject`, `reconstitute`, `pullDomainEvents`.
- [x] Value objects, enums, errores y eventos de dominio (`ExpenseSubmitted`, `ExpenseMovedToReview`, `ExpenseApproved`, `ExpenseRejected`).
- [x] Puerto `ExpenseRequestRepository` definido.
- [x] Tests de aggregate/entities/vos (`testing/core/expense-approval/`).
- [ ] Capa de casos de uso/orquestación → ver Etapa 6.
- [ ] Endpoint HTTP → ver Etapa 7.

### Etapa 3 — Ledger Accounting — dominio ✅

- [x] Aggregate `LedgerTransaction`: `post`, `reverse` (inversión de dirección, misma validación de balance), `getEntries`, `getReversesTransactionId`, `reconstitute`.
- [x] Invariante de balance débito=crédito, entradas > 0, inmutabilidad tras posteo.
- [x] Puerto `LedgerTransactionRepository` definido.
- [x] Tests de aggregate/vos (`testing/core/ledger-accounting/`).
- [ ] Caso de uso que postea al consumir el evento de integración → ver Etapa 10.
- [ ] Capa anticorrupción (ACL) que traduce el evento externo → ver Etapa 10.

### Etapa 4 — Persistencia (Drizzle) 🟡

- [x] Adaptador concreto `DrizzleExpenseRequestRepository` + mapper, implementando `save`/`findById` contra Postgres real.
- [x] Adaptador concreto `DrizzleLedgerTransactionRepository` + mapper.
- [x] Esquema `expense_outbox` (event_type, payload, published_at) ya modelado — adelantado a la Etapa 8.
- [x] Esquema `ledger_processed_events` (event_id único) ya modelado — adelantado a la Etapa 11 (idempotencia).
- [ ] Nada escribe todavía en `expense_outbox` ni lee de `ledger_processed_events` — tablas listas, sin lógica de aplicación encima.
- [ ] Cada repo abre su propia transacción de forma aislada; no existe una transacción compartida entre aggregate + outbox → ver Etapa 5.

> Nota: los specs `deltas/expense-approval.spec.md` y `deltas/ledger-accounting.spec.md` dicen en "Deferred / Open questions" que el adaptador concreto "no existe todavía" — eso ya no es cierto (ver Etapa 9 de housekeeping en la sección 4).

### Etapa 5 — Unit of Work ⬜

Prerrequisito real de la Etapa 8: sin esto, ningún caso de uso puede escribir el aggregate y la fila de outbox en una sola transacción atómica (ver `sample.plan.md`, ya en el repo, Opción 3 de su análisis).

- [ ] Diseñar `UnitOfWork` (`drizzle/dal/uow/`) que abra una `tx` y exponga los repos "transaccionales" dentro de ella.
- [ ] Ajustar la firma de los repos para recibir `Tx` en vez de `Database`.
- [ ] Actualizar el wiring de DI (`drizzle.dock.ts`) para inyectar el UoW en vez de los repos sueltos donde aplique.

### Etapa 6 — Casos de uso — Expense Approval ⬜

- [ ] `SubmitExpenseRequest`.
- [ ] `AssignAccounts`.
- [ ] `RecordApproval` / `ApproveExpenseRequest`.
- [ ] `RejectExpenseRequest`.
- [ ] Cada caso de uso que produce `ExpenseApproved` escribe la fila en `expense_outbox` dentro de la misma transacción que persiste el aggregate (usando el UoW de la Etapa 5).

### Etapa 7 — Endpoints HTTP de dominio ⬜

- [ ] Levantar el servidor real en `cmd/service.boot.ts` (`.listen()`), montando los plugins ya existentes (`HealthPlugin`, `OriginsPlugin`, `ScalarsPlugin`).
- [ ] Endpoint para `submit`.
- [ ] Endpoint para `assign accounts`.
- [ ] Endpoint para `approve` / `record approval`.
- [ ] Endpoint para `reject`.

### Etapa 8 — Outbox: escritura transaccional ⬜

- [ ] Confirmar el shape final del evento de integración `ExpenseApproved` (contrato estable, no un dump del aggregate).
- [ ] Verificar (con un test) que la escritura del aggregate y la fila de `expense_outbox` se confirman o fallan juntas.

### Etapa 9 — Relay ⬜

- [ ] Loop de polling en el worker que lee `expense_outbox` (`published_at IS NULL`).
- [ ] Publicación a BullMQ.
- [ ] Marcar la fila como publicada tras el éxito.
- [ ] Definir y ajustar el intervalo de polling (arrancar en 0.5–1s).

### Etapa 10 — Consumidor + caso de uso de Ledger ⬜

- [ ] Job de BullMQ que recibe el evento publicado.
- [ ] Capa anticorrupción que traduce el payload externo al modelo propio de `ledger-accounting`.
- [ ] Caso de uso que invoca `LedgerTransaction.post(...)`.
- [ ] Inserción en `ledger_processed_events` en la misma transacción que postea la transacción (resuelve la idempotencia, tabla ya existe).

### Etapa 11 — Resilience ⬜

- [ ] Configurar reintentos/backoff de BullMQ.
- [ ] Definir qué pasa si el caso de uso de Ledger falla (dead-letter o equivalente).
- [ ] Test que fuerce una redelivery duplicada y confirme que `ledger_processed_events` evita el doble posteo.

### Etapa 12 — Stretch: query endpoint ⬜

- [ ] Endpoint de solo lectura para consultar transacciones posteadas por cuenta.
- [ ] Solo abordar una vez cerrado el ciclo completo submission → outbox → relay → queue → posted transaction.

---

## 3. Orden recomendado

El dominio (Etapas 0-3) ya está resuelto y bien testeado. El cuello de botella real es la capa de aplicación y el mecanismo de outbox. Seguir en este orden: **5 → 6 → 7 → 8 → 9 → 10 → 11 → 12**. La Etapa 4 (persistencia) ya está lo suficientemente avanzada como para no bloquear nada — solo necesita la transacción compartida de la Etapa 5 para terminar de cerrarse.

---

## 4. Deuda de documentación (housekeeping, no bloquea código)

- [ ] Pasar `sentinel` sobre `deltas/expense-approval.spec.md` y `deltas/ledger-accounting.spec.md`: ambos dicen que el adaptador concreto de repositorio "no existe todavía", pero ya existe (`drizzle/dal/expense-approval/`, `drizzle/dal/ledger-accounting/`). Corregir vía `archivist` una vez confirmado el drift.
- [ ] Refrescar `.claude/docs/approach.md`, `structure.md`, `database.md` y `modules.md` vía `archivist` — describen Elysia/Drizzle como "planned, not yet installed" y a los componentes sin implementación real, desactualizado frente al código actual. Mejor hacerlo de una vez al cerrar la Etapa 7, no línea por línea ahora.
- [ ] Formalizar en `structure.md` la decisión de layout (hoy resuelta de facto: `source/core/<context>/{contexts,contracts}` para dominio, `drizzle/dal/<context>/` para persistencia), marcada ahí mismo como "Open architecture decision" pendiente.

---

## 5. Riesgos a vigilar (de `approach.md`, siguen vigentes)

- **Idempotencia del consumidor** — sin `ledger_processed_events` funcionando de verdad (Etapa 10), una redelivery de BullMQ puede duplicar una transacción posteada.
- **Intervalo de polling del relay** — empezar en el orden de 0.5–1s y ajustar según comportamiento observado.
- **Acoplamiento del ACL** — el evento de integración (`ExpenseApproved` cruzando el outbox) debe quedar definido como contrato estable *antes* de escribir el consumidor de Ledger (Etapa 8, antes que la Etapa 10), no mientras se escribe.
