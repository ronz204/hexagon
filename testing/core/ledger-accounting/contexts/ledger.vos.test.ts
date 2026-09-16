import { InvalidIdentifierError } from "@core/common-domain/contexts/identifier.errors";
import { Money } from "@core/common-domain/contexts/money.vos";
import { EntryDirection } from "@core/ledger-accounting/contexts/ledger.enums";
import { InvalidEntryAmountError } from "@core/ledger-accounting/contexts/ledger.errors";
import {
	AccountId,
	Entry,
	LedgerTransactionId,
} from "@core/ledger-accounting/contexts/ledger.vos";
import { aUuid } from "@tests/fixtures/uuid.fixtures";
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
