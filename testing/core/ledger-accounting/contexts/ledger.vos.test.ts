import { InvalidIdentifierError, Money } from "@core/common-domain";
import {
	AccountId,
	Entry,
	EntryDirection,
	InvalidEntryAmountError,
	LedgerTransactionId,
} from "@core/ledger-accounting";
import { aUuid } from "@tests/utils/fixtures/uuid.fixtures";
import { describe, expect, it } from "vitest";

describe("LedgerTransactionId", () => {
	it("se construye a partir de un UUID válido", () => {
		const value = aUuid();

		expect(LedgerTransactionId.of(value).value).toBe(value);
	});

	it("rechaza un valor que no es UUID", () => {
		expect(() => LedgerTransactionId.of("not-a-uuid")).toThrow(
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
});

describe("Entry.of", () => {
	it("se construye con un monto mayor a cero", () => {
		const accountId = AccountId.of(aUuid());
		const amount = Money.of(1000, "USD");

		const entry = Entry.of(accountId, amount, EntryDirection.Debit);

		expect(entry.accountId).toBe(accountId);
		expect(entry.amount).toBe(amount);
		expect(entry.direction).toBe(EntryDirection.Debit);
	});

	it("rechaza un monto de cero", () => {
		const accountId = AccountId.of(aUuid());

		expect(() =>
			Entry.of(accountId, Money.of(0, "USD"), EntryDirection.Credit),
		).toThrow(InvalidEntryAmountError);
	});
});
