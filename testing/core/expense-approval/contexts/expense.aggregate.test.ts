import {
	ApprovalLevel,
	DuplicateApprovalError,
	ExpenseApproved,
	ExpenseMovedToReview,
	ExpenseRejected,
	ExpenseRequest,
	ExpenseState,
	ExpenseSubmitted,
	InvalidAmountError,
	InvalidStateTransitionError,
	MissingDestinationAccountsError,
	OutOfOrderApprovalError,
} from "@core/expense-approval";
import {
	anAccountId,
	anAmount,
	anExpenseRequestId,
	anExpenseRequestReadyForApproval,
	aSubmittedExpenseRequest,
} from "@tests/utils/fixtures/expense.fixtures";
import { describe, expect, it } from "vitest";

describe("ExpenseRequest.submit", () => {
	it("empieza en estado Pending", () => {
		expect(aSubmittedExpenseRequest().getState()).toBe(ExpenseState.Pending);
	});

	it("emite ExpenseSubmitted", () => {
		const id = anExpenseRequestId();
		const amount = anAmount();

		const request = ExpenseRequest.submit(id, amount);

		expect(request.pullDomainEvents()).toEqual([
			new ExpenseSubmitted(id, amount),
		]);
	});

	it("rechaza un monto de cero", () => {
		expect(() =>
			ExpenseRequest.submit(anExpenseRequestId(), anAmount(0)),
		).toThrow(InvalidAmountError);
	});
});

describe("ExpenseRequest.moveToReview", () => {
	it("pasa de Pending a InReview y emite ExpenseMovedToReview", () => {
		const request = aSubmittedExpenseRequest();
		request.pullDomainEvents();

		request.moveToReview();

		expect(request.getState()).toBe(ExpenseState.InReview);
		expect(request.pullDomainEvents()).toEqual([
			new ExpenseMovedToReview(request.id),
		]);
	});

	it("no permite moverse a revisión si ya está en revisión", () => {
		const request = aSubmittedExpenseRequest();
		request.moveToReview();

		expect(() => request.moveToReview()).toThrow(InvalidStateTransitionError);
	});
});

describe("ExpenseRequest.assignAccounts", () => {
	it("permite asignar cuentas mientras no esté decidida", () => {
		const request = aSubmittedExpenseRequest();

		expect(() =>
			request.assignAccounts(anAccountId(), anAccountId()),
		).not.toThrow();
	});

	it("no permite asignar cuentas si ya fue rechazada", () => {
		const request = aSubmittedExpenseRequest();
		request.reject();

		expect(() => request.assignAccounts(anAccountId(), anAccountId())).toThrow(
			InvalidStateTransitionError,
		);
	});
});

describe("ExpenseRequest.recordApproval", () => {
	it("no permite aprobar sin cuentas asignadas", () => {
		const request = aSubmittedExpenseRequest();

		expect(() =>
			request.recordApproval(ApprovalLevel.Manager, "user-1", anAmount(10_000)),
		).toThrow(MissingDestinationAccountsError);
	});

	it("aprueba de inmediato y emite ExpenseApproved cuando el monto no supera el threshold", () => {
		const request = anExpenseRequestReadyForApproval(anAmount(1000));
		request.pullDomainEvents();

		request.recordApproval(ApprovalLevel.Manager, "user-1", anAmount(5000));

		expect(request.getState()).toBe(ExpenseState.Approved);
		const [event] = request.pullDomainEvents();
		expect(event).toBeInstanceOf(ExpenseApproved);
		const approved = event as ExpenseApproved;
		expect(approved.requestId).toBe(request.id);
		expect(approved.approvals).toEqual([ApprovalLevel.Manager]);
		expect(approved.approvedAt).toBeInstanceOf(Date);
	});

	it("exige aprobación de Manager antes que Finance cuando el monto supera el threshold", () => {
		const request = anExpenseRequestReadyForApproval(anAmount(10_000));

		expect(() =>
			request.recordApproval(ApprovalLevel.Finance, "user-1", anAmount(5000)),
		).toThrow(OutOfOrderApprovalError);
	});

	it("requiere ambos niveles cuando el monto supera el threshold", () => {
		const request = anExpenseRequestReadyForApproval(anAmount(10_000));

		request.recordApproval(ApprovalLevel.Manager, "user-1", anAmount(5000));
		expect(request.getState()).toBe(ExpenseState.InReview);

		request.recordApproval(ApprovalLevel.Finance, "user-2", anAmount(5000));
		expect(request.getState()).toBe(ExpenseState.Approved);
	});

	it("no permite que el mismo nivel apruebe dos veces", () => {
		const request = anExpenseRequestReadyForApproval(anAmount(10_000));
		request.recordApproval(ApprovalLevel.Manager, "user-1", anAmount(5000));

		expect(() =>
			request.recordApproval(ApprovalLevel.Manager, "user-2", anAmount(5000)),
		).toThrow(DuplicateApprovalError);
	});

	it("no permite aprobar una solicitud ya decidida", () => {
		const request = anExpenseRequestReadyForApproval(anAmount(1000));
		request.reject();

		expect(() =>
			request.recordApproval(ApprovalLevel.Manager, "user-1", anAmount(5000)),
		).toThrow(InvalidStateTransitionError);
	});
});

describe("ExpenseRequest.reject", () => {
	it("pasa a Rejected y emite ExpenseRejected con el motivo dado", () => {
		const request = aSubmittedExpenseRequest();
		request.pullDomainEvents();

		request.reject("fuera de política");

		expect(request.getState()).toBe(ExpenseState.Rejected);
		expect(request.pullDomainEvents()).toEqual([
			new ExpenseRejected(request.id, "fuera de política"),
		]);
	});

	it("no permite rechazar una solicitud ya decidida", () => {
		const request = aSubmittedExpenseRequest();
		request.reject();

		expect(() => request.reject()).toThrow(InvalidStateTransitionError);
	});
});

describe("ExpenseRequest.pullDomainEvents", () => {
	it("limpia los eventos después de leerlos", () => {
		const request = aSubmittedExpenseRequest();

		request.pullDomainEvents();

		expect(request.pullDomainEvents()).toEqual([]);
	});
});
