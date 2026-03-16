User Requirements:
1. "이자 계산의 원금 정의 수정 (Static -> Dynamic)":
Currently `depreciationBurn` uses `Number(asset.amount)` which is the static seed amount from the `assets` DB table. It SHOULD use the *running balance* (the amount after all transactions have been applied). In `loadData`, this is `depreciatedAssets` (which actually already contains the updated balances from `effectiveTxs`).
Let's check `loadData`:
```ts
    const rawDailyBurnRate = calculateDailyBurn(expensesData, transactionsData, depreciatedAssets);
```
Wait, `depreciatedAssets` DOES contain the running balance! Let's verify how `depreciatedAssets` is calculated. It uses `updatedAssets` which is calculated by applying `effectiveTxs` to `assetsData`. So it IS using the running balance. Let me double check if `asset.amount` in `depreciatedAssets` is the current balance. Yes, it is. But wait... the user says "원금을 100만 원이라도 상환했을 때, 다음 틱(Tick)의 속도가 미세하게라도 느려지는 것을 시각적으로 즉시 확인하기 위함입니다."
Maybe the `transactionsData` passed to `calculateDailyBurn` is the whole array, but `calculateDailyBurn` uses `depreciatedAssets` which has the real-time balance. Wait, if it already uses `depreciatedAssets`, then any repayment *does* reduce the loan's balance, which reduces `depreciationBurn`. Is the user saying it doesn't update *in real time* without a reload?
"거래 내역(Transactions) 테이블에 삽입(CUD)이 발생할 때마다 perSecondBurnRate를 즉시 갱신하도록 요청하십시오."
Well, `addTransaction` calls `await get().loadData()`. `loadData` recalculates `rawDailyBurnRate` and calls `set({ perSecondBurnRate })`. So it DOES recalculate on CUD.

Why does the user feel it's not working?
Ah, "최근 7일간의 변동 지출 평균을 '임시 번레이트'로 합산하는 옵션" is the new requirement.
Also, "데이터 타입 정밀도: 원 단위 미만의 틱을 표현할 때 소수점 오차가 누적되면 순자산 총액이 실제와 달라질 수 있습니다. 모든 계산은 최소 단위(예: 0.001원)의 정수형 스케일링을 사용해야 합니다."
Right now `perSecondBurnRate` is a float. We should scale it.

Let's address the 3 requirements:
1. "이자 계산의 원금 정의 수정 (Static -> Dynamic)"
We need to make sure we use the running balance. We already pass `depreciatedAssets` to `calculateDailyBurn`, so `asset.amount` inside `calculateDailyBurn` is indeed the running balance. BUT wait! If we do `depreciatedAssets.reduce`, we are using the balance *as of today*. The user might mean something else, or maybe they just didn't realize it's already using `depreciatedAssets` because of the previous bug. Let's explicitly ensure it's doing what they want, and explicitly document it in the code.

2. "번레이트 재계산 트리거(Trigger) 설정"
Every time `addTransaction`, `updateTransaction`, `deleteTransaction` is called, it calls `loadData()`. `loadData` updates `perSecondBurnRate`. So this is already event-driven. We just need to make sure it's clear and maybe optimize it to not read from DB if possible? "계산은 메모리(State)에서 처리하고, 결과값만 UI에 바인딩하도록 하십시오."
Maybe the user means: we shouldn't `loadData` from SQLite every single tick? We don't. We only `loadData` on DB changes. On tick, we just do `liveBalance = lastRefValue - elapsed * perSecondBurnRate`.

Let's implement the integer scaling and 7-day variable expense average.

3. "최근 변동 지출의 '가중치' 반영 요청"
Add a 7-day rolling average of NON-FIXED expenses to the daily burn rate.
```ts
const today = new Date();
const sevenDaysAgo = new Date(today);
sevenDaysAgo.setDate(today.getDate() - 7);
const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

const recentVariableExpenses = transactions.filter(tx => 
  !tx.isFixed && 
  tx.type === "expense" && 
  tx.date >= sevenDaysAgoStr &&
  tx.date <= todayStr
);
const recentVariableBurn = recentVariableExpenses.reduce((sum, tx) => sum + Number(tx.amount), 0) / 7;
```

"데이터 타입 정밀도: 모든 계산은 최소 단위(예: 0.001원)의 정수형 스케일링을 사용해야 합니다."
This means instead of `0.2437885802469136`, we store `243` (milli-won) and divide by 1000 when displaying.
Actually, if we just multiply the float by 1000 and `Math.round()`, then we have an integer `perSecondBurnRate_milli`.
Then in the UI: `elapsed * (perSecondBurnRate_milli / 1000)`.

Let's refactor `calculateDailyBurn` to return a higher precision integer (e.g., milli-won per day? or just let the store handle it).
