import type { LedgerTransactionId } from "@core/ledger-accounting/contexts/ledger.vos";
import type { LedgerTransaction } from "@core/ledger-accounting/contexts/ledger.aggregate";

export interface LedgerTransactionRepository {
	save(transaction: LedgerTransaction): Promise<void>;
	findById(id: LedgerTransactionId): Promise<LedgerTransaction | undefined>;
}
