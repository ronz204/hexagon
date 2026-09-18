import {
	ExpenseRequest,
	type ExpenseRequestId,
	type ExpenseRequestRepository,
} from "@core/expense-approval";
import type { Database } from "@drizz/dal/drizzle.client";
import {
	expenseApprovals,
	expenseRequests,
} from "@drizz/database/schemas/core.schema";
import { eq } from "drizzle-orm";
import { ExpenseRequestMapper } from "./expense-request.mapper";

export class DrizzleExpenseRequestRepository
	implements ExpenseRequestRepository
{
	constructor(private readonly db: Database) {}

	async save(request: ExpenseRequest): Promise<void> {
		const snapshot = request.getSnapshot();
		const row = ExpenseRequestMapper.toRow(snapshot);

		await this.db.transaction(async (tx) => {
			await tx
				.insert(expenseRequests)
				.values(row)
				.onConflictDoUpdate({
					target: expenseRequests.id,
					set: { ...row, updatedAt: new Date() },
				});

			const approvalRows = ExpenseRequestMapper.toApprovalRows(snapshot);
			if (approvalRows.length === 0) return;

			await tx
				.insert(expenseApprovals)
				.values(approvalRows)
				.onConflictDoNothing({
					target: [expenseApprovals.expenseRequestId, expenseApprovals.level],
				});
		});
	}

	async findById(id: ExpenseRequestId): Promise<ExpenseRequest | undefined> {
		const [row] = await this.db
			.select()
			.from(expenseRequests)
			.where(eq(expenseRequests.id, id.value))
			.limit(1);
		if (!row) return undefined;

		const approvalRows = await this.db
			.select()
			.from(expenseApprovals)
			.where(eq(expenseApprovals.expenseRequestId, id.value));

		return ExpenseRequest.reconstitute(
			ExpenseRequestMapper.toSnapshot(id, row, approvalRows),
		);
	}
}
