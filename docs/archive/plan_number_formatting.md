# Number Formatting Logic Plan (Archived)

## User Request
"화면 출력은 @app/(tabs)/index.tsx 에 소숫점한자리, 그 외에는 원단위 절사하는거 잊지 말고"

## Implementation Decision
1. `src/utils/format.ts`의 `formatNumber` 기본 정밀도(precision)를 `1 -> 0`으로 변경하여 전역적으로 "원단위 절사" 반영.
2. `index.tsx`의 Live Balance 표시부에서만 명시적으로 `.toFixed(1)`을 사용하여 소수점 한 자리 유지.
3. 정수 부분은 `formatNumber(value, 0)`으로 콤마 처리 후 소수점과 결합.
