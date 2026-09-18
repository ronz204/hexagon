import { assertUuid, UniqueUUID } from "@core/common-domain";

export class ExpenseRequestId extends UniqueUUID {
	private constructor(value: string) {
		super(value);
	}

	static of(value: string): ExpenseRequestId {
		assertUuid(value, "ExpenseRequestId");
		return new ExpenseRequestId(value);
	}
}

export class AccountId extends UniqueUUID {
	private constructor(value: string) {
		super(value);
	}

	static of(value: string): AccountId {
		assertUuid(value, "AccountId");
		return new AccountId(value);
	}
}
