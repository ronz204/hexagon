import { randomUUID } from "node:crypto";

export function aUuid(): string {
	return randomUUID();
}
