import {
	LedgerTransaction,
	type LedgerTransactionId,
	type LedgerTransactionRepository,
} from "@core/ledger-accounting";
import type { Database } from "@drizz/dal/drizzle.client";
import {
	ledgerEntries,
	ledgerTransactions,
} from "@drizz/database/schemas/core.schema";
import { eq } from "drizzle-orm";
import { LedgerTransactionMapper } from "./ledger-transaction.mapper";

export class DrizzleLedgerTransactionRepository
	implements LedgerTransactionRepository
{
	constructor(private readonly db: Database) {}

	async save(transaction: LedgerTransaction): Promise<void> {
		await this.db.transaction(async (tx) => {
			await tx
				.insert(ledgerTransactions)
				.values(LedgerTransactionMapper.toTransactionRow(transaction));

			await tx
				.insert(ledgerEntries)
				.values(LedgerTransactionMapper.toEntryRows(transaction));
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
			LedgerTransactionMapper.toEntries(entryRows),
			LedgerTransactionMapper.toReversesTransactionId(row),
			row.postedAt,
		);
	}
}
