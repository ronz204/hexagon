# Relay — Approach

## Propósito

POC de aprendizaje enfocado en arquitectura orientada a eventos dentro de un monolito
modular: domain events vs integration events, patrón outbox transaccional, mensajería
vía queue/worker, y los límites reales entre bounded contexts (interfaces públicas +
eventos, no acoplamiento directo).

No es DDD/Hexagonal estricto — el objetivo es consolidar criterio y forma de trabajar,
no perseguir pureza académica.

## Bounded Contexts

### Approvals — dueño del flujo de aprobación de gastos

**Aggregate root:** `ExpenseRequest`

Invariantes:
- No puede aprobarse una solicitud ya rechazada o ya aprobada (transición válida
  solo desde `Pending` o `InReview`)
- Montos superiores a un umbral requieren un segundo nivel de aprobación
  (ej. > $500 requiere manager + finance)
- No se puede aprobar sin al menos una cuenta contable de destino asignada

Value Objects: `Money` (amount + currency), `ApprovalThreshold`

Domain events (internos, síncronos, mismo proceso/transacción):
`RequestSubmitted`, `RequestMovedToReview`, `RequestApproved`, `RequestRejected`

Integration event (cruza el context — este es el que viaja por la queue):
`ExpenseApproved` — payload mínimo: `requestId`, `amount`, `currency`,
`debitAccountId`, `creditAccountId`, `approvedAt`

### Ledger — dueño de la contabilidad

**Aggregate root:** `LedgerTransaction`

Invariantes:
- Suma de débitos == suma de créditos, siempre (regla de doble entrada)
- Una transacción no puede tener menos de 2 entries (mínimo un debit, un credit)
- Una transacción posteada no se edita — solo se reversa con una
  `ReversingTransaction` nueva

Value Objects: `Money`, `AccountId`

Ledger no conoce `ExpenseRequest`. Solo reacciona al evento `ExpenseApproved` desde
afuera — el handler que lo consume actúa como anticorruption layer si el payload
cambia de forma con el tiempo.

## Comunicación entre contexts

Approvals → Ledger es 100% asíncrono vía el integration event `ExpenseApproved`.

Mecanismo — Transactional Outbox:

1. Approvals escribe en la MISMA transacción: (a) el nuevo estado de
   `ExpenseRequest`, (b) una fila en `outbox_events`
2. Un **relay** (loop de polling dentro de `worker.ts`) lee
   `outbox_events WHERE published_at IS NULL`, publica el payload a BullMQ,
   marca `published_at`
3. Un **worker de BullMQ** (mismo `worker.ts`, proceso separado de `api.ts`)
   consume el job y ejecuta el caso de uso `PostExpenseToLedger`, que crea el
   `LedgerTransaction` correspondiente

Broker: **BullMQ + Redis**. Justificación: ya está en el stack, y mantiene
outbox / relay / queue como tres piezas conceptualmente distintas — que es
justo el objetivo de aprendizaje de este proyecto.

## Arquitectura

- Hexagonal por bounded context — cada uno con su propio `core` / `app` / `infra`,
  sin compartir tablas ni tipos de dominio entre sí
- `api.ts` y `worker.ts` como entrypoints separados sobre el mismo codebase
  (mismo patrón que Forger)
- Puertos clave: `ExpenseRequestRepository`, `LedgerTransactionRepository`,
  `EventPublisher` (implementado por el relay + BullMQ), `OutboxRepository`

## Roadmap por fases

- **Fase 0 — Setup:** Bun + Elysia + Prisma + Postgres + Redis vía Docker Compose;
  validar compatibilidad Bun de BullMQ y demás dependencias
- **Fase 1 — Approvals core:** agregado `ExpenseRequest`, invariantes de
  transición de estado, casos de uso (submit / review / approve / reject),
  tests de invariantes
- **Fase 2 — Outbox:** tabla `outbox_events`, escritura transaccional junto
  al agregado, diseño de idempotencia (evitar publicar el mismo evento dos veces)
- **Fase 3 — Relay + BullMQ:** loop de polling del outbox, publicación a la
  queue, worker consumidor básico
- **Fase 4 — Ledger core:** agregado `LedgerTransaction`, invariante de
  balance débito = crédito, caso de uso `PostExpenseToLedger` disparado por
  el evento consumido
- **Fase 5 — Resiliencia:** reintentos de BullMQ, qué pasa si Ledger rechaza
  el evento (¿dead letter?), verificación de idempotencia end-to-end (mismo
  evento procesado dos veces no debe duplicar la transacción contable)
- **Fase 6 (opcional, si sobra tiempo):** endpoint de consulta simple en
  Ledger (transacciones por cuenta) para cerrar el ciclo completo

## Riesgos

- Idempotencia end-to-end es lo más fácil de subestimar — sin una
  `processed_events` table o unique constraint en Ledger, un reintento de
  BullMQ puede duplicar transacciones contables
- El intervalo de polling del outbox agrega latencia perceptible si es muy
  largo — arrancar con algo razonable (ej. 500ms-1s)
- Tentación de acoplar Ledger a la forma exacta del agregado de Approvals —
  el integration event debe ser un contrato explícito y estable, no un dump
  del aggregate

## Fuera de alcance

- UI/frontend (todo vía API + tests/Postman/Insomnia)
- Autenticación real (mockear el usuario que aprueba)
- Multi-moneda con conversión de tipo de cambio (una sola currency por transacción)
- Reportes contables avanzados (balance general, estado de resultados)