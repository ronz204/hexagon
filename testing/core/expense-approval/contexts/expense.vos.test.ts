import { InvalidIdentifierError } from "@core/common-domain/contexts/identifier.errors";
import {
	AccountId,
	ExpenseRequestId,
} from "@core/expense-approval/contexts/expense.vos";
import { aUuid } from "@tests/fixtures/uuid.fixtures";
import { describe, expect, it } from "vitest";

describe("ExpenseRequestId", () => {
	it("se construye a partir de un UUID válido", () => {
		const value = aUuid();

		expect(ExpenseRequestId.of(value).value).toBe(value);
	});

	it("rechaza un valor que no es UUID", () => {
		expect(() => ExpenseRequestId.of("not-a-uuid")).toThrow(
			InvalidIdentifierError,
		);
	});
});

describe("AccountId", () => {
	it("se construye a partir de un UUID válido", () => {
		const value = aUuid();

		expect(AccountId.of(value).value).toBe(value);
	});

	it("rechaza un valor que no es UUID", () => {
		expect(() => AccountId.of("not-a-uuid")).toThrow(InvalidIdentifierError);
	});

	it("no es igual a un ExpenseRequestId con el mismo value", () => {
		const value = aUuid();

		expect(AccountId.of(value).equals(ExpenseRequestId.of(value))).toBe(false);
	});
});
