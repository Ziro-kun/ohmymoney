# 텅-장 시뮬레이터: Tung-sim Live (텅-심 라이브) 💸

> **"지갑의 심박수를 느껴라"** — 실시간으로 흐르는 내 돈의 속도를 체감하고 스마트하게 자산을 관리하는 리얼타임 텅-장 추적기입니다.

Tung-sim Live는 단순한 가계부를 넘어, 사용자의 순자산과 고정 지출을 결합하여 **초 단위로 변화하는 잔액(Real-time Ticker)** 을 시각화합니다. 가만히 있어도 사라지는 유지비와 기회비용을 직관적으로 보여줌으로써 보다 건강한 금융 감각을 일깨워줍니다.

## 📸 스크린샷 (Screenshots)

<p align="center">
  <img src="./screenshot/Simulator%20Screenshot%20-%20iPhone%2017%20-%202026-03-13%20at%2023.35.06.png" width="18%">
  <img src="./screenshot/Simulator%20Screenshot%20-%20iPhone%2017%20-%202026-03-13%20at%2023.35.50.png" width="18%">
  <img src="./screenshot/Simulator%20Screenshot%20-%20iPhone%2017%20-%202026-03-13%20at%2023.39.24.png" width="18%">
  <img src="./screenshot/Simulator%20Screenshot%20-%20iPhone%2017%20-%202026-03-13%20at%2023.39.28.png" width="18%">
  <img src="./screenshot/Simulator%20Screenshot%20-%20iPhone%2017%20-%202026-03-13%20at%2023.39.32.png" width="18%">
</p>
<p align="center">
  <img src="./screenshot/Simulator%20Screenshot%20-%20iPhone%2017%20-%202026-03-13%20at%2023.39.39.png" width="18%">
  <img src="./screenshot/Simulator%20Screenshot%20-%20iPhone%2017%20-%202026-03-13%20at%2023.39.58.png" width="18%">
  <img src="./screenshot/Simulator%20Screenshot%20-%20iPhone%2017%20-%202026-03-13%20at%2023.40.00.png" width="18%">
  <img src="./screenshot/Simulator%20Screenshot%20-%20iPhone%2017%20-%202026-03-13%20at%2023.40.02.png" width="18%">
  <img src="./screenshot/Simulator%20Screenshot%20-%20iPhone%2017%20-%202026-03-13%20at%2023.40.04.png" width="18%">
</p>
<p align="center">
  <img src="./screenshot/Simulator%20Screenshot%20-%20iPhone%2017%20-%202026-03-13%20at%2023.40.09.png" width="18%">
  <img src="./screenshot/Simulator%20Screenshot%20-%20iPhone%2017%20-%202026-03-13%20at%2023.40.11.png" width="18%">
  <img src="./screenshot/Simulator%20Screenshot%20-%20iPhone%2017%20-%202026-03-13%20at%2023.40.13.png" width="18%">
  <img src="./screenshot/Simulator%20Screenshot%20-%20iPhone%2017%20-%202026-03-13%20at%2023.40.15.png" width="18%">
  <img src="./screenshot/Simulator%20Screenshot%20-%20iPhone%2017%20-%202026-03-13%20at%2023.48.59.png" width="18%">
</p>

---

## 🚀 주요 기능 (Core Features)

- **✨ 실시간 텅-심(心) 티커**: 설정된 번 레이트(Burn Rate)에 따라 순자산이 실시간으로 줄어드는(또는 늘어나는) 모습을 60fps 애니메이션으로 시각화합니다.
- **↕️ 수직 스와이프 강조 모드**: 화면을 위아래로 스와이프하여 **하루 유지비(Burn Focus)** 와 **현재 잔액(Balance Focus)** 중 원하는 정보를 강조하여 볼 수 있습니다.
- **📖 스마트 가계부 (Flow)**: 수입, 지출, 이체를 간편하게 기록하고, 특정 지출을 '고정 지출'로 설정하여 번 레이트에 즉시 반영할 수 있습니다.
- **🏦 자산 및 부채 관리 (Stock)**: 보유한 자산과 부채를 통합 관리하며, 수정 및 삭제 시 실시간으로 전체 순자산에 연동됩니다.
- **🤖 AI 흑자 전환 플랜**: 현재 자산 상황을 분석하여 30일 이내에 재무 건강을 회복하기 위한 맞춤형 전략과 기회비용 분석을 제공합니다.
- **🛡️ 플랫폼 안정성**: Android 환경에서의 SQLite 초기화 오류 및 레이아웃 크래시를 완벽히 해결하여 모든 기기에서 매끄러운 경험을 제공합니다.

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
展开
