# Implementation Plan - Calendar Theme Synchronization Fix

## 1. Problem Description
- 사용자가 다크모드/라이트모드 전환 시 `@flow` 화면의 달력 테마가 즉시 업데이트되지 않음.
- 다른 화면을 갔다가 돌아오거나 새로고침해야 반영되는 현상 발생.
- `react-native-calendars` 컴포넌트가 `theme` prop의 변경을 항상 감지하지 못하는 고유한 동작 방식 때문.

## 2. Proposed Solution
- `Calendar` 컴포넌트에 `key` 속성을 추가하여 테마(`isDark`) 변경 시 컴포넌트를 강제로 리마운트(Re-mount)하도록 함.
- `key={isDark ? 'dark-calendar' : 'light-calendar'}` 패턴 적용.

## 3. Implementation Steps
1. `app/(tabs)/flow.tsx` 파일 내의 두 군데 `Calendar` 컴포넌트를 찾음.
   - 메인 화면의 접이식 달력 (Line 248)
   - 거래 추가/수정 모달 내의 날짜 선택 달력 (Line 523)
2. 각 `Calendar` 컴포넌트에 `key={isDark ? 'dark-calendar' : 'light-calendar'}` 속성 추가.
3. 테마 변경 시 달력이 즉시 리렌더링되는지 확인.

## 4. Risks & Considerations
- 리마운트 시 달력의 현재 펼쳐진 월(current month)이 유지되는지 확인 필요.
- 성능 영향은 미미함 (테마 전환 시에만 1회 발생).
