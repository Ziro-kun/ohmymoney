# 🏗 Implementation Plan: Statistics & Visualization Package

## 1. 개요
사용자의 소비 패턴을 직관적으로 이해할 수 있도록 `Statistics` 탭을 추가하고, 카테고리별 지출 비중과 자산 추이를 시각화합니다.

## 2. 상세 설계

### 2.1 데이터 아키텍처 (Backend)
- **Service**: `src/services/AnalysisService.ts`
  - `getCategoryStats(period: 'weekly' | 'monthly' | 'yearly')`: 각 카테고리별 총합 및 비율 반환.
  - `getTrendData(period: 'monthly' | 'yearly')`: 시간 흐름에 따른 순자산 및 번레이트 데이터 포인트 생성.
- **DB Query**: SQLite의 `transactions` 테이블을 `date` 필드 기준으로 그룹화하여 집계.

### 2.2 UI/UX 디자인 (UI/UX)
- **Layout**:
  - 상단: 기간 필터 (Segmented Control / Tabs)
  - 중앙 1: "어디에 가장 많이 썼나요?" (Pie Chart / Bar Chart)
  - 중앙 2: "자산은 어떻게 변하고 있나요?" (Line Chart)
  - 하단: 상위 5개 카테고리 리스트 (Icon, Category Name, Amount, Percentage)
- **Theme**: `useFinanceStore`의 테마 설정을 따르며, 차트 라이브러리에 테마 색상 주입.

### 2.3 프론트엔드 구현 (Frontend)
- **Component**: `app/(tabs)/stats.tsx`
- **Charting**: `react-native-chart-kit` 활용 (또는 경량화된 SVG 기반 차트).
- **State Management**: `useFinanceStore`에서 트랜잭션 데이터를 가져와 `AnalysisService`로 가공하여 로컬 상태로 관리.

## 3. 리스크 및 고려사항
- **성능**: 트랜잭션 데이터가 많아질 경우 집계 속도 저하 우려 -> 메모이제이션(useMemo) 및 효율적인 SQL 쿼리 사용.
- **라이브러리**: `react-native-chart-kit` 의존성 확인 및 폰트/레이아웃 호환성 체크.

## 4. 완료 조건
- [ ] 통계 탭이 하단 탭 메뉴에 정상 노출됨.
- [ ] 기간 필터 변경 시 차트와 리스트가 즉시 업데이트됨.
- [ ] 소비 패턴과 자산 추이가 시각적으로 명확하게 표현됨.
