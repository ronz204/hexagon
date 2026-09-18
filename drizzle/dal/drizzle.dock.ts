import type { Module } from "dockdi";
import type { Database } from "./drizzle.ctx";
import {
	DatabaseToken,
	ExpenseRequestRepositoryToken,
	LedgerTransactionRepositoryToken,
} from "./drizzle.tokens";
import { DrizzleExpenseRequestRepository } from "./repos/expense-request.repository";
import { DrizzleLedgerTransactionRepository } from "./repos/ledger-transaction.repository";

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
