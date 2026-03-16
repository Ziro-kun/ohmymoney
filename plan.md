We need to update the calculateDailyBurn function or the assets system to recalculate loan monthly burn rate automatically based on the loan's amount and interest rate. BUT `assets` table doesn't have `interestRate`.
We have `depreciationRate` which is technically just a generic rate. We could reuse `depreciationRate` as `interestRate` for loans, or add an `interestRate` column.

If we look at `addLoan` in `src/store/useFinanceStore.ts`:
```ts
addLoan: async (loanName, loanAmount, targetAssetId, monthlyPayment, payoutType) => {
```
It currently takes `monthlyPayment` and saves it as a Transaction (interest/repayment). It doesn't save the interest rate. So when the loan principal increases, the system doesn't know how to automatically increase the `monthlyPayment`.

Option 1: In `calculateDailyBurn`, just calculate a generic static interest for ALL loans? No, the user wants the burn rate to reflect the specific loan's cost.
Option 2: The user's prompt specifically mentions "전세자금 대출을 8천만원으로 늘리고 실시간 고정지출 비용을 보는데 초당 고정지출 비용이 0.3에서 더 올라가지 않아". The user expected the fixed cost to automatically go up when the loan amount went up.
To make it automatically scale, we should change the architecture of `calculateDailyBurn`:
Instead of JUST relying on fixed Transactions for loan interest, we should allow loans (liabilities) to have an `interestRate` in the `assets` table. Then `calculateDailyBurn` can automatically add `(asset.amount * asset.interestRate / 100) / 365` to the daily burn rate.

Let's check `src/store/useFinanceStore.ts` `calculateDailyBurn` again. We can add `interestRate` to `Asset` and use it. To avoid DB migration, we can reuse `depreciationRate` for `liability` as the interest rate. If `type === 'liability' && assetCategory === 'loan' && depreciationRate > 0`, we add it to the burn!

Let's check if `depreciationRate` exists on the Dummy data for Jeonse.
