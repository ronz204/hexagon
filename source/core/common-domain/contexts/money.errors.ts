export class InvalidMoneyError extends Error {
  constructor(readonly amount: number, cause?: unknown) {
    super(`"${amount}" no es un monto válido: debe ser un entero mayor o igual a cero`, { cause });
    this.name = "InvalidMoneyError";
  };
};

export class CurrencyMismatchError extends Error {
  constructor(readonly left: string, readonly right: string, cause?: unknown) {
    super(`no se puede operar entre monedas distintas: "${left}" y "${right}"`, { cause });
    this.name = "CurrencyMismatchError";
  };
};
