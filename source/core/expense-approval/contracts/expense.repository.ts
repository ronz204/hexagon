import type { ExpenseRequest } from "../contexts/expense.aggregate";
import type { ExpenseRequestId } from "../contexts/expense.vos";

export interface ExpenseRequestRepository {
	save(request: ExpenseRequest): Promise<void>;
	findById(id: ExpenseRequestId): Promise<ExpenseRequest | undefined>;
}
