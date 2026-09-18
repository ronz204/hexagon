import { Money } from "@core/common-domain";
import {
	AccountId,
	Entry,
	EntryDirection,
	LedgerTransactionId,
} from "@core/ledger-accounting";
import { aUuid } from "./uuid.fixtures";

export function aLedgerTransactionId(): LedgerTransactionId {
	return LedgerTransactionId.of(aUuid());
}

export function aLedgerAccountId(): AccountId {
	return AccountId.of(aUuid());
}

export function anEntry(
	direction: EntryDirection,
	amount: Money = Money.of(1000, "USD"),
	accountId: AccountId = aLedgerAccountId(),
): Entry {
	return Entry.of(accountId, amount, direction);
}

export function aBalancedEntryPair(
	amount: Money = Money.of(1000, "USD"),
): Entry[] {
	return [
		anEntry(EntryDirection.Debit, amount),
		anEntry(EntryDirection.Credit, amount),
	];
}
