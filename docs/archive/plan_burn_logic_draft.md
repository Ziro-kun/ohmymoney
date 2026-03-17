User Requirements:
1. "이자 계산의 원금 정의 수정 (Static -> Dynamic)":
Currently `depreciationBurn` uses `Number(asset.amount)` which is the static seed amount from the `assets` DB table. It SHOULD use the *running balance* (the amount after all transactions have been applied). In `loadData`, this is `depreciatedAssets` (which actually already contains the updated balances from `effectiveTxs`).
Let's check `loadData`:
... (생략된 내용 포함하여 보관)
최근 7일간의 변동 지출 평균을 '임시 번레이트'로 합산하는 옵션 반영 계획.
데이터 타입 정밀도: 원 단위 미만의 틱을 표현할 때 소수점 오차가 누적되면 순자산 총액이 실제와 달라질 수 있습니다. 모든 계산은 최소 단위(예: 0.001원)의 정수형 스케일링을 사용해야 합니다.
...
