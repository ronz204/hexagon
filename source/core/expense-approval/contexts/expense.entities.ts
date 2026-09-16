import type { ApprovalLevel } from "./expense.enums";

export class Approval {
	private constructor(
		readonly level: ApprovalLevel,
		readonly approverId: string,
		readonly decidedAt: Date,
	) {}

	static of(
		level: ApprovalLevel,
		approverId: string,
		decidedAt: Date = new Date(),
	): Approval {
		return new Approval(level, approverId, decidedAt);
	}
}
