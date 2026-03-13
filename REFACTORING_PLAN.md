# ohmymoney 리팩토링 플랜

> 작성일: 2026-03-13 | 현재 브랜치: master

## 프로젝트 개요

Expo + React Native 기반 개인 재무 앱. 실시간으로 순자산이 줄어드는 "번 레이트(Burn Rate)"를 시각화.

| 항목 | 내용 |
|------|------|
| 라우팅 | Expo Router (파일 기반) |
| 상태 관리 | Zustand 5.0.11 |
| DB | expo-sqlite 16.0.10 |
| 애니메이션 | react-native-reanimated 4.1.1 |
| ML (미통합) | react-native-fast-tflite 2.0.0 |

---

## P0 — 기능 결함 (즉시 영향)

### 1. TFLite 미통합
- **문제**: `react-native-fast-tflite` 설치됨, `src/assets/models/strategy.tflite` 존재하나 실제 추론 코드 없음
- **현황**: AI 전략 제안이 `index.tsx` 내 하드코딩 배열 + 조건문으로 동작
- **선택지**:
  - (A) `react-native-fast-tflite`로 실제 추론 구현
  - (B) 의존성 + 모델 파일 제거 후 룰 기반 유지
- **관련 파일**: `index.tsx`, `package.json`, `generate_model.py`, `src/assets/models/strategy.tflite`

### 2. 백그라운드 드리프트
- **문제**: 대시보드가 `setInterval` 기반으로 잔액 갱신 → 앱 백그라운드 전환 후 복귀 시 계산 불일치 가능
- **현황**: `index.tsx`의 `useEffect` 내 interval 로직
- **수정안**: `Date.now()` 기반 경과 시간 계산으로 교체 (이미 부분 적용됨, interval 제거 후 `AppState` 리스너 추가)
- **관련 파일**: `app/(tabs)/index.tsx`

---

## P1 — 코드 품질 (유지보수)

### 3. 불필요한 의존성
- **문제**: `file-loader` (Webpack 전용, Expo에 불필요), `react-native-worklets` (미사용)
- **수정**: `package.json`에서 제거 후 `npm install`
- **관련 파일**: `package.json`

### 4. 타입 안전성 부족
- **문제**: `explore.tsx:254` — `setExpenseFreq(f.value as any)` 등 암묵적 캐스트 다수
- **수정**: 명시적 유니온 타입 인터페이스로 교체
- **관련 파일**: `app/(tabs)/explore.tsx`, `src/store/useFinanceStore.ts`

### 5. 상수 하드코딩
- **문제**: `DAYS_IN_MONTH = 30.44`, `DAYS_IN_YEAR = 365.25`, 연이율 `0.05` 등이 파일 내 인라인 분산
- **수정**: `constants/finance.ts` 파일로 이동
- **관련 파일**: `app/(tabs)/index.tsx`, `src/store/useFinanceStore.ts`

### 6. 파일명 불일치
- **문제**: `explore.tsx`의 실제 탭 라벨이 "설정"인데 파일명은 `explore`
- **수정**: `explore.tsx` → `settings.tsx` 리네임 + `_layout.tsx` 참조 수정
- **관련 파일**: `app/(tabs)/explore.tsx`, `app/(tabs)/_layout.tsx`

---

## P2 — 에러 처리 및 성능

### 7. DB 에러 처리 없음
- **문제**: `src/db/sqlite.ts` 쿼리 실패 시 silent fail
- **수정**: try-catch 래핑 + 에러 상태 반환, 사용자 피드백 추가
- **관련 파일**: `src/db/sqlite.ts`, `src/store/useFinanceStore.ts`

### 8. `loadData()` 전체 재조회 비효율
- **문제**: 자산/지출 추가·삭제 시마다 전체 DB 재조회
- **수정**: 낙관적 업데이트(optimistic update) 또는 store에서 직접 배열 조작
- **관련 파일**: `src/store/useFinanceStore.ts`

### 9. 입력 유효성 검사 미흡
- **문제**: 음수 금액, 빈 이름 등 미검증 상태로 DB 저장 가능
- **수정**: `handleAddAsset`, `handleAddExpense` 내 검증 로직 보강
- **관련 파일**: `app/(tabs)/explore.tsx`

---

## P3 — 기능 확장 (장기)

| # | 항목 | 설명 |
|---|------|------|
| 10 | 앱 재시작 시 기준점 유실 | 마지막 기준 시각/잔액을 AsyncStorage 또는 SQLite에 저장 |
| 11 | 시각화 없음 | 탭 아이콘이 `pie-chart`인데 실제 차트 미구현 (예: Victory Native, Skia) |
| 12 | 알림/백그라운드 처리 | 예산 초과 시 Expo Notifications 활용 |
| 13 | 데이터 백업/내보내기 | CSV 또는 JSON 내보내기 기능 |

---

## 작업 우선순위 요약

```
즉시: P0 (TFLite 방향 결정 → P1-3 의존성 정리)
단기: P1 (타입 안전성, 상수 분리, 파일명)
중기: P2 (에러 처리, 성능 최적화, 유효성 검사)
장기: P3 (기능 확장)
```
