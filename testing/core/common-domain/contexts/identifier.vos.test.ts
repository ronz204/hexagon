import { InvalidIdentifierError } from "@core/common-domain/contexts/identifier.errors";
import {
	assertUuid,
	UniqueUUID,
} from "@core/common-domain/contexts/identifier.vos";
import { aUuid } from "@tests/fixtures/uuid.fixtures";
import { describe, expect, it } from "vitest";

class TestId extends UniqueUUID {
	static of(value: string): TestId {
		assertUuid(value, "TestId");
		return new TestId(value);
	}
}

class OtherTestId extends UniqueUUID {
	static of(value: string): OtherTestId {
		assertUuid(value, "OtherTestId");
		return new OtherTestId(value);
	}
}

describe("assertUuid", () => {
	it("acepta un UUID válido", () => {
		expect(() => assertUuid(aUuid(), "TestId")).not.toThrow();
	});

	it("rechaza un valor con formato inválido", () => {
		expect(() => assertUuid("not-a-uuid", "TestId")).toThrow(
			InvalidIdentifierError,
		);
	});

	it("incluye el kind y el value en el error", () => {
		expect.assertions(3);
		try {
			assertUuid("not-a-uuid", "TestId");
		} catch (error) {
			expect(error).toBeInstanceOf(InvalidIdentifierError);
			expect((error as InvalidIdentifierError).kind).toBe("TestId");
			expect((error as InvalidIdentifierError).value).toBe("not-a-uuid");
		}
	});
});

describe("UniqueUUID.equals", () => {
	it("es true para el mismo tipo y el mismo value", () => {
		const value = aUuid();

		expect(TestId.of(value).equals(TestId.of(value))).toBe(true);
	});

	it("es false para el mismo tipo con distinto value", () => {
		expect(TestId.of(aUuid()).equals(TestId.of(aUuid()))).toBe(false);
	});

	it("es false entre tipos distintos aunque el value coincida", () => {
		const value = aUuid();

		expect(TestId.of(value).equals(OtherTestId.of(value))).toBe(false);
	});
});
