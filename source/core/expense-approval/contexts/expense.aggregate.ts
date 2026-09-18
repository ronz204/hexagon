import type { Money } from "@core/common-domain";
import { Approval } from "./expense.entities";
import { ApprovalLevel, ExpenseState } from "./expense.enums";
import {
	DuplicateApprovalError,
	InvalidAmountError,
	InvalidStateTransitionError,
	MissingDestinationAccountsError,
	OutOfOrderApprovalError,
} from "./expense.errors";
import {
	ExpenseApproved,
	ExpenseMovedToReview,
	ExpenseRejected,
	ExpenseSubmitted,
} from "./expense.events";
import type { AccountId, ExpenseRequestId } from "./expense.vos";

type DomainEvent =
	| ExpenseSubmitted
	| ExpenseMovedToReview
	| ExpenseApproved
	| ExpenseRejected;

export interface ExpenseRequestSnapshot {
	readonly id: ExpenseRequestId;
	readonly amount: Money;
	readonly state: ExpenseState;
	readonly debitAccountId: AccountId | undefined;
	readonly creditAccountId: AccountId | undefined;
	readonly approvals: Approval[];
}

export class ExpenseRequest {
	private state: ExpenseState;
	private debitAccountId?: AccountId;
	private creditAccountId?: AccountId;
	private readonly approvals: Approval[] = [];
	private readonly domainEvents: DomainEvent[] = [];

	private constructor(
		readonly id: ExpenseRequestId,
		readonly amount: Money,
	) {
		this.state = ExpenseState.Pending;
	}

	static submit(id: ExpenseRequestId, amount: Money): ExpenseRequest {
		if (amount.amount === 0) throw new InvalidAmountError();
		const request = new ExpenseRequest(id, amount);
		request.domainEvents.push(new ExpenseSubmitted(id, amount));
		return request;
	}

	static reconstitute(snapshot: ExpenseRequestSnapshot): ExpenseRequest {
		const request = new ExpenseRequest(snapshot.id, snapshot.amount);
		request.state = snapshot.state;
		request.debitAccountId = snapshot.debitAccountId;
		request.creditAccountId = snapshot.creditAccountId;
		request.approvals.push(...snapshot.approvals);
		return request;
	}

	getState(): ExpenseState {
		return this.state;
	}

	getSnapshot(): ExpenseRequestSnapshot {
		return {
			id: this.id,
			amount: this.amount,
			state: this.state,
			debitAccountId: this.debitAccountId,
			creditAccountId: this.creditAccountId,
			approvals: [...this.approvals],
		};
	}

	pullDomainEvents(): DomainEvent[] {
		return this.domainEvents.splice(0, this.domainEvents.length);
	}

	private assertNotDecided(attempted: string): void {
		if (
			this.state === ExpenseState.Approved ||
			this.state === ExpenseState.Rejected
		) {
			throw new InvalidStateTransitionError(this.state, attempted);
		}
	}

	moveToReview(): void {
		if (this.state !== ExpenseState.Pending)
			throw new InvalidStateTransitionError(this.state, "moveToReview");
		this.state = ExpenseState.InReview;
		this.domainEvents.push(new ExpenseMovedToReview(this.id));
	}

	assignAccounts(debitAccountId: AccountId, creditAccountId: AccountId): void {
		this.assertNotDecided("assignAccounts");
		this.debitAccountId = debitAccountId;
		this.creditAccountId = creditAccountId;
	}

	private hasApprovalFrom(level: ApprovalLevel): boolean {
		return this.approvals.some((approval) => approval.level === level);
	}

	recordApproval(
		level: ApprovalLevel,
		approverId: string,
		threshold: Money,
	): void {
		this.assertNotDecided("recordApproval");
		if (!this.debitAccountId || !this.creditAccountId)
			throw new MissingDestinationAccountsError();
		const debitAccountId = this.debitAccountId;
		const creditAccountId = this.creditAccountId;

		if (this.hasApprovalFrom(level)) throw new DuplicateApprovalError(level);

		const requiresBothLevels = this.amount.isGreaterThan(threshold);

		if (
			requiresBothLevels &&
			level === ApprovalLevel.Finance &&
			!this.hasApprovalFrom(ApprovalLevel.Manager)
		) {
			throw new OutOfOrderApprovalError(
				ApprovalLevel.Finance,
				ApprovalLevel.Manager,
			);
		}

		this.approvals.push(Approval.of(level, approverId));

		const isFullyApproved =
			!requiresBothLevels ||
			(this.hasApprovalFrom(ApprovalLevel.Manager) &&
				this.hasApprovalFrom(ApprovalLevel.Finance));

		if (isFullyApproved) {
			this.state = ExpenseState.Approved;
			this.domainEvents.push(
				new ExpenseApproved(
					this.id,
					this.amount,
					debitAccountId,
					creditAccountId,
					this.approvals.map((approval) => approval.level),
					new Date(),
				),
			);
		}
	}

	reject(reason?: string): void {
		this.assertNotDecided("reject");
		this.state = ExpenseState.Rejected;
		this.domainEvents.push(new ExpenseRejected(this.id, reason));
	}
}
