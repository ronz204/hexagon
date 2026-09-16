import { Money } from "@core/common-domain/contexts/money.vos";
import { LedgerTransaction } from "@core/ledger-accounting/contexts/ledger.aggregate";
import { EntryDirection } from "@core/ledger-accounting/contexts/ledger.enums";
import {
	MissingEntryDirectionError,
	UnbalancedTransactionError,
} from "@core/ledger-accounting/contexts/ledger.errors";
import {
	TransactionPosted,
	TransactionReversed,
} from "@core/ledger-accounting/contexts/ledger.events";
import { Entry } from "@core/ledger-accounting/contexts/ledger.vos";
import {
	aBalancedEntryPair,
	aLedgerAccountId,
	aLedgerTransactionId,
	anEntry,
} from "@tests/fixtures/ledger.fixtures";
import { describe, expect, it } from "vitest";

describe("LedgerTransaction.post", () => {
	it("acepta entries balanceados y emite TransactionPosted", () => {
		const id = aLedgerTransactionId();
		const entries = aBalancedEntryPair();

		const transaction = LedgerTransaction.post(id, entries);

		expect(transaction.getEntries()).toEqual(entries);
		expect(transaction.pullDomainEvents()).toEqual([
			new TransactionPosted(id, entries),
		]);
	});

	it("rechaza entries sin ningún Debit", () => {
		const entries = [anEntry(EntryDirection.Credit)];

		expect(() =>
			LedgerTransaction.post(aLedgerTransactionId(), entries),
		).toThrow(MissingEntryDirectionError);
	});

	it("rechaza entries sin ningún Credit", () => {
		const entries = [anEntry(EntryDirection.Debit)];

		expect(() =>
			LedgerTransaction.post(aLedgerTransactionId(), entries),
		).toThrow(MissingEntryDirectionError);
	});

	it("rechaza entries desbalanceados", () => {
		const entries = [
			Entry.of(aLedgerAccountId(), Money.of(1000, "USD"), EntryDirection.Debit),
			Entry.of(aLedgerAccountId(), Money.of(500, "USD"), EntryDirection.Credit),
		];

		expect(() =>
			LedgerTransaction.post(aLedgerTransactionId(), entries),
		).toThrow(UnbalancedTransactionError);
	});
});

describe("LedgerTransaction.reverse", () => {
	it("invierte la dirección de cada entry", () => {
		const original = LedgerTransaction.post(
			aLedgerTransactionId(),
			aBalancedEntryPair(),
		);

		const reversal = LedgerTransaction.reverse(
			aLedgerTransactionId(),
			original,
		);

		const originalDirections = original
			.getEntries()
			.map((entry) => entry.direction);
		const reversedDirections = reversal
			.getEntries()
			.map((entry) => entry.direction);
		expect(reversedDirections).toEqual(
			originalDirections.map((direction) =>
				direction === EntryDirection.Debit
					? EntryDirection.Credit
					: EntryDirection.Debit,
			),
		);
	});

	it("referencia la transacción original", () => {
		const original = LedgerTransaction.post(
			aLedgerTransactionId(),
			aBalancedEntryPair(),
		);

		const reversal = LedgerTransaction.reverse(
			aLedgerTransactionId(),
			original,
		);

		expect(reversal.getReversesTransactionId()).toBe(original.id);
	});

	it("emite TransactionReversed", () => {
		const original = LedgerTransaction.post(
			aLedgerTransactionId(),
			aBalancedEntryPair(),
		);
		const reversalId = aLedgerTransactionId();

		const reversal = LedgerTransaction.reverse(reversalId, original);

		expect(reversal.pullDomainEvents()).toEqual([
			new TransactionReversed(reversalId, original.id),
		]);
	});
});

describe("LedgerTransaction.getEntries", () => {
	it("devuelve una copia, no la referencia interna", () => {
		const transaction = LedgerTransaction.post(
			aLedgerTransactionId(),
			aBalancedEntryPair(),
		);

		transaction.getEntries().push(anEntry(EntryDirection.Debit));

		expect(transaction.getEntries()).toHaveLength(2);
	});
});
