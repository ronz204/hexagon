import { Money } from "@core/common-domain";
import {
	AccountId,
	Approval,
	type ApprovalLevel,
	ExpenseRequest,
	type ExpenseRequestId,
	type ExpenseRequestRepository,
	type ExpenseRequestSnapshot,
	type ExpenseState,
} from "@core/expense-approval";
import {
	expenseApprovals,
	expenseRequests,
} from "@drizz/database/schemas/core.schema";
import { eq } from "drizzle-orm";
import type { Database } from "@drizz/dal/drizzle.ctx";

export class DrizzleExpenseRequestRepository
	implements ExpenseRequestRepository
{
	constructor(private readonly db: Database) {}

	async save(request: ExpenseRequest): Promise<void> {
		const snapshot = request.getSnapshot();

		await this.db.transaction(async (tx) => {
			await tx
				.insert(expenseRequests)
				.values({
					id: snapshot.id.value,
					amount: snapshot.amount.amount,
					currency: snapshot.amount.currency,
					state: snapshot.state,
					debitAccountId: snapshot.debitAccountId?.value,
					creditAccountId: snapshot.creditAccountId?.value,
				})
				.onConflictDoUpdate({
					target: expenseRequests.id,
					set: {
						amount: snapshot.amount.amount,
						currency: snapshot.amount.currency,
						state: snapshot.state,
						debitAccountId: snapshot.debitAccountId?.value,
						creditAccountId: snapshot.creditAccountId?.value,
						updatedAt: new Date(),
					},
				});

			if (snapshot.approvals.length === 0) return;

			await tx
				.insert(expenseApprovals)
				.values(
					snapshot.approvals.map((approval) => ({
						expenseRequestId: snapshot.id.value,
						level: approval.level,
						approverId: approval.approverId,
						decidedAt: approval.decidedAt,
					})),
				)
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

		const snapshot: ExpenseRequestSnapshot = {
			id,
			amount: Money.of(row.amount, row.currency),
			state: row.state as ExpenseState,
			debitAccountId: row.debitAccountId
				? AccountId.of(row.debitAccountId)
				: undefined,
			creditAccountId: row.creditAccountId
				? AccountId.of(row.creditAccountId)
				: undefined,
			approvals: approvalRows.map((approvalRow) =>
				Approval.of(
					approvalRow.level as ApprovalLevel,
					approvalRow.approverId,
					approvalRow.decidedAt,
				),
			),
		};

		return ExpenseRequest.reconstitute(snapshot);
	}
}
