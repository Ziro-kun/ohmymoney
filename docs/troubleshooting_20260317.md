# 🐞 Troubleshooting Log - 2026-03-17

## 1. CSV 템플릿 저장 경로 이슈 (iOS/Web)
- **문제**: CSV 템플릿 받기 클릭 시 `저장 경로를 찾을 수 없습니다` 또는 `file.writeTextAsync is not a function` 에러 발생.
- **원인**: 
  - `expo-file-system`의 구버전/신버전 API 혼용 사용.
  - 플랫폼별(네이티브/웹) 파일 저장 방식의 차이를 단일 함수에서 처리하려다 보니 타입 에러 및 경로 누락 발생.
- **해결**: 
  - `FileHelper.ts`를 생성하여 플랫폼별 분기 로직을 완전히 격리.
  - 웹은 `Blob`과 `URL.createObjectURL`을 사용한 다운로드 방식을, 네이티브는 `expo-file-system/legacy`와 `expo-sharing`을 조합한 공유 방식을 적용하여 해결.

## 2. CSV 파싱 데이터 밀림 현상 (Delimiter Conflict)
- **문제**: 거래 내역 설명(Description) 필드에 쉼표(`,`)가 포함된 경우, CSV 파싱 시 컬럼이 밀리는 현상 발생.
- **원인**: 단순히 `split(",")`을 사용하여 파싱을 처리했기 때문.
- **해결**: `DataParser.ts` 내부에 정규표현식(`CSV_REGEX`)을 도입하여 큰따옴표(`"`)로 감싸진 필드 내부의 쉼표는 무시하고 올바르게 분리하도록 파싱 엔진 고도화.

## 3. DataService 비대화 및 순환 참조 위험
- **문제**: `DataService`가 DB 쿼리, 파일 IO, UI 알림(Alert)까지 모두 담당하게 되면서 코드가 복잡해지고 유지보수가 어려워짐.
- **원인**: 관심사 분리(Separation of Concerns) 부족.
- **해결**: 
  - **계층 분리**: DB(Repository), IO(Helper), Logic(Service), UI(Screen)로 역할을 명확히 구분.
  - **UI 로직 추출**: `DataService` 내부에 있던 `Alert` 호출을 제거하고 `SettingsScreen.tsx`로 위임하여 서비스 레이어의 순수성 확보.

## 4. 데이터 전체 복원 후 상태 미갱신 이슈
- **문제**: JSON 파일을 통해 전체 복원을 완료했음에도 불구하고, 화면상의 자산 총액이나 내역이 즉시 바뀌지 않음.
- **원인**: DB는 복원되었으나 Zustand 스토어의 `loadData`가 호출되지 않아 이전 상태를 유지하고 있었음.
- **해결**: `SettingsScreen.tsx`에서 복원 성공 시 즉시 `loadData()`를 호출하도록 로직을 보강하여 데이터 동기화 보장.

## 5. 테마 변경 시 다크 모드 토글 동기화 오류
- **문제**: '시스템 설정 사용' 모드일 때 토글 스위치가 현재 실제 테마 상태(다크/라이트)를 정확히 반영하지 못하는 시각적 버그.
- **해결**: 
  - 스토어의 `override` 상태와 실제 시스템/사용자 정의 테마를 구분.
  - 설정 화면의 UI를 토글(Switch) 대신 3-Way 세그먼트 버튼(`Light` | `Dark` | `System`) 형태로 개편하여 사용자의 의도와 앱의 상태를 명확히 일치시킴.
