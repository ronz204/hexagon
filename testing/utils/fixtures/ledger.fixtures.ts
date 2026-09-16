import { Money } from "@core/common-domain/contexts/money.vos";
import { EntryDirection } from "@core/ledger-accounting/contexts/ledger.enums";
import {
	AccountId,
	Entry,
	LedgerTransactionId,
} from "@core/ledger-accounting/contexts/ledger.vos";
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
