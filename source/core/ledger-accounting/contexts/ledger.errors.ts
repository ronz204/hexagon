import { EntryDirection } from "./ledger.enums";

export class InvalidEntryAmountError extends Error {
  constructor(cause?: unknown) {
    super(`un entry debe tener un monto mayor a cero`, { cause });
    this.name = "InvalidEntryAmountError";
  };
};

export class MissingEntryDirectionError extends Error {
  constructor(readonly direction: EntryDirection, cause?: unknown) {
    super(`la transacción no tiene ningún entry "${direction}"`, { cause });
    this.name = "MissingEntryDirectionError";
  };
};

export class UnbalancedTransactionError extends Error {
  constructor(cause?: unknown) {
    super(`la suma de los entries "Debit" no coincide con la suma de los entries "Credit"`, { cause });
    this.name = "UnbalancedTransactionError";
  };
};
