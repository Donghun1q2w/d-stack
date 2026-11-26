# dstack

빠르게 가고 싶다면 먼저 깊이 들어가야 한다. dstack은 Claude Code가 코드를 덜 쓰고, 더 좋은 코드를 쓰고, 직접 검증한 뒤에야 끝났다고 말하게 만드는 스킬 묶음이다.

dstack은 한두 명이 Windows에서 C#, Python, Rust, AVEVA PML을 다루고, 리뷰 요청 절차 없이 `main`에 직접 push하는 팀을 기준으로 만들었다. 모든 작업은 "로컬에서 빌드와 테스트가 통과한 커밋만 `main`에 올린다"는 한 가지 규칙으로 끝난다.

- 스킬 62개(원칙 스킬 24개 포함), 플레이북 19개, 서브에이전트 2개
- 도우미 스크립트 2개는 Windows PowerShell 5.1용이고, 검증 명령은 Git Bash와 PowerShell 어느 쪽에서도 도는 한 줄씩의 명령 목록이다
- 언어 스킬 4종(C#, Python, Rust, PML)은 해당 확장자의 파일을 열면 자동으로 로드된다
- 스킬 본문은 영어, 이 README와 [가이드](./docs/guide/README.md)는 한국어

dstack은 MIT 라이선스 오픈소스 프로젝트를 Claude Code 전용으로 옮긴 것이다. 출처와 달라진 점은 [docs/UPSTREAM.md](./docs/UPSTREAM.md)에 있다.

## 설치

Claude Code 대화창에서 실행한다.

```text
/plugin marketplace add Donghun1q2w/d-stack
/plugin install dstack@d-stack
```

Claude Code 2.1.275 이상에서는 한 줄로도 된다.

```text
/plugin install dstack --marketplace Donghun1q2w/d-stack
```

Claude Code는 플러그인 명령에 접두사를 붙인다. 그래서 모든 명령은 `/dstack:d-mode`처럼 `/dstack:`으로 시작한다. 외부 마켓플레이스는 자동 업데이트가 꺼져 있다. 한 번 갱신하려면 `claude plugin update dstack@d-stack`을 실행한다. dstack은 버전 번호를 두지 않는다. 저장소의 커밋이 곧 버전이라서, 새 커밋이 올라오면 갱신 대상이 된다.

필요한 것:

| 항목 | 용도 | 없을 때 |
|---|---|---|
| Git for Windows | 모든 플레이북. Claude Code의 Bash 도구가 Git Bash로 돈다 | 필수 |
| Windows PowerShell 5.1 | `worktree-audit.ps1`, `log.ps1` | Windows 10에 기본 포함 |
| Bun 1.1.5 이상 | `/dstack:statechart` | Node.js 22.18 이상으로 대신 실행할 수 있다 |
| Node.js 22.18 이상 | 저장소 검사 스크립트(이 저장소를 고칠 때만), statechart의 대체 런타임 | 플러그인 사용에는 필요 없다 |
| codex 플러그인 | 리뷰 패널의 다른 회사 모델 좌석 | 그 좌석이 `opus high`로 대체됨 |

설치와 확인:

```text
winget install OpenJS.NodeJS.LTS
node --version
npm install -g bun
bun --version
git config --global core.longpaths true
```

마지막 줄은 worktree를 쓸 때 Windows의 경로 길이 제한(260자)으로 생기는 "Filename too long" 오류를 막는다.

## 시작하기

1. [`/dstack:setup-dstack`](./skills/setup-dstack/SKILL.md)을 실행해 추론 예산과 역할별 모델을 고른다. 세션이 쓰는 셸(Git Bash 또는 PowerShell)도 함께 기록한다. 결과는 `%USERPROFILE%\.claude\rules\dstack-models.md`에 저장되고 새 세션부터 적용된다. 건너뛰어도 기본값으로 동작한다.
2. 엄밀함이 필요한 작업을 시작할 때 [`/dstack:d-mode`](./skills/d-mode/SKILL.md)를 입력한다.

```text
/dstack:d-mode users get two notifications after a retry. repro first, then fix and verify.
```

처음이라면 [dstack 가이드](./docs/guide/README.md)가 설치부터 검증, 밤샘 실행까지 순서대로 안내한다. 어떤 스킬을 써야 할지 모르겠으면 [`/dstack:d-help`](./skills/d-help/SKILL.md)에 물어본다.

기본값에서는 코드 작성, 글쓰기, 판단 역할이 Opus xhigh로 돈다. 어떤 역할도 xhigh를 넘지 않는다. 리뷰 패널은 Fable high, Opus high, codex 세 좌석이다.

## d-mode가 하는 일

`/dstack:d-mode`는 요청을 읽고 플레이북 19개 중 하나를 골라 그 단계를 할 일 목록에 그대로 옮긴 다음, 단계가 필요로 하는 다른 스킬을 불러 실행한다. 답변에는 어떤 원칙이 어떤 결정을 바꿨는지 적는다.

| 플레이북 | 쓰는 때 |
|---|---|
| [investigation](./skills/d-mode/playbooks/investigation.md) | 코드를 바꾸지 않는 질문. 어떻게 동작하는지, 왜 이렇게 만들었는지 |
| [bug fix](./skills/d-mode/playbooks/bug-fix.md) | 결함을 재현하고, 원인을 찾고, 실행 증거와 함께 고친다 |
| [perf issue](./skills/d-mode/playbooks/perf-issue.md) | 측정된 느림을 추적하고 기준선 대비 개선한다 |
| [hillclimb](./skills/d-mode/playbooks/hillclimb.md) | 지표 하나를 목표까지 반복 개선한다. 가설 하나에 측정 하나, 채택한 개선마다 커밋 하나 |
| [runtime forensics](./skills/d-mode/playbooks/runtime-forensics.md) | 실행 중인 프로세스의 증상(누수, 유휴 CPU 점유, 화면 깨짐)을 계측으로 진단한다 |
| [trace forensics](./skills/d-mode/playbooks/trace-forensics.md) | 이미 받아 둔 프로파일이나 덤프를 분석한다 |
| [feature](./skills/d-mode/playbooks/feature.md) | 새 동작이나 바뀐 동작. 데이터 모양부터 정하고 만든다 |
| [refactoring](./skills/d-mode/playbooks/refactoring.md) | 동작은 그대로 두고 구조만 바꾼다 |
| [prototype](./skills/d-mode/playbooks/prototype.md) | 버릴 코드로 설계나 동작 결정을 싸게 내린다 |
| [visual parity](./skills/d-mode/playbooks/visual-parity.md) | 두 구현의 화면이 픽셀 단위로 같은지 맞춘다 |
| [authoring a skill](./skills/d-mode/playbooks/authoring-a-skill.md) | SKILL.md를 쓰거나 고친다 |
| [eval](./skills/d-mode/playbooks/eval.md) | 스킬이나 프롬프트 변경이 에이전트 행동을 어떻게 바꾸는지 눈가림으로 시험한다 |
| [autonomous run](./skills/d-mode/playbooks/autonomous-run.md) | 긴 작업을 멈추지 않고 종료 조건까지 끌고 간다 |
| [autopilot](./skills/d-mode/playbooks/autopilot.md) | 서로 독립인 변경 여러 건을 항목별 담당 에이전트와 별도 검증 에이전트로 처리하고, 검증된 것만 차례로 `main`에 올린다 |
| [session pickup](./skills/d-mode/playbooks/session-pickup.md) | 이전 에이전트가 하던 작업을 이어받는다 |
| [pause safely](./skills/d-mode/playbooks/pause-safely.md) | 진행 중인 작업을 나중에 이어갈 수 있게 멈춘다 |
| [multi-phase plan](./skills/d-mode/playbooks/multi-phase-plan.md) | 여러 단계에 걸친 작업의 계획서를 쓴다. 구현은 하지 않는다 |
| [worktree cleanup](./skills/d-mode/playbooks/worktree-cleanup.md) | 병합됐거나 버려진 worktree를 안전 장치를 거쳐 정리한다 |
| [commit and push](./skills/d-mode/playbooks/commit-and-push.md) | 작은 커밋으로 나누고, 로컬 빌드와 테스트를 통과시킨 뒤 `main`에 push한다. 파일을 바꾸는 모든 플레이북의 마지막 단계 |

`/dstack:d-mode`는 한 번 입력하면 그 대화에 남는다. `/clear`를 했거나 새 세션을 열었으면 다시 입력한다. 대화 중간에 주제를 바꿀 때는 "new task"라고 말하면 플레이북을 새로 고른다. Claude Code 기본 명령 `/loop`와 함께 쓰면 종료 조건을 만족할 때까지 여러 시간 동안 돌릴 수 있다.

## main에 올리는 규칙

[commit and push 플레이북](./skills/d-mode/playbooks/commit-and-push.md)이 정한 순서는 다음과 같다.

1. 변경분을 정리한다. 설명용 주석, 불필요한 방어 코드, 목적과 무관한 수정은 뺀다.
2. 작은 커밋으로 나눈다. 제목은 `type(scope): subject` 형식이다.
3. 프로젝트의 빌드와 테스트 명령을 한 줄씩 실행하고, 0이 아닌 종료 코드가 나오면 멈춘다. 명령은 프로젝트 `CLAUDE.md`, `verify-<app>` 스킬, 언어 스킬 순서로 찾는다. 셸에서 돌릴 수 없는 검증(E3D 안의 PML 등)은 프로젝트 `CLAUDE.md`에 `dstack-gate: manual` 한 줄을 적어 두면, 사용자가 수동 실행을 확인해 준 뒤에 push한다.
4. `git fetch origin main` 후 뒤처졌으면 `git rebase origin/main`을 하고 3번을 다시 실행한다.
5. `git push origin HEAD:main`으로 올리고, 원격과 로컬 커밋이 같은지 확인한다.

| 상황 | 동작 |
|---|---|
| 빌드나 테스트 실패 | push하지 않는다. 고친 뒤 처음부터 다시 검증한다 |
| 다른 사람이 먼저 push함 | fetch, rebase, 재검증 후 다시 push. 3번 거절되면 멈추고 보고한다 |
| 내 것이 아닌 변경이 작업 폴더에 있음 | 건드리지 않는다. rebase가 필요하면 `--autostash`를 쓴다 |
| 검증 수단이 없음 | 커밋만 하고 멈춘 뒤 물어본다 |
| 수동 검증이 선언됨 | 무엇을 실행할지 알려 주고 한 번 묻는다. 확인되면 커밋 본문에 `Verification: manual (...)`로 남긴다 |
| 변경이 요청한 목표 밖의 파일을 건드림 | `git diff --stat`을 보여 주고 한 번 묻는다 |
| 비밀 값, 빌드 산출물, 벤더 바이너리가 보임 | 스테이징하지 않고 `.gitignore` 줄을 제안한다 |
| 올린 커밋이 잘못됨 | `git revert`로 되돌리는 커밋을 올린다 |

`git push --force`는 어떤 경우에도 쓰지 않는다.

## 스킬

대부분은 `/dstack:d-mode`가 단계에 맞춰 불러 쓴다. 직접 부르고 싶을 때는 아래 이름 앞에 `/dstack:`을 붙인다.

| 스킬 | 쓰는 때 |
|---|---|
| [d-mode](./skills/d-mode/SKILL.md) | 사소하지 않은 모든 작업의 시작점 |
| [d-help](./skills/d-help/SKILL.md) | dstack 사용법, 어떤 스킬이 맞는지 묻고 싶을 때 |
| [setup-dstack](./skills/setup-dstack/SKILL.md) | 역할별 모델과 추론 예산 설정 |
| [in-your-own-words](./skills/in-your-own-words/SKILL.md) | 에이전트가 목표를 제대로 이해했는지 먼저 확인 |
| [sharpen](./skills/sharpen/SKILL.md) | 보내기 전 프롬프트를 더 깊게 다듬기 |
| [reframe](./skills/reframe/SKILL.md) | 만들려는 것을 가리키는 전문 용어 찾기 |
| [how](./skills/how/SKILL.md) | 코드가 지금 어떻게 동작하는지 설명 |
| [why](./skills/why/SKILL.md) | 왜 이렇게 만들어졌는지 커밋 기록에서 찾기 |
| [teach](./skills/teach/SKILL.md) | 변경이나 하위 시스템을 제대로 이해하기 |
| [recall](./skills/recall/SKILL.md) | 최근 내 작업 맥락 되살리기 |
| [ketchup](./skills/ketchup/SKILL.md) | 마지막 메시지 이후 이 대화에서 바뀐 것과 내가 결정할 것 |
| [ketchup-video](./skills/ketchup-video/SKILL.md) | 같은 내용을 자막 있는 짧은 영상으로 |
| [blast-radius](./skills/blast-radius/SKILL.md) | 작은 변경이 바깥에서 무엇을 깨뜨릴 수 있는지 |
| [architect](./skills/architect/SKILL.md) | 함수 경계를 넘는 코드를 쓰기 전에 타입과 모듈 모양 정하기 |
| [arena](./skills/arena/SKILL.md) | 같은 과제를 여러 에이전트가 풀고 가장 좋은 부분을 합치기 |
| [swarm](./skills/swarm/SKILL.md) | 여러 조각을 병렬로 확인하고 보고서 하나로 받기 |
| [interrogate](./skills/interrogate/SKILL.md) | 여러 모델이 변경을 깨뜨려 보게 하기. 실행으로 증명된 지적만 남긴다 |
| [tdd](./skills/tdd/SKILL.md) | 싼 로컬 테스트가 있을 때 실패하는 테스트부터 쓰기 |
| [csharp-best-practices](./skills/csharp-best-practices/SKILL.md) | C#과 .NET 규칙, `dotnet build`, `dotnet test` |
| [python-best-practices](./skills/python-best-practices/SKILL.md) | Python 규칙, `pytest`, Windows exe 빌드 |
| [rust-best-practices](./skills/rust-best-practices/SKILL.md) | Rust 규칙, `cargo test`, `cargo clippy` |
| [pml-best-practices](./skills/pml-best-practices/SKILL.md) | AVEVA E3D PML 매크로, 폼, 오브젝트 규칙 |
| [typescript-best-practices](./skills/typescript-best-practices/SKILL.md) | TypeScript 규칙 |
| [no-comments](./skills/no-comments/SKILL.md) | 리뷰 전에 주석 걷어내기 |
| [unslop](./skills/unslop/SKILL.md) | 글에서 AI 말투 지우기 |
| [technical-writing](./skills/technical-writing/SKILL.md) | 문서, README, 커밋 메시지 작성 기준 |
| [bro](./skills/bro/SKILL.md) | 마지막 답변을 쉬운 말로 다시 듣기 |
| [benchmark-checklist](./skills/benchmark-checklist/SKILL.md) | 측정한 성능 수치를 보고하기 전에 검증 |
| [figure-it-out](./skills/figure-it-out/SKILL.md) | 맞는 플레이북이 없는 큰 작업의 실행 계획 설계 |
| [show-me-your-work](./skills/show-me-your-work/SKILL.md) | 나중에 검토할 수 있는 결정 기록(TSV) 남기기 |
| [create-verification-skill](./skills/create-verification-skill/SKILL.md) | 앱을 사용자처럼 조작해 동작을 증명하는 프로젝트 전용 스킬 만들기 |
| [maintain-verification-skill](./skills/maintain-verification-skill/SKILL.md) | 그 스킬을 앱의 현재 상태에 맞게 고치기 |
| [create-formal-verification-skill](./skills/create-formal-verification-skill/SKILL.md) | 테스트가 닿기 어려운 성질을 정형 검증하기 |
| [maintain-formal-verification-skill](./skills/maintain-formal-verification-skill/SKILL.md) | 코드가 바뀐 뒤 정형 검증을 다시 맞추기 |
| [statechart](./skills/statechart/SKILL.md) | TLA+ 모델로 검사한 상태 다이어그램 그리기 |
| [automate-me](./skills/automate-me/SKILL.md) | 내 작업 습관으로 나만의 모드 스킬 만들기 |
| [reflect](./skills/reflect/SKILL.md) | 끝난 작업에서 배운 것을 스킬 수정으로 남기기 |
| [correct](./skills/correct/SKILL.md) | 에이전트가 같은 실수를 반복하지 않게 저장소 고치기 |

## 서브에이전트

`/dstack:d-mode`는 입력받은 대화에서 직접 돈다. 그 대화가 플레이북, 할 일 목록, 서브에이전트 생성을 모두 맡는다.

- [`dstack:d-agent`](./agents/d-agent.md)는 실행 중에 일을 넘겨받는 위임용 에이전트다. 일을 시작하기 전에 d-mode `SKILL.md` 전체를 읽는다. 플레이북 자체를 돌리는 용도로 쓰지 않는다.
- [`dstack:comment-sicko`](./agents/comment-sicko.md)는 주석만 검토하는 에이전트다. 보통 [no-comments](./skills/no-comments/SKILL.md) 스킬을 통해 부른다.

## 원칙

원칙 하나를 담은 짧은 스킬이 24개 있다. d-mode가 작업을 시작할 때 목록을 읽고, 적용한 원칙의 전문을 읽은 뒤 답변에 이름을 적는다. "prove it works를 적용해. 실제 출력을 보여 줘."처럼 이름으로 방향을 잡을 수 있다. 전체 목록은 [가이드 8장](./docs/guide/08-principles.md)에 있다.

## 내 것으로 만들기

- [automate-me](./skills/automate-me/SKILL.md)는 최근 대화 기록에서 작업 습관을 찾아 `<이름>-mode` 스킬 초안을 만든다.
- [setup-dstack](./skills/setup-dstack/SKILL.md)으로 역할별 모델을 바꾼다. 설정 파일에 없는 역할은 기본값을 쓴다.
- 스킬이나 플레이북을 더하는 규칙은 [docs/EXTENDING.md](./docs/EXTENDING.md)에 있다.

## 저장소 검사

`scripts/`와 `tests/`는 이 저장소를 고치는 사람을 위한 개발 도구다. 플러그인은 이 폴더를 읽지 않는다. Node.js 22.18 이상이 필요하고, 그보다 낮으면 검사 스크립트가 안내 문구와 함께 종료 코드 2로 끝난다. 이 저장소를 고친 뒤에는 다음 세 명령이 모두 종료 코드 0으로 끝나야 한다.

```text
node scripts/check-dstack.mjs
node tests/adversarial/run.mjs
node tests/adversarial/push-flow.mjs
```

첫 번째는 잔존 용어, 스킬 이름과 폴더 일치, 상대 링크, 플레이북 연결, 매니페스트, PowerShell 5.1 정적 규칙, 개수, 인코딩을 검사한다. 두 번째는 일부러 망가뜨린 복사본에서 검사가 실제로 실패하는지 확인한다. 세 번째는 플레이북 절차를 옮긴 모델로 push 거절, 더러운 작업 폴더, 실패하는 빌드 상황을 재현해 git 명령이 문서대로 동작하는지 확인한다. 에이전트가 플레이북을 실제로 따르는지를 검사하는 것은 아니다. Windows에서는 `powershell -NoProfile -ExecutionPolicy Bypass -File tests\windows-smoke.ps1`로 두 PowerShell 스크립트를 한 번에 확인한다.

## 라이선스

MIT. 원저작자와 이 저장소 저작자의 표기는 [LICENSE](./LICENSE)에 있다.
