import { db } from "@drizz/dal/drizzle.ctx";
import { DrizzleDock } from "@drizz/dal/drizzle.dock";
import {
	ExpenseRequestRepositoryToken,
	LedgerTransactionRepositoryToken,
} from "@drizz/dal/drizzle.tokens";
import { Container } from "dockdi";

const container = new Container().load(DrizzleDock.build(db));

container.resolve(ExpenseRequestRepositoryToken);
container.resolve(LedgerTransactionRepositoryToken);

console.log("Hello via service!");
