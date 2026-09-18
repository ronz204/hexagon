import { Money } from "@core/common-domain";
import {
	AccountId,
	Entry,
	type EntryDirection,
	LedgerTransaction,
	LedgerTransactionId,
	type LedgerTransactionRepository,
} from "@core/ledger-accounting";
import {
	ledgerEntries,
	ledgerTransactions,
} from "@drizz/database/schemas/core.schema";
import { eq } from "drizzle-orm";
import type { Database } from "@drizz/dal/drizzle.ctx";

export class DrizzleLedgerTransactionRepository
	implements LedgerTransactionRepository
{
	constructor(private readonly db: Database) {}

	async save(transaction: LedgerTransaction): Promise<void> {
		await this.db.transaction(async (tx) => {
			await tx.insert(ledgerTransactions).values({
				id: transaction.id.value,
				reversesTransactionId: transaction.getReversesTransactionId()?.value,
				postedAt: transaction.postedAt,
			});

			await tx.insert(ledgerEntries).values(
				transaction.getEntries().map((entry) => ({
					transactionId: transaction.id.value,
					accountId: entry.accountId.value,
					amount: entry.amount.amount,
					currency: entry.amount.currency,
					direction: entry.direction,
				})),
			);
		});
	}

	async findById(
		id: LedgerTransactionId,
	): Promise<LedgerTransaction | undefined> {
		const [row] = await this.db
			.select()
			.from(ledgerTransactions)
			.where(eq(ledgerTransactions.id, id.value))
			.limit(1);
		if (!row) return undefined;

		const entryRows = await this.db
			.select()
			.from(ledgerEntries)
			.where(eq(ledgerEntries.transactionId, id.value));

		return LedgerTransaction.reconstitute(
			id,
			entryRows.map((entryRow) =>
				Entry.of(
					AccountId.of(entryRow.accountId),
					Money.of(entryRow.amount, entryRow.currency),
					entryRow.direction as EntryDirection,
				),
			),
			row.reversesTransactionId
				? LedgerTransactionId.of(row.reversesTransactionId)
				: undefined,
			row.postedAt,
		);
	}
}
