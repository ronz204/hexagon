import { db } from "@drizz/dal/drizzle.client";
import {
	DrizzleDock,
	ExpenseRequestRepositoryToken,
	LedgerTransactionRepositoryToken,
} from "@drizz/dal/drizzle.dock";
import { Container } from "dockdi";

const container = new Container().load(DrizzleDock.build(db));

container.resolve(ExpenseRequestRepositoryToken);
container.resolve(LedgerTransactionRepositoryToken);

console.log("Hello via worker!");
