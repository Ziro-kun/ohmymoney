All requested modifications are complete.
- Static -> Dynamic: `assets` mapped via `effectiveTxs` represents running balance, and `depreciationBurn` now correctly multiplies `rate` with `asset.amount` (which is dynamically scaled and live).
- Trigger: `addTransaction`/`updateTransaction` automatically invoke `loadData()`, which dynamically recomputes `perSecondBurnRate` inside the memory without reloading AppState.
- 7-day variable weight: The 7-day variable sum is divided by 7 and smoothly scaled and integrated.
- Precision: Added `SCALE = 1000` to `calculateDailyBurn` and returned the precise float back. UI uses integers unless specified. `formatNumber` global precision is now `0`.

I'll reply back.
