# 상세 트러블슈팅 로그 (Expanded Troubleshooting Log) - 20260313

## 1. Android 특정 데이터 렌더링 크래시

- **증상**: 가계부 내역 화면 진입 시 Android 기기에서만 `Text strings must be rendered within a <Text> component` 오류와 함께 앱 종료
- **원인 분석**:
  - `flow.tsx`의 JSX 코드 중 `{tx.isFixed && <Ionicons ... />}` 패턴이 문제
  - JavaScript의 논리 연산자 `&&`는 좌항이 `false`일 때 숫자 `0`이나 `false` 자체를 반환할 수 있는데, React Native Android 엔진은 이를 렌더링 가능한 컴포넌트가 아닌 '부적절한 텍스트'로 간주하여 에러를 발생시킴
- **해결책**:
  - 삼항 연산자를 사용하여 `{tx.isFixed ? <Ionicons ... /> : null}` 패턴으로 변경. 명시적으로 `null`을 반환함으로써 Android 렌더러의 혼선을 원천 차단함

## 2. SQLite 마이그레이션 실패 및 NullPointerException (Android)

- **증상**: 기존 데이터가 있는 상태에서 앱 업데이트 시 `isFixed` 컬럼 추가 쿼리가 실패하며 크래시 발생.
- **원인 분석**: `ALTER TABLE` 쿼리가 컬럼이 이미 존재할 경우 예외를 발생시키는데, 이를 적절히 잡아주지 못함
- **해결책**:
  - `PRAGMA table_info(transactions)` 명령어를 통해 컬럼 존재 여부를 먼저 확인하는 선행 체크 로직 도입
  - 컬럼이 없을 때만 `ALTER TABLE`을 수행하도록 방어 코드를 작성하여 DB 마이그레이션 안정성 확보

## 3. 고정 지출 저장 및 상태 동기화 누락

- **문제**: 가계부 수정 시 고정 지출 여부를 변경해도 저장되지 않음
- **원인 분석**:
  - `src/db/sqlite.ts`의 `updateTransaction` 함수 파라미터 리스트에서 `$isFixed`가 누락됨
  - `useFinanceStore.ts` 액션에서도 UI 상태값이 DB 쿼리 파라미터까지 전달되지 않는 파이프라인 단절 확인
- **해결책**:
  - DB 레이어(`sqlite.ts`)의 모든 CRUD 함수 시그니처를 업데이트하여 `isFixed` 필드를 포함함
  - 스토어 액션에서 `calculateDailyBurn`을 호출할 때 최신 `transactions` 배열을 넘겨주어 잔액 수치가 즉시 갱신되도록 수평적 업데이트 보장

## 4. 포매팅 시스템 도입 후 번 레이트 10배 폭주 (Critical Issue)

- **증상**: 천 단위 쉼표 기능을 넣은 직후, 하루 지출이 3.4만원에서 34만원으로 솟구침
- **원인 분석**:
  - `formatNumber` 유틸리티의 초기 구현체에서 `replace(/[^\d]/g, '')` 정규표현식을 사용함
  - 이 정규표현식이 숫자 이외의 모든 문자 중 소수점(`.`)까지 삭제해버려 `0.4` KRW가 `4` KRW로 변질됨
- **해결책**:
  - 소수점 분리 로직 도입: 문자열을 `.` 기준으로 `split`한 뒤, 정수 부분에만 쉼표를 찍고 소수점 아래는 그대로 붙여주도록 유틸리티 함수 전면 수정
  - `Intl.NumberFormat` 표준 API와 수동 보정 로직을 결합하여 음수 기호(-)와 소수점 보존 안정성 강화

## 5. 입력 필드(TextInput) 포매팅 지연 및 누락

- **증상**: 자산 수정 모달을 열었을 때 초기값에 쉼표가 없거나, 입력 중 쉼표가 실시간으로 보이지 않음
- **원인 분석**: `TextInput`의 `onChangeText`에서만 상태를 바꿨을 뿐, 렌더링 시 `value` 속성에 포맷팅된 값을 강제 바인딩하지 않음
- **해결책**:
  - `value={formatNumber(amount)}`와 같이 렌더링 레이어에서 포맷을 강제 적용
  - `unformatNumber`를 통해 상태에는 순수 숫자만 관리하되, 사용자에게는 항상 쉼표가 포함된 포맷을 보여주도록 데이터 흐름(Data Flow) 명확화
