import { EntryDirection } from "./ledger.enums";
import { InvalidEntryAmountError } from "./ledger.errors";
import { UniqueUUID, assertUuid } from "@core/common-domain/contexts/identifier.vos";
import { Money } from "@core/common-domain/contexts/money.vos";

export class LedgerTransactionId extends UniqueUUID {
  private constructor(value: string) {
    super(value);
  };

  static of(value: string): LedgerTransactionId {
    assertUuid(value, "LedgerTransactionId");
    return new LedgerTransactionId(value);
  };
};

export class AccountId extends UniqueUUID {
  private constructor(value: string) {
    super(value);
  };

  static of(value: string): AccountId {
    assertUuid(value, "AccountId");
    return new AccountId(value);
  };
};

export class Entry {
  private constructor(readonly accountId: AccountId, readonly amount: Money, readonly direction: EntryDirection) {};

  static of(accountId: AccountId, amount: Money, direction: EntryDirection): Entry {
    if (amount.amount === 0) throw new InvalidEntryAmountError();
    return new Entry(accountId, amount, direction);
  };
};
