# 📋 Task List: 통계 시각화 고도화 (원그래프 & 다중 색상 막대)

## 1. 데이터 분석 레이어 확장 (Backend)
- [x] `AnalysisService.ts`: `getTrendData`를 확장하여 월별 카테고리별 지출 데이터 반환하도록 수정

## 2. 시각화 컴포넌트 개발 (UI/UX)
- [x] `PieChart`: 커스텀 View 기반의 파이 그래프 컴포넌트 구현 (기존 DonutChart 교체)
- [x] `StackedTrendChart`: 월별 지출 추이를 다중 색상(Stacked) 막대로 구현

## 3. 화면 연동 및 폴리싱 (Frontend)
- [x] `stats.tsx`: 기존 가로 막대 그래프를 파이 그래프로 교체
- [x] `stats.tsx`: 추이 그래프에 다중 색상 적용 및 범례(Legend) 추가
- [x] 디자인 디테일 및 테마 대응 확인
