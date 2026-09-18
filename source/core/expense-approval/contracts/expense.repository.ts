import type { ExpenseRequest } from "@core/expense-approval/contexts/expense.aggregate";
import type { ExpenseRequestId } from "@core/expense-approval/contexts/expense.vos";

export interface ExpenseRequestRepository {
	save(request: ExpenseRequest): Promise<void>;
	findById(id: ExpenseRequestId): Promise<ExpenseRequest | undefined>;
}
