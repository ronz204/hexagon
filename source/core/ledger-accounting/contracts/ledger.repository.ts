import type { LedgerTransaction } from "../contexts/ledger.aggregate";
import type { LedgerTransactionId } from "../contexts/ledger.vos";

export interface LedgerTransactionRepository {
	save(transaction: LedgerTransaction): Promise<void>;
	findById(id: LedgerTransactionId): Promise<LedgerTransaction | undefined>;
}
