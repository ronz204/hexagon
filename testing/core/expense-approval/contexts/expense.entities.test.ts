import { Approval } from "@core/expense-approval/contexts/expense.entities";
import { ApprovalLevel } from "@core/expense-approval/contexts/expense.enums";
import { describe, expect, it } from "vitest";

describe("Approval.of", () => {
	it("se construye con el nivel y el aprobador dados", () => {
		const approval = Approval.of(ApprovalLevel.Manager, "user-1");

		expect(approval.level).toBe(ApprovalLevel.Manager);
		expect(approval.approverId).toBe("user-1");
	});

	it("usa la fecha actual cuando no se especifica decidedAt", () => {
		const before = new Date();
		const approval = Approval.of(ApprovalLevel.Manager, "user-1");
		const after = new Date();

		expect(approval.decidedAt.getTime()).toBeGreaterThanOrEqual(
			before.getTime(),
		);
		expect(approval.decidedAt.getTime()).toBeLessThanOrEqual(after.getTime());
	});

	it("respeta un decidedAt explícito", () => {
		const decidedAt = new Date("2026-01-01T00:00:00Z");

		const approval = Approval.of(ApprovalLevel.Finance, "user-2", decidedAt);

		expect(approval.decidedAt).toBe(decidedAt);
	});
});
