# dstack 확장 가이드

dstack에 스킬, 플레이북, 모델 설정을 더하거나 바꿀 때 지켜야 하는 공개 인터페이스와 하위 호환 규칙이다. 모든 규칙은 `node scripts/check-dstack.mjs`가 검사한다.

## 공개 인터페이스

| 인터페이스 | 형식 | 깨지면 생기는 일 |
|---|---|---|
| 스킬 이름 | `skills/<name>/SKILL.md`의 frontmatter `name`이 폴더 이름과 같다. 소문자, 숫자, 하이픈만 쓰고 64자 이하다. | 호출 명령 `/dstack:<name>`과 다른 스킬의 `../<name>/SKILL.md` 참조가 끊긴다. |
| 서브에이전트 이름 | `agents/<name>.md`의 `name`이 파일 이름과 같다. 호출은 `subagent_type: "dstack:<name>"`. | d-mode가 위임할 대상을 찾지 못한다. |
| 플레이북 | `skills/d-mode/playbooks/<kebab-title>.md`. d-mode `SKILL.md`의 Playbooks 목록에 같은 제목이 있다. | d-mode가 없는 파일을 열거나, 있는 플레이북을 고르지 못한다. |
| 모델 설정 파일 | `~/.claude/rules/dstack-models.md`. 줄 형식과 기본값은 `skills/setup-dstack/SKILL.md`의 "The file" 표가 기준이다. 역할 줄과 설정 줄 `shell: bash` 또는 `shell: powershell`이 있다. | 역할이 기본값으로 돌아간다. 실행은 계속된다. |
| 수동 게이트 선언 | 프로젝트 `CLAUDE.md`의 한 줄 `dstack-gate: manual`. 뒤에 무엇을 실행할지 적을 수 있다. | 셸에서 검증할 수 없는 프로젝트가 push할 때마다 "검증 없음"으로 멈춘다. |
| 실패 사례 ID | `skills/d-mode/playbooks/commit-and-push.md`의 `F01`~`F16`, `N1`~`N5`. | 답변과 테스트가 가리키는 사례가 달라진다. |
| bun 도구 부트스트랩 | `skills/d-mode/scripts/bootstrap.ts`의 `ensureDependenciesInstalled()`. 같은 폴더에 bun 스크립트를 더할 때 첫 줄에서 부른다. `package.json`과 `bun.lock`에 고정된 의존성을 한 번 설치한다. | 더한 도구가 의존성 없이 실행된다. |
| 역할 이름 | `feature, refactoring`, `bug-fix`, `perf-issue`, `hillclimb`, `judgment and prose`, `arena runners`, `arena cross-judge pool`, `swarm workers`, `interrogate reviewers` | 설정 파일의 해당 줄이 무시된다. |
| 검사 스크립트 | `node scripts/check-dstack.mjs [--root DIR] [--config FILE] [--only a,b] [--json] [--counts] [--no-validate] [--require-validate]`. 종료 코드 0은 통과, 1은 위반 있음, 2는 사용법 또는 설정 오류. | CI나 사람이 결과를 잘못 읽는다. |
| 검사 설정 | `scripts/check-dstack.config.json`. 환경 변수 `DSTACK_CHECK_CONFIG`로 다른 파일을 지정한다. `DSTACK_CHECK_CLAUDE_BIN`으로 `claude` 실행 파일을 지정한다. | 검사 규칙이 바뀐다. |

## 하위 호환 규칙

- `plugin.json`과 마켓플레이스 항목에 `version`을 두지 않는다. 커밋이 버전이다. 검사 스크립트가 `PLUGIN_VERSION_PINNED`로 막는다.
- 스킬, 서브에이전트, 플레이북, 역할의 이름을 바꾸거나 지우는 커밋은 제목에 `!`를 붙이고(`refactor(skills)!: ...`) 본문에 옛 이름과 새 이름을 적는다. 더하기만 하는 변경은 표시가 필요 없다.
- 실패 사례 ID는 다시 쓰지 않는다. 사례를 없애면 번호를 비워 두고, 새 사례는 다음 번호를 쓴다.
- 모델 설정 파일의 줄 형식을 바꾸면 `# defaults: N`의 N을 1 올리고, `setup-dstack` 2단계에 이전 형식을 읽는 규칙을 더한다. 이전 형식 파일은 계속 읽혀야 한다.
- 검사 스크립트의 종료 코드와 `--json` 출력의 `findings[].rule` 값은 지우거나 뜻을 바꾸지 않는다. 새 규칙은 새 이름으로 더한다.
- 검사 설정의 `version`은 형식이 바뀔 때만 올린다. 스크립트는 모르는 버전을 종료 코드 2로 거부한다.

## 언어 스킬 추가

1. `skills/<language>-best-practices/SKILL.md`를 만든다. `skills/rust-best-practices/SKILL.md`를 본으로 삼는다. frontmatter는 `name`, `description`, `paths` 세 줄이다. `disable-model-invocation`을 넣지 않는다. 넣으면 `paths`로 자동 로드되지 않는다.
2. 본문에 `## Build and test`와 `## Rules`(표) 두 절을 둔다. 게이트는 `text` 코드 블록에 한 줄에 명령 하나씩 적는다. 셸 문법(연결 연산자, 변수, 조건문)을 쓰지 않는다. 프로젝트 설정에 따라 달라지는 명령은 "언제 더하는지" 표로 뺀다. 예제는 `references/patterns.md`에 둔다.
3. `skills/d-mode/SKILL.md`의 Non-negotiables에서 언어 스킬을 나열한 줄에 확장자와 스킬 이름을 더한다.
4. `skills/d-mode/playbooks/commit-and-push.md` 3단계의 언어 스킬 목록에 이름을 더한다.
5. `skills/d-help/SKILL.md`의 "Pick a skill" 표와 `README.md`의 스킬 표에 한 줄씩 더한다.
6. `scripts/check-dstack.config.json`의 `expected.skills`를 1 올리고 `languageSkills.names`에 이름을 더한다.
7. `node scripts/check-dstack.mjs`를 실행해 0건인지 확인한다.

## 플레이북 추가

1. `skills/d-mode/playbooks/<kebab-title>.md`를 만든다. 첫 줄은 `### <Title>`, 그다음 굵은 글씨의 책임 문장, 번호 붙인 단계, 마지막에 `**Reply:**` 줄이다. 파일을 바꾸는 플레이북은 마지막 단계에서 `Run **Commit and push**.`로 끝난다.
2. d-mode `SKILL.md`의 Playbooks 목록 마지막 줄에 제목을 더한다. 제목을 소문자와 하이픈으로 바꾼 값이 파일 이름과 같아야 한다.
3. `README.md`의 플레이북 표에 한 줄을 더한다.
4. `scripts/check-dstack.config.json`의 `expected.playbooks`를 1 올린다.
5. `node scripts/check-dstack.mjs`를 실행한다. 목록과 파일이 어긋나면 `ROUTE_TO_MISSING_PLAYBOOK` 또는 `PLAYBOOK_NOT_ROUTED`가 나온다.

## 모델 설정 예시

기본값을 그대로 쓰면 파일이 없어도 된다. 일부 역할만 바꾸려면 그 줄만 둔다.

```
# defaults: 1
# budget: medium (high)
bug-fix: sonnet high
swarm workers: inherit
arena runners: fable high, opus high
```

이 예시에서 `bug-fix`는 Sonnet으로, `swarm workers`는 세션 모델로 돌고, 아레나는 2개 좌석만 쓴다. 나머지 역할은 기본값이다. 프로젝트 하나에서만 다르게 쓰려면 같은 형식의 파일을 그 저장소의 `.claude/rules/dstack-models.md`에 둔다.

## 허용 목록에 예외 추가

검사에 걸린 줄이 정당하면 `scripts/check-dstack.config.json`의 `allowlist`에 항목을 더한다. `path`(글롭), `rules`(규칙 이름 배열), `reason`(이유)은 필수다. 한 줄만 허용하려면 `line`에 줄 번호를 적는다. 이유 없는 항목은 스크립트가 종료 코드 2로 거부한다.

```json
{ "path": "docs/guide/05-build-and-clean.md", "rules": ["SHELL"], "line": 42, "reason": "quotes a third-party install command that only exists as a POSIX script" }
```
