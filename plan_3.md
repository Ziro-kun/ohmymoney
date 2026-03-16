Wait, let's review:
User: "화면 출력은 @app/(tabs)/index.tsx 에 소숫점한자리, 그 외에는 원단위 절사하는거 잊지 말고"
This means:
1. `index.tsx` (the dashboard) displays live balance and burn rates.
`liveBalanceStr = liveBalance.toFixed(1);` is already 1 decimal.
`rateStr = rate.toFixed(1);` is already 1 decimal.
`dailyBurnRate` in the stats card: I just changed it to `Math.floor` with 0 decimals. Wait, the user said `@app/(tabs)/index.tsx 에 소숫점한자리`, meaning *everything* in `index.tsx` should be 1 decimal? Or maybe the main display is 1 decimal, but other places (like `flow.tsx` or `stock.tsx`) should be integers?
Let's look at `index.tsx`'s AI Card.
```ts
const formattedRequiredDaily = formatNumber(Math.round(requiredDailyWithCompound));
```
It uses `Math.round()` which removes decimals. `formatNumber` without precision argument defaults to `1` in `src/utils/format.ts`. Let's check `formatNumber` default in `src/utils/format.ts`: `precision: number = 1`. If `precision = 1`, it will show `.0` even if rounded. We should ensure integer displays use `precision = 0`.

Actually, in `format.ts`:
```ts
export const formatNumber = (
  val: string | number,
  precision: number = 1,
) => { ... }
```
If we want "그 외에는 원단위 절사", it means the default `precision` should maybe be 0? But `index.tsx` has live balances using their own `.split(".")` logic, and `formatNumber` is used for the integer part.
```ts
const integerPart = formatNumber(parts[0]).split(".")[0];
```
This is hacky because `formatNumber` adds `.0` by default.

Let's fix `formatNumber` to default to `0` precision!
If `format.ts` defaults to 0, it perfectly satisfies "그 외에는 원단위 절사".
Then in `index.tsx`, the live balance integer part uses `formatNumber(parts[0], 0)`.
And `index.tsx` manually adds the decimal part: `.{decimalPart}`.
This perfectly separates the responsibilities.

Let's check `src/utils/format.ts` and modify it.
