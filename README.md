# 텅-장 시뮬레이터: Tung-sim Live (텅-심 라이브) 💸

> **"당신의 지갑이 텅 비어가는 과정을 확인해보세요"** — 실시간으로 흐르는 내 돈의 속도를 체감하고 스마트하게 자산을 관리하는 리얼타임 텅-장 추적기입니다.

Tung-sim Live는 단순한 가계부를 넘어, 사용자의 순자산과 고정 지출을 결합하여 **초 단위로 변화하는 잔액(Real-time Ticker)** 을 시각화합니다. 가만히 있어도 사라지는 유지비와 기회비용을 직관적으로 보여줌으로써 보다 건강한 금융 감각을 일깨워줍니다.

## 📸 스크린샷 (Screenshots)

<p align="center">
  <img src="./screenshot/Simulator%20Screenshot%20-%20iPhone%2017%20-%202026-03-14%20at%2017.26.56.png" width="200" alt="로딩 화면" />
  <img src="./screenshot/Simulator%20Screenshot%20-%20iPhone%2017%20-%202026-03-14%20at%2017.26.17.png" width="200" alt="번레이트 강조" />
  <img src="./screenshot/Simulator%20Screenshot%20-%20iPhone%2017%20-%202026-03-14%20at%2017.26.25.png" width="200" alt="순자산 강조" />
  <img src="./screenshot/Simulator%20Screenshot%20-%20iPhone%2017%20-%202026-03-14%20at%2017.33.05.png" width="200" alt="가계부 달력" />
</p>

---

## 🚀 주요 기능 (Core Features)

- **✨ 실시간 텅-심(心) 티커**: 설정된 번 레이트(Burn Rate)에 따라 순자산이 실시간으로 줄어드는(또는 늘어나는) 모습을 시각화합니다.
- **↕️ 동적 교차 애니메이션**: 대시보드에서 위아래 스와이프 시 **순자산**과 **번 레이트** 카드가 서로 자리를 바꾸며 교차하는 다이나믹한 인터랙션을 제공합니다.
- **📅 접이식 스마트 달력 (Flow)**: 가계부 상단의 달력을 접었다 펼치며 날짜별 수입/지출 내역을 시각적 점(Dot)으로 한눈에 파악할 수 있습니다.
- **🚘 자산 취득 마법사**: 자동차, 부동산 등 고가 자산 구매 시 선수금 지불, 대출 생성, 매월 할부금 등록을 원클릭 매크로로 처리합니다.
- **📉 감가상각 엔진**: 자동차 등 가치가 하락하는 자산에 대해 연간 감가상각률을 적용하여, 실시간 순자산에 가치 하락분을 자동으로 반영합니다.
- **💳 대출 및 부채 관리 마법사**:
  - **직접 지급 대응**: 학자금 대출처럼 내 계좌를 거치지 않고 바로 지급되는 부채도 정확히 기록합니다.
  - **중도 상환**: 상환 수수료를 포함한 중도 상환 트랜잭션을 처리합니다.
  - **대환 대출**: 기존 대출을 정산하고 새로운 대출로 갈아타는 복잡한 과정을 자동화합니다.
- **🤖 AI 흑자 전환 플랜**: 현재 자산 상황을 분석하여 30일 이내에 재무 건강을 회복하기 위한 맞춤형 전략을 제공합니다.

## 🛠 기술 스택 (Tech Stack)

- **Framework**: [Expo](https://expo.dev/) (SDK 54) / [React Native](https://reactnative.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Database**: [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (Offline-First)
- **Animation**: [React Native Reanimated](https://docs.expo.dev/versions/latest/sdk/reanimated/)
- **Styling**: Vanilla React Native StyleSheet with Canvas-like optimization

## 🏃 시작하기 (Getting Started)

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
# 또는
npx expo start
```

---

## 📂 프로젝트 구조 (Project Structure)

- `app/(tabs)/`: 메인 기능 화면 (Dashboard, Flow, Stock, Settings)
- `src/store/`: Zustand 기반 실시간 계산 엔진 및 상태 관리
- `src/db/`: SQLite 테이블 스키마 및 마이그레이션 로직
- `constants/`: 금융 계산 상수 및 테마 토큰

---

## 📄 라이선스

이 프로젝트는 개인 학습 및 자산 관리 인사이트 제공을 목적으로 제작되었습니다.
