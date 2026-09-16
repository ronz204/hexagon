import type { Money } from "@core/common-domain/contexts/money.vos";
import type { ApprovalLevel } from "./expense.enums";
import type { AccountId, ExpenseRequestId } from "./expense.vos";

export class ExpenseSubmitted {
	constructor(
		readonly requestId: ExpenseRequestId,
		readonly amount: Money,
	) {}
}

export class ExpenseMovedToReview {
	constructor(readonly requestId: ExpenseRequestId) {}
}

export class ExpenseApproved {
	constructor(
		readonly requestId: ExpenseRequestId,
		readonly amount: Money,
		readonly debitAccountId: AccountId,
		readonly creditAccountId: AccountId,
		readonly approvals: ApprovalLevel[],
		readonly approvedAt: Date,
	) {}
}

export class ExpenseRejected {
	constructor(
		readonly requestId: ExpenseRequestId,
		readonly reason?: string,
	) {}
}
