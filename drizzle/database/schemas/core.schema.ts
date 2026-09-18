import { generateId } from "@drizz/database/helpers/column.helper";
import * as pg from "drizzle-orm/pg-core";

export const core = pg.pgSchema("core").existing();

// --- Approvals context --------------------------------------------------

export const expenseRequests = core.table("expense_requests", {
	id: pg.uuid("id").primaryKey().$defaultFn(generateId),
	amount: pg.integer("amount").notNull(),
	currency: pg.text("currency").notNull(),
	state: pg.text("state").notNull(),
	debitAccountId: pg.uuid("debit_account_id"),
	creditAccountId: pg.uuid("credit_account_id"),
	createdAt: pg
		.timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: pg
		.timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const expenseApprovals = core.table(
	"expense_approvals",
	{
		id: pg.uuid("id").primaryKey().$defaultFn(generateId),
		expenseRequestId: pg
			.uuid("expense_request_id")
			.notNull()
			.references(() => expenseRequests.id),
		level: pg.text("level").notNull(),
		approverId: pg.text("approver_id").notNull(),
		decidedAt: pg.timestamp("decided_at", { withTimezone: true }).notNull(),
	},
	(table) => [
		pg
			.unique("expense_approvals_request_level_key")
			.on(table.expenseRequestId, table.level),
	],
);

export const expenseOutbox = core.table("expense_outbox", {
	id: pg.uuid("id").primaryKey().$defaultFn(generateId),
	expenseRequestId: pg
		.uuid("expense_request_id")
		.notNull()
		.references(() => expenseRequests.id),
	eventType: pg.text("event_type").notNull(),
	payload: pg.jsonb("payload").notNull(),
	occurredAt: pg.timestamp("occurred_at", { withTimezone: true }).notNull(),
	publishedAt: pg.timestamp("published_at", { withTimezone: true }),
});

// --- Ledger context -------------------------------------------------------

export const ledgerTransactions = core.table("ledger_transactions", {
	id: pg.uuid("id").primaryKey().$defaultFn(generateId),
	reversesTransactionId: pg
		.uuid("reverses_transaction_id")
		.references((): pg.AnyPgColumn => ledgerTransactions.id),
	postedAt: pg.timestamp("posted_at", { withTimezone: true }).notNull(),
});

export const ledgerEntries = core.table("ledger_entries", {
	id: pg.uuid("id").primaryKey().$defaultFn(generateId),
	transactionId: pg
		.uuid("transaction_id")
		.notNull()
		.references(() => ledgerTransactions.id),
	accountId: pg.uuid("account_id").notNull(),
	amount: pg.integer("amount").notNull(),
	currency: pg.text("currency").notNull(),
	direction: pg.text("direction").notNull(),
});

export const ledgerProcessedEvents = core.table("ledger_processed_events", {
	id: pg.uuid("id").primaryKey().$defaultFn(generateId),
	eventId: pg.uuid("event_id").notNull().unique(),
	ledgerTransactionId: pg
		.uuid("ledger_transaction_id")
		.references(() => ledgerTransactions.id),
	processedAt: pg.timestamp("processed_at", { withTimezone: true }).notNull(),
});
