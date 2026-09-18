import type { ExpenseRequestRepository } from "@core/expense-approval";
import type { LedgerTransactionRepository } from "@core/ledger-accounting";

import { token } from "dockdi";
import type { Database } from "./drizzle.ctx";

export const DatabaseToken = token<Database>("db:drizzle");
export const ExpenseRequestRepositoryToken =
	token<ExpenseRequestRepository>("expense:repo");
export const LedgerTransactionRepositoryToken =
	token<LedgerTransactionRepository>("ledger:repo");
