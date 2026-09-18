import { Money } from "@core/common-domain";
import {
	AccountId,
	Entry,
	type EntryDirection,
	type LedgerTransaction,
	LedgerTransactionId,
} from "@core/ledger-accounting";
import type {
	ledgerEntries,
	ledgerTransactions,
} from "@drizz/database/schemas/core.schema";

type LedgerTransactionRow = typeof ledgerTransactions.$inferSelect;
type LedgerEntryRow = typeof ledgerEntries.$inferSelect;

export const LedgerTransactionMapper = {
	toTransactionRow(transaction: LedgerTransaction) {
		return {
			id: transaction.id.value,
			reversesTransactionId: transaction.getReversesTransactionId()?.value,
			postedAt: transaction.postedAt,
		};
	},

	toEntryRows(transaction: LedgerTransaction) {
		return transaction.getEntries().map((entry) => ({
			transactionId: transaction.id.value,
			accountId: entry.accountId.value,
			amount: entry.amount.amount,
			currency: entry.amount.currency,
			direction: entry.direction,
		}));
	},

	toEntries(entryRows: LedgerEntryRow[]) {
		return entryRows.map((entryRow) =>
			Entry.of(
				AccountId.of(entryRow.accountId),
				Money.of(entryRow.amount, entryRow.currency),
				entryRow.direction as EntryDirection,
			),
		);
	},

	toReversesTransactionId(row: LedgerTransactionRow) {
		return row.reversesTransactionId
			? LedgerTransactionId.of(row.reversesTransactionId)
			: undefined;
	},
};
