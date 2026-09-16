import type { Money } from "@core/common-domain/contexts/money.vos";
import { EntryDirection } from "./ledger.enums";
import {
	MissingEntryDirectionError,
	UnbalancedTransactionError,
} from "./ledger.errors";
import { TransactionPosted, TransactionReversed } from "./ledger.events";
import { Entry, type LedgerTransactionId } from "./ledger.vos";

type DomainEvent = TransactionPosted | TransactionReversed;

function invert(direction: EntryDirection): EntryDirection {
	return direction === EntryDirection.Debit
		? EntryDirection.Credit
		: EntryDirection.Debit;
}

function sumByDirection(entries: Entry[], direction: EntryDirection): Money {
	const [first, ...rest] = entries.filter(
		(entry) => entry.direction === direction,
	);
	if (!first) throw new MissingEntryDirectionError(direction);
	return rest.reduce((total, entry) => total.add(entry.amount), first.amount);
}

function assertBalanced(entries: Entry[]): void {
	const debitTotal = sumByDirection(entries, EntryDirection.Debit);
	const creditTotal = sumByDirection(entries, EntryDirection.Credit);

	if (!debitTotal.equals(creditTotal)) throw new UnbalancedTransactionError();
}

export class LedgerTransaction {
	private readonly domainEvents: DomainEvent[] = [];

	private constructor(
		readonly id: LedgerTransactionId,
		private readonly entries: Entry[],
		private readonly reversesTransactionId: LedgerTransactionId | undefined,
		readonly postedAt: Date,
	) {}

	static post(id: LedgerTransactionId, entries: Entry[]): LedgerTransaction {
		assertBalanced(entries);
		const transaction = new LedgerTransaction(
			id,
			entries,
			undefined,
			new Date(),
		);
		transaction.domainEvents.push(new TransactionPosted(id, entries));
		return transaction;
	}

	static reverse(
		id: LedgerTransactionId,
		original: LedgerTransaction,
	): LedgerTransaction {
		const reversedEntries = original.entries.map((entry) =>
			Entry.of(entry.accountId, entry.amount, invert(entry.direction)),
		);
		assertBalanced(reversedEntries);
		const transaction = new LedgerTransaction(
			id,
			reversedEntries,
			original.id,
			new Date(),
		);
		transaction.domainEvents.push(new TransactionReversed(id, original.id));
		return transaction;
	}

	static reconstitute(
		id: LedgerTransactionId,
		entries: Entry[],
		reversesTransactionId: LedgerTransactionId | undefined,
		postedAt: Date,
	): LedgerTransaction {
		return new LedgerTransaction(id, entries, reversesTransactionId, postedAt);
	}

	getEntries(): Entry[] {
		return [...this.entries];
	}

	getReversesTransactionId(): LedgerTransactionId | undefined {
		return this.reversesTransactionId;
	}

	pullDomainEvents(): DomainEvent[] {
		return this.domainEvents.splice(0, this.domainEvents.length);
	}
}
