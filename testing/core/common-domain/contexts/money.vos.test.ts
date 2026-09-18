import {
	CurrencyMismatchError,
	InvalidMoneyError,
	Money,
} from "@core/common-domain";
import { describe, expect, it } from "vitest";

describe("Money.of", () => {
	it("crea un Money con un monto entero >= 0", () => {
		const money = Money.of(1000, "USD");

		expect(money.amount).toBe(1000);
		expect(money.currency).toBe("USD");
	});

	it("permite un monto de cero", () => {
		expect(() => Money.of(0, "USD")).not.toThrow();
	});

	it("rechaza un monto negativo", () => {
		expect(() => Money.of(-1, "USD")).toThrow(InvalidMoneyError);
	});

	it("rechaza un monto no entero", () => {
		expect(() => Money.of(10.5, "USD")).toThrow(InvalidMoneyError);
	});
});

describe("Money.equals", () => {
	it("es true cuando el monto y la moneda coinciden", () => {
		expect(Money.of(1000, "USD").equals(Money.of(1000, "USD"))).toBe(true);
	});

	it("es false cuando el monto difiere", () => {
		expect(Money.of(1000, "USD").equals(Money.of(500, "USD"))).toBe(false);
	});

	it("es false cuando la moneda difiere", () => {
		expect(Money.of(1000, "USD").equals(Money.of(1000, "EUR"))).toBe(false);
	});
});

describe("Money.isGreaterThan", () => {
	it("compara montos en la misma moneda", () => {
		expect(Money.of(1000, "USD").isGreaterThan(Money.of(500, "USD"))).toBe(
			true,
		);
		expect(Money.of(500, "USD").isGreaterThan(Money.of(1000, "USD"))).toBe(
			false,
		);
	});

	it("lanza CurrencyMismatchError entre monedas distintas", () => {
		expect(() =>
			Money.of(1000, "USD").isGreaterThan(Money.of(1000, "EUR")),
		).toThrow(CurrencyMismatchError);
	});
});

describe("Money.add", () => {
	it("suma montos en la misma moneda", () => {
		const result = Money.of(1000, "USD").add(Money.of(500, "USD"));

		expect(result.equals(Money.of(1500, "USD"))).toBe(true);
	});

	it("lanza CurrencyMismatchError entre monedas distintas", () => {
		expect(() => Money.of(1000, "USD").add(Money.of(500, "EUR"))).toThrow(
			CurrencyMismatchError,
		);
	});
});
