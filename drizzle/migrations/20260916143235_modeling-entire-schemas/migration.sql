CREATE TABLE "core"."expense_approvals" (
	"id" uuid PRIMARY KEY,
	"expense_request_id" uuid NOT NULL,
	"level" text NOT NULL,
	"approver_id" text NOT NULL,
	"decided_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."expense_outbox" (
	"id" uuid PRIMARY KEY,
	"expense_request_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "core"."expense_requests" (
	"id" uuid PRIMARY KEY,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"state" text NOT NULL,
	"debit_account_id" uuid,
	"credit_account_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."ledger_entries" (
	"id" uuid PRIMARY KEY,
	"transaction_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"direction" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."ledger_processed_events" (
	"id" uuid PRIMARY KEY,
	"event_id" uuid NOT NULL UNIQUE,
	"ledger_transaction_id" uuid,
	"processed_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."ledger_transactions" (
	"id" uuid PRIMARY KEY,
	"reverses_transaction_id" uuid,
	"posted_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "core"."expense_approvals" ADD CONSTRAINT "expense_approvals_expense_request_id_expense_requests_id_fkey" FOREIGN KEY ("expense_request_id") REFERENCES "core"."expense_requests"("id");--> statement-breakpoint
ALTER TABLE "core"."expense_outbox" ADD CONSTRAINT "expense_outbox_expense_request_id_expense_requests_id_fkey" FOREIGN KEY ("expense_request_id") REFERENCES "core"."expense_requests"("id");--> statement-breakpoint
ALTER TABLE "core"."ledger_entries" ADD CONSTRAINT "ledger_entries_transaction_id_ledger_transactions_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "core"."ledger_transactions"("id");--> statement-breakpoint
ALTER TABLE "core"."ledger_processed_events" ADD CONSTRAINT "ledger_processed_events_STxFtAoaalu5_fkey" FOREIGN KEY ("ledger_transaction_id") REFERENCES "core"."ledger_transactions"("id");--> statement-breakpoint
ALTER TABLE "core"."ledger_transactions" ADD CONSTRAINT "ledger_transactions_3zqNG7EUcY4y_fkey" FOREIGN KEY ("reverses_transaction_id") REFERENCES "core"."ledger_transactions"("id");