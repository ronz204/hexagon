import { CurrencyMismatchError, InvalidMoneyError } from "./money.errors";

function assertValidAmount(amount: number): void {
	if (!Number.isInteger(amount) || amount < 0)
		throw new InvalidMoneyError(amount);
}

export class Money {
	private constructor(
		readonly amount: number,
		readonly currency: string,
	) {}

	static of(amount: number, currency: string): Money {
		assertValidAmount(amount);
		return new Money(amount, currency);
	}

	private assertSameCurrency(other: Money): void {
		if (this.currency !== other.currency)
			throw new CurrencyMismatchError(this.currency, other.currency);
	}

	equals(other: Money): boolean {
		return this.amount === other.amount && this.currency === other.currency;
	}

	isGreaterThan(other: Money): boolean {
		this.assertSameCurrency(other);
		return this.amount > other.amount;
	}

	add(other: Money): Money {
		this.assertSameCurrency(other);
		return Money.of(this.amount + other.amount, this.currency);
	}
}
