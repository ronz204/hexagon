import type { Entry, LedgerTransactionId } from "./ledger.vos";

export class TransactionPosted {
	constructor(
		readonly transactionId: LedgerTransactionId,
		readonly entries: Entry[],
	) {}
}

export class TransactionReversed {
	constructor(
		readonly transactionId: LedgerTransactionId,
		readonly reversesTransactionId: LedgerTransactionId,
	) {}
}
