import { ApprovalLevel, ExpenseState } from "./expense.enums";

export class InvalidAmountError extends Error {
  constructor(cause?: unknown) {
    super(`el monto de la solicitud debe ser mayor a cero`, { cause });
    this.name = "InvalidAmountError";
  };
};

export class InvalidStateTransitionError extends Error {
  constructor(readonly from: ExpenseState, readonly attempted: string, cause?: unknown) {
    super(`no se puede "${attempted}" desde el estado "${from}"`, { cause });
    this.name = "InvalidStateTransitionError";
  };
};

export class MissingDestinationAccountsError extends Error {
  constructor(cause?: unknown) {
    super(`no se puede aprobar sin cuentas contables (debit/credit) asignadas`, { cause });
    this.name = "MissingDestinationAccountsError";
  };
};

export class DuplicateApprovalError extends Error {
  constructor(readonly level: ApprovalLevel, cause?: unknown) {
    super(`el nivel "${level}" ya aprobó esta solicitud`, { cause });
    this.name = "DuplicateApprovalError";
  };
};

export class OutOfOrderApprovalError extends Error {
  constructor(readonly attempted: ApprovalLevel, readonly required: ApprovalLevel, cause?: unknown) {
    super(`no se puede aprobar como "${attempted}" antes de que "${required}" apruebe`, { cause });
    this.name = "OutOfOrderApprovalError";
  };
};
