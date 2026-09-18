import { Money } from "@core/common-domain";
import {
	AccountId,
	ExpenseRequest,
	ExpenseRequestId,
} from "@core/expense-approval";
import { aUuid } from "./uuid.fixtures";

export function anExpenseRequestId(): ExpenseRequestId {
	return ExpenseRequestId.of(aUuid());
}

export function anAccountId(): AccountId {
	return AccountId.of(aUuid());
}

export function anAmount(amount = 1000, currency = "USD"): Money {
	return Money.of(amount, currency);
}

export function aSubmittedExpenseRequest(
	amount: Money = anAmount(),
): ExpenseRequest {
	return ExpenseRequest.submit(anExpenseRequestId(), amount);
}

export function anExpenseRequestReadyForApproval(
	amount: Money = anAmount(),
): ExpenseRequest {
	const request = aSubmittedExpenseRequest(amount);
	request.moveToReview();
	request.assignAccounts(anAccountId(), anAccountId());
	return request;
}
