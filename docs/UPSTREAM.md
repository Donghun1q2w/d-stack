# 원본(upstream)과 동기화 절차

dstack은 MIT 라이선스로 공개된 pstack을 Claude Code 전용으로 옮긴 파생물이다. 이 문서는 원본 표기가 허용되는 유일한 사용자 문서다. 저장소 검사 스크립트는 이 파일을 잔존 용어 검사에서 제외한다.

## 출처

| 항목 | 값 |
|---|---|
| 원본 저장소 | https://github.com/cursor/plugins (하위 폴더 `pstack/`) |
| 원본 커밋 | `b7b93c36be9bcc36a74db438e0fd385d660bc559` |
| 원본 버전 | pstack 0.15.48 |
| 원본 저작권 | Copyright (c) 2026 Lauren Tan, MIT |
| 가져온 날짜 | 2026-11-26 |
| dstack 버전 | 버전 번호 없음. 저장소 커밋 SHA가 버전이다 |

## 원본과 달라진 점

| 구분 | 원본 | dstack |
|---|---|---|
| 대상 도구 | Cursor (Claude Code는 어댑터 문서로 지원) | Claude Code 전용. 어댑터 문서 `docs/harness/claude-code.md`의 대응표를 각 스킬 본문에 직접 반영하고 문서는 삭제 |
| 이름 | `pstack`, `poteto-mode`, `poteto-agent`, `poteto-help`, `setup-pstack` | `dstack`, `d-mode`, `d-agent`, `d-help`, `setup-dstack` |
| 삭제 | `automations/benny`, `skills/make-bot-ui`, `skills/poteto-mode/scripts/watch-pr`, `skills/poteto-mode/references/bugbot-triage.md`, `assets/logo.png`, `docs/guide/images/router.jpg` | 없음 |
| 플레이북 | 22개. `opening-a-pr`, `babysit`, `shipping`, `autopilot-full`, `autopilot-stack` 포함 | 19개. 위 5개를 `commit-and-push`와 `autopilot` 2개로 대체 |
| 전달 방식 | 풀 리퀘스트 생성, 리뷰 봇 대응, 병합 대기열 | 로컬 빌드와 테스트 통과 후 `main`에 fast-forward push |
| 셸 | bash 스크립트 2개 | Windows PowerShell 5.1 스크립트 2개 (`worktree-audit.ps1`, `log.ps1`) |
| 모델 설정 | `~/.cursor/rules/pstack-models.mdc`, 모델 슬러그 | `~/.claude/rules/dstack-models.md`, `<model> <effort>` 값 |
| 리뷰 패널 세 번째 좌석 | Gemini | codex 플러그인의 `codex:codex-rescue`, 없으면 `opus high` |
| 그대로 둔 것 | `skills/statechart/scripts/test/**`, `skills/poteto-mode/scripts/`의 `bootstrap.ts`, `package.json`, `bun.lock` | statechart 테스트 자료는 바이트까지 같다. 기록된 경로 문자열 안에 원본 폴더 이름이 남아 있고 검사 허용 목록에 있다. `skills/d-mode/scripts/`의 세 파일은 패키지 이름과 삭제된 도구를 가리키던 `scripts` 항목만 고쳤다 |
| 추가 | 없음 | 언어 스킬 4종 (C#, Python, Rust, PML), `scripts/check-dstack.mjs`, `scripts/migration/`, `tests/adversarial/`, `docs/EXTENDING.md` |
| 문서 언어 | 영어 | README와 `docs/`는 한국어, 스킬 본문은 영어 |

## 이식에 쓴 도구

`scripts/migration/port-from-upstream.mjs`와 `scripts/migration/port-map.json`은 위 커밋을 옮길 때 한 번 쓴 도구다. 줄 편집이 그 커밋의 줄 번호에 묶여 있어서 다른 커밋에는 그대로 쓸 수 없다. 무엇을 어떻게 바꿨는지 보여 주는 기록으로 남겨 둔다. 같은 커밋에 다시 돌리면 같은 결과가 나온다.

## 원본 변경을 검토하는 절차

원본의 새 변경은 자동으로 가져오지 않는다. 사람이 diff를 읽고 필요한 것만 손으로 반영한다.

1. 원본을 받는다. 어느 컴퓨터에서나 같은 결과가 나온다.

   ```text
   git clone https://github.com/cursor/plugins upstream-plugins
   git -C upstream-plugins diff --stat b7b93c36be9bcc36a74db438e0fd385d660bc559 origin/main -- pstack
   ```

2. 바뀐 파일마다 `git -C upstream-plugins diff b7b93c36be9bcc36a74db438e0fd385d660bc559 origin/main -- pstack/<경로>`로 내용을 읽는다. 위 표의 "삭제" 행에 있는 경로는 건너뛴다.
3. 반영할 변경을 dstack의 대응 파일에 손으로 옮긴다. 이름과 경로는 `scripts/migration/port-map.json`의 `rename`과 `replace` 표를 따른다. 풀 리퀘스트, Cursor 전용 기능, bash 명령이 들어 있는 문장은 dstack의 표현으로 다시 쓴다.
4. `node scripts/check-dstack.mjs`가 0건으로 끝나는지 확인한다. 새로 들어온 원본 용어는 파일과 줄 번호로 나온다.
5. `node tests/adversarial/run.mjs`와 `node tests/adversarial/push-flow.mjs`를 실행한다.
6. 이 문서의 "출처" 표에서 원본 커밋, 원본 버전, 가져온 날짜를 고친다.

스킬 수나 플레이북 수가 달라지면 `scripts/check-dstack.config.json`의 `expected` 값을 함께 고친다.
