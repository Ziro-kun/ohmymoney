# 🚀 Project Context & Agent Orchestration

## 1. Project Overview

- **Name**: ohmymoney
- **Description**: 단순한 가계부를 넘어, 사용자의 순자산과 고정 지출을 결합하여 초 단위로 변화하는 잔액(Real-time Ticker) 을 시각화합니다. 가만히 있어도 사라지는 유지비와 기회비용을 직관적으로 보여줌으로써 보다 건강한 금융 감각을 일깨워줍니다.
- **Status**: Development Phase

## 2. Technical Environment

- **OS**: macOS (M4 Air, 16GB)
- **Stack**: typescript, react-native, javascript, sqlite
- **Key Path**: All commands should be executed relative to the project root.

## 3. Virtual Agent Team (Centralized Roles)

본 프로젝트의 모든 작업은 `~/.agents/roles/` 폴더에 정의된 에이전트 페르소나를 따릅니다. 작업을 시작하기 전, 해당 역할의 `.md` 파일을 읽어 자신의 Identity와 모델 라우팅 정책을 확인하십시오.

- **PM**: `~/.agents/roles/product_manager.md` (Planning & Chunking)
- **Scrum Master**: `~/.agents/roles/scrum_master.md` (Formatting & Tracking)
- **Backend**: `~/.agents/roles/backend_dev.md` (Server & DB)
- **Frontend**: `~/.agents/roles/frontend_dev.md` (UI Logic & State)
- **Designer**: `~/.agents/roles/ui_ux_designer.md` (Style & UX)
- **QA**: `~/.agents/roles/qa_engineer.md` (Test & Security)

## 4. Orchestration Rules

1. **Flow**: 모든 워크플로우는 프로젝트 루트의 `orchestrate.md` 지침을 최우선으로 따릅니다.
2. **State Tracking**: 모든 진행 상황은 `./task.md`에 기록하며, `Scrum Master` 에이전트만 이 파일을 업데이트할 수 있습니다.
3. **Context Isolation**: 이전 대화 기록 전체에 의존하지 말고, `task.md`와 `implementation_plan.md`를 기반으로 '현재 태스크'에만 집중하십시오.
4. **Token Policy**:
   - Reasoning/Planning/QA: **Gemini Pro** (Tier 1)
   - Coding/Refactoring: **Gemini 3 Flash** (Fallback: 2.5 Flash)
   - Formatting/Status Update: **Gemini 3 Flash-Lite**

## 5. Coding Standards

- 기술적 세부 규칙은 `~/.agents/skills-guide/` 내부의 각 언어별 `SKILL.md`를 참조하십시오.
- 모든 답변은 한국어로 작성하되, 기술 용어는 원문을 유지하십시오.
