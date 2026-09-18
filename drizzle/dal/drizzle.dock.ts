import type { ExpenseRequestRepository } from "@core/expense-approval";
import type { LedgerTransactionRepository } from "@core/ledger-accounting";
import type { Database } from "@drizz/dal/drizzle.client";
import { DrizzleExpenseRequestRepository } from "./expense-approval/expense-request.repository";
import { DrizzleLedgerTransactionRepository } from "./ledger-accounting/ledger-transaction.repository";
import type { Module } from "dockdi";
import { token } from "dockdi";

export const DatabaseToken = token<Database>("db:drizzle");
export const ExpenseRequestRepositoryToken =
	token<ExpenseRequestRepository>("expense:repo");
export const LedgerTransactionRepositoryToken =
	token<LedgerTransactionRepository>("ledger:repo");

export class DrizzleDock {
	static build(db: Database): Module {
		return (container) => {
			container.bind(DatabaseToken).toValue(db);
			container
				.bind(ExpenseRequestRepositoryToken)
				.toClass(DrizzleExpenseRequestRepository, [DatabaseToken])
				.inSingleton();
			container
				.bind(LedgerTransactionRepositoryToken)
				.toClass(DrizzleLedgerTransactionRepository, [DatabaseToken])
				.inSingleton();
		};
	}
}
