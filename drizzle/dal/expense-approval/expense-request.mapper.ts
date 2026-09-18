import { Money } from "@core/common-domain";
import {
	AccountId,
	Approval,
	type ApprovalLevel,
	type ExpenseRequestId,
	type ExpenseRequestSnapshot,
	type ExpenseState,
} from "@core/expense-approval";
import type {
	expenseApprovals,
	expenseRequests,
} from "@drizz/database/schemas/core.schema";

type ExpenseRequestRow = typeof expenseRequests.$inferSelect;
type ExpenseApprovalRow = typeof expenseApprovals.$inferSelect;

export const ExpenseRequestMapper = {
	toRow(snapshot: ExpenseRequestSnapshot) {
		return {
			id: snapshot.id.value,
			amount: snapshot.amount.amount,
			currency: snapshot.amount.currency,
			state: snapshot.state,
			debitAccountId: snapshot.debitAccountId?.value,
			creditAccountId: snapshot.creditAccountId?.value,
		};
	},

	toApprovalRows(snapshot: ExpenseRequestSnapshot) {
		return snapshot.approvals.map((approval) => ({
			expenseRequestId: snapshot.id.value,
			level: approval.level,
			approverId: approval.approverId,
			decidedAt: approval.decidedAt,
		}));
	},

	toSnapshot(
		id: ExpenseRequestId,
		row: ExpenseRequestRow,
		approvalRows: ExpenseApprovalRow[],
	): ExpenseRequestSnapshot {
		return {
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
	},
};
