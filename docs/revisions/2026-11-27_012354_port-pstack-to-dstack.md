# pstack v0.15.48을 Claude Code 전용 플러그인 dstack으로 이식

- **Date**: 2026-11-27 01:23:54
- **Author**: Claude (dh-dev executor: Sonnet/max, orchestrator: Opus)

## Rationale / Plan

계획: [docs/plans/2026-11-27_000112_dstack-port.md](../plans/2026-11-27_000112_dstack-port.md). cursor/plugins의 pstack(커밋 b7b93c3)은 Cursor와 GitHub PR, macOS를 전제로 한다. 이를 Windows 10 환경, 1~2인 개발, main 직접 push 흐름에 맞춘 Claude Code 전용 플러그인 겸 마켓플레이스로 옮겼다. 개발 방향은 심화다.

## Changed Files

| File | Status | Description |
|------|--------|-------------|
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` | Added | 루트 플러그인 겸 마켓플레이스. version 없음, 커밋 SHA가 버전 |
| `LICENSE` | Modified | 원저작자(Lauren Tan) 저작권 줄 병기 |
| `README.md`, `docs/guide/*` (11쪽) | Added | 한국어 README와 가이드 |
| `docs/UPSTREAM.md`, `docs/EXTENDING.md` | Added | 출처와 재동기화 절차, 확장점과 하위 호환 규칙 |
| `skills/**` (62개 스킬) | Added | 원본 58개를 이식했다. poteto-mode→d-mode, poteto-help→d-help, setup-pstack→setup-dstack. 언어 스킬 4종 신규 |
| `skills/d-mode/playbooks/*` (19개) | Added | PR 관련 5개를 commit-and-push와 autopilot으로 대체 |
| `skills/d-mode/scripts/worktree-audit.ps1`, `skills/show-me-your-work/scripts/log.ps1` | Added | .sh를 PowerShell 5.1로 다시 작성 |
| `agents/d-agent.md`, `agents/comment-sicko.md` | Added | 서브에이전트 |
| `scripts/check-dstack.mjs`, `scripts/check-dstack.config.json` | Added | 잔존 용어, frontmatter, 링크, 라우팅, ps1, 매니페스트 검사 |
| `scripts/migration/*` | Added | 일회용 이식 코드모드와 port-map |
| `tests/adversarial/*`, `tests/windows-smoke.ps1` | Added | 적대적 사례 55개, push 흐름 17개, Windows 스모크 |
| `.gitattributes`, `.gitignore` | Added | 줄 끝 규칙, .omc 제외 |
| `docs/plans/2026-11-27_000112_dstack-port.md`, `docs/plan_history.md` | Added | dh-dev 계획 기록 |

## Details

- 삭제(가져오지 않음): automations/benny, make-bot-ui, watch-pr, bugbot-triage, .cursor-plugin, docs/harness, assets
- 리뷰 패널의 Gemini 좌석은 codex:codex-rescue로 바꿨고, codex가 없으면 opus high로 대체한다. /deslop은 no-comments와 diff 정리로 대체했다.
- 검증(macOS): check-dstack 0건(원본 기준선 1,679건), `claude plugin validate .` 종료 코드 0, 적대적 사례 55개 통과, push 흐름 17개 통과, statechart 테스트는 원본과 같은 결과(303/2/62)
- 미확인: W01–W12 (Windows에서 확인할 항목: PS 5.1 실행, dotnet/cargo 예제, PML unverified 규칙)
- 알려진 사항: `--strict` validate는 version 없음 경고로 실패한다(U1, 의도된 결과). /simplify는 건너뛰었다. 코드모드와 검사 스크립트를 적대적 테스트로 이미 검증했고, 고치면 그 고정점이 깨질 수 있어서다.
