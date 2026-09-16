export class InvalidIdentifierError extends Error {
  constructor(readonly kind: string, readonly value: string, cause?: unknown) {
    super(`"${value}" no es un ${kind} válido`, { cause });
    this.name = "InvalidIdentifierError";
  };
};