---
description: 멀티 에이전트 오케스트레이션 자동 구동 워크플로우
---

# 오케스트레이션 (Orchestration) 개요

이 워크플로우는 사용자의 추상적인 지시를 **[기획(PM) -> 문서화(Scrum Master) -> 백엔드 -> UI/UX -> 프론트엔드 -> QA -> 완료 및 형상관리]** 의 각 역할별 에이전트가 자율적으로 넘겨받아 최종 결과물을 내놓게 하는 릴레이 명령 지침입니다.

### 🚨 핵심 원칙: 상태 기반 핸드오프 (Token Optimization)

TPM(Tokens Per Minute) 초과를 방지하기 위해, 다음 에이전트에게 턴을 넘길 때 **이전 대화 기록(History)을 참조하라고 지시하지 마세요.** 반드시 "현재까지의 완료 상태"와 "다음 에이전트가 수행해야 할 단일 목표(Payload)"만 요약하여 전달하는 방식으로 턴을 교체해야 합니다.

---

### 실행 지침 (자율 루프 가이드)

이 워크플로우를 호출한 경우, 당신(AI)은 나에게 중간 허락을 구하지 말고 아래 순서에 따라 **자율적으로(Autonomously)** 루프를 돌아야 합니다.

1. **지시 분석 및 기획 (PM 모드 - 🧠 Pro 모델 필수)**:
   - 사용자의 요청을 분석하고 비즈니스 로직과 예외 상황을 도출합니다.
   - 한 번에 개발할 수 있도록 전체 에픽을 3개 이하의 작은 태스크(Task Chunking)로 쪼갭니다.
   - _주의:_ 직접 문서를 작성하지 말고, 도출된 기획안과 태스크 리스트를 `scrum_master`에게 요약 전달하여 턴을 넘깁니다.

2. **문서화 및 상태 초기화 (Scrum Master 모드 - ⚡ Flash 모델 필수)**:
   - PM의 기획 내용을 넘겨받아 현재 작업 디렉토리에 `task.md` (할 일 체크리스트) 와 `implementation_plan.md` (구체적 설계도) 를 마크다운 양식으로 예쁘게 작성합니다.
   - 작성이 완료되면 개발 목표를 요약하여 `backend_dev` 에게 턴을 넘깁니다.

3. **백엔드 개발 (Backend Developer 모드 - ⚡ Flash 기본 / 🧠 Pro 선택)**:
   - `/Users/ziro/.agents/skills-guide` 내의 백엔드 규칙(`api-design`, `backend-patterns` 등)을 준수하여 `task.md` 에 기재된 API/DB 작업을 수행합니다.
   - 로컬 테스트(cURL 등)를 거쳐 정상 작동을 확인합니다.
   - _주의:_ 직접 `task.md`를 수정하지 말고, 완료된 내역을 `scrum_master`에게 전달하여 체크리스트 업데이트를 요청하거나, 바로 `ui_ux_designer`에게 UI 연동 요건을 전달합니다.

4. **UI/UX 디자인 (UI/UX Designer 모드 - 🧠 Pro 기본 / ⚡ Flash 선택)**:
   - 화면 설계, 사용자 흐름, 반응형 레이아웃 및 디자인 시스템을 코드에 반영합니다.
   - 상태 관리나 API 로직은 건드리지 않고 오직 CSS/디자인 요소만 수정 후 결함을 검토합니다.
   - 디자인 스펙이 정리되면 `frontend_dev` 에게 턴을 넘깁니다.

5. **프론트엔드 적용 (Frontend Developer 모드 - ⚡ Flash 기본 / 🧠 Pro 선택)**:
   - `/Users/ziro/.agents/skills-guide` 내의 프론트엔드 규칙을 준수하여 화면 연동 및 상태 관리(UI 로직)를 개발합니다.
   - 터미널 커맨드(`npm run build` 또는 `flutter test` 등)로 자체 검수합니다.
   - 구현이 완료되면 `scrum_master`에게 상태 업데이트를 요청하거나, `qa_engineer`에게 검증을 요청합니다.

6. **QA 및 보안 검증 (QA Engineer 모드 - 🧠 Pro 기본 / ⚡ Flash 선택)**:
   - `/Users/ziro/.agents/skills-guide` 폴더 내의 지침(`tdd-workflow`, `security-review` 등)을 참고하여 단위 테스트 점검 및 보안 QA를 수행합니다.
   - 실패 시 원인(Why)을 분석하여 해당 개발 에이전트에게 턴을 돌려보내고, 모두 통과하면 최종 보고를 준비합니다.

7. **최종 통합 보고 및 문서 마감 (Scrum Master 모드 - ⚡ Flash 모델 필수)**:
   - 모든 태스크 및 QA가 완료되면 `task.md`의 모든 항목을 `[x]` 처리하여 마감합니다.
   - 더 이상의 코드 작성을 멈추고 `notify_user` 도구를 사용해 사용자에게 작업이 에러 없이 완료되었음을 짧게 요약 보고합니다.

8. **자율 Git 형상관리 (버전 관리 모드 - ⚡ Flash 모델 필수)**:
   - 터미널 명령어를 통해 자동으로 새 기능에 맞는 브랜치를 생성합니다. (예: `git checkout -b feature/설명`)
   - `git add .` 및 `git commit -m "feat: 설명"` 명령어로 커밋을 남깁니다.
   - 마지막으로 `git push origin 브랜치명` 을 실행해 원격 저장소에 반영하고 전체 루프를 종료합니다.
