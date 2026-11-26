# 결과를 검증하고 main에 올린다

"컴파일된다"는 증거가 아니다. [Prove It Works 원칙](../../skills/principle-prove-it-works/SKILL.md)은 에이전트가 성공을 보고하기 전에 실제 산출물을 확인하게 만들고, 사용자의 일은 "실제 산출물"을 확인할 수 있게 만드는 것이다. 이 쪽은 종료 조건 밝히기, 측정한 수치 점검하기, 앱의 검증 스킬 만들기, 테스트가 거의 닿지 못하는 성질의 정형 검증, 그리고 커밋하고 main에 push하기를 다룬다.

검증은 대부분의 에이전트 작업에서 가장 느린 단계다. 보통 사람을 기다리는 단계이기 때문이다. 에이전트가 직접 검증할 수 있게 만들면 사용자가 병목에서 빠진다. 건너뛰면 에이전트를 더 돌려도 검토해야 할 미확인 작업만 늘어난다.

![시제품 비행기가 실제 시험 코스를 날고, 한 사람이 초시계로 시간을 재며, 로봇들이 비행을 촬영하고 점검표를 채우는 그림.](./images/verification.jpg)

## 종료 조건을 먼저 말한다

끝났다는 것이 무슨 뜻인지를 첫 프롬프트에 어울리는 말로 적는다.

```text
/dstack:d-mode add json output to this command. text output stays byte-identical, the json parses, both run against the sample project. show me the evidence.
```

이제 에이전트에게는 맞춰 줄 기분이 아니라 돌릴 수 있는 점검 세 개가 있다. 답이 돌아오면 정확한 명령과 출력이 들어 있어야 한다. 점검을 돌릴 수 없었다면 좋은 답은 "inconclusive"라고 말한다. 증거 없이 자신만만한 답은 경고 신호다.

점검은 변경에 맞춘다.

- CLI 변경은 실제 명령을 돌린다.
- UI 변경은 실행 중인 앱에서 바뀐 흐름을 따라가 본다. 기준 화면과 픽셀 단위로 같아야 한다면 [Visual parity 플레이북](../../skills/d-mode/playbooks/visual-parity.md)이 눈대중 대신 고정한 기준선에 대고 스크린샷을 비교한다.
- 파서나 마이그레이션은 저장해 둔 입력을 다시 돌린다.
- 성능 변경은 전후 프로파일을 비교한다.
- 데이터 저장 방식을 바꾼 변경은 쓴 값을 다시 읽어 본다.

증명은 직접 들여다볼 수 있는 산출물로 요청한다. 실패하는 테스트 다음에 통과하는 테스트, 전후 영상, 추적 기록, 스크린샷이다. 수정을 이미 push했다면 main에서 같은 점검을 다시 요청한다. 산출물은 그럴듯한 설명을 이긴다. 실행 전체를 다시 재생하지 않고도 따져 볼 수 있기 때문이다.

완전히 믿기 어려운 작은 diff에는 [`/dstack:blast-radius`](../../skills/blast-radius/SKILL.md)가 그 변경이 다른 곳에서 무엇을 깨뜨릴 수 있는지 찾는다. 변경을 안전하게 만드는 사실 하나를 찾아서, 논증이 아니라 코드를 돌려 그 사실을 증명한다.

## 측정한 수치 점검하기

전후 수치는 실수로 틀리기 가장 쉬운 증거다. 데워진 캐시, 한쪽만 디버그 빌드, 측정 구간 안에서 한 번도 돌지 않은 일은 각각 그럴듯한 속도 향상을 만들 수 있다. 수치를 보고하거나 그것에 따라 행동하기 전에 입력한다.

```text
/dstack:benchmark-checklist vet the export speedup before it goes in the commit message
```

[`/dstack:benchmark-checklist`](../../skills/benchmark-checklist/SKILL.md)는 일곱 가지를 묻고, 각각에 실행에서 나온 증거를 요구한다.

1. 수치를 제한하는 것은 무엇이고, 왜 두 배가 아닌가?
2. 모든 쪽이 운영 환경처럼 튜닝된 상태로 돌았는가?
3. 디스크 대역폭이나 코어 수 같은 물리적 한계를 깨는 결과인가?
4. 오류가 났거나 잘못된 출력을 돌려준 것이 있는가?
5. 번갈아 돌린 실행에서 중앙값과 범위로 재현되는가?
6. 사용자가 기다리는 경로의 끝에서 끝까지 의미가 있는가?
7. 일이 실제로 측정 구간 안에서 일어났는가?

판정은 faster, slower, no measurable difference, inconclusive 중 하나로 돌아오고, 실행 횟수, 범위, 제한 요인이 붙는다. 제한 요인을 대지 못하거나 한쪽이 튜닝되지 않은 채 돌았으면 inconclusive라고 말한다. `/dstack:d-mode`는 Perf issue와 Hillclimb 플레이북 안에서 이 체크리스트를 이미 돌린다. 그러니 그 밖에서 무언가를 측정했을 때, 또는 다른 사람의 수치가 너무 좋아 보일 때 직접 입력한다. [Explain the Number 원칙](../../skills/principle-explain-the-number/SKILL.md)의 실무 형태다.

## 프로젝트 검증 스킬 만들기

위의 UI 항목에는 실제 요구 사항이 숨어 있다. 에이전트에게 앱을 조작하는 스크립트 방식의 길이 있어야 한다. 프로젝트에 이미 있다면 좋다. 없다면 실행한다.

```text
/dstack:create-verification-skill
```

[`/dstack:create-verification-skill`](../../skills/create-verification-skill/SKILL.md)은 사용자가 아니라 저장소를 인터뷰한다. 앱 사용자가 무엇을 만지는지, 앱이 로컬에서 어떻게 뜨는지, 무엇이 앱을 조작할 수 있는지(먼저 이미 있는 하네스, 없으면 브라우저와 CDP, PTY, 순수 HTTP), 어떤 증거가 동작을 증명하는지, 인스턴스 둘이 나란히 돌 수 있는지를 알아낸다. 코드가 답하지 못하는 것만 사용자에게 묻는다.

결과로 `.claude/skills/verify-<app>/`를 쓴다. 정확한 Launch, Doctor, Drive, Evidence, Cleanup 절과, 스크립트를 싣는다면 Helpers 절이 있는 에이전트용 지침이다. `features/` 아래에는 앱이 하는 일과 각 기능이 동작한다는 것을 무엇이 증명하는지를 색인한 기능 지도가 붙는다. 스킬에는 README 색인과, 필수 H2 네 개를 쓴 기능별 파일 하나씩으로 이루어진 [기능 지도 예제](../../skills/create-verification-skill/references/feature-map-example/)가 들어 있다. 넘겨주기 전에 생성기는 스킬을 처음부터 끝까지 한 번 증명한다. 실행, 점검(doctor), 기능 하나 조작, 증거 수집, 정리를 하고, 정리 뒤에도 증거가 남았는지 확인한다. 그 증명이 실패하면 결과물을 쓰지 않는다.

그때부터 "앱에서 검증해"는 이 저장소에서 어떤 에이전트든 준비 대화 없이 실행할 수 있는 단계가 된다. 증명을 특정한 형태로 받고 싶을 때는 프롬프트에 이름을 댄다.

```text
/dstack:d-mode build the bulk-archive action. use /verify-<app> to verify your changes and show me a video and screenshots as proof.
```

```text
/dstack:d-mode repro this with /verify-<app>. if it repros on main, fix it and show me a video as proof.
```

검증 스킬이 동작하면 [`/dstack:swarm`](../../skills/swarm/SKILL.md)이 기능 지도 항목별로 전체 점검을 나누고 결과를 모을 수 있다. 검증 워커 무리는 충분히 큰 표본으로 성능 개선을 확인하거나, push 전에 회귀를 찾으려고 앱을 퍼징하기도 한다.

검증 스킬은 일회용이 아니라 인프라로 다룬다. 커밋해서 팀의 모든 사람과 모든 에이전트가 같은 방식으로 앱을 조작하게 한다. 그런 다음 [레버를 만든다](../../skills/principle-build-the-lever/SKILL.md). 에이전트가 앱을 클릭해 보려고 버리는 스크립트를 계속 쓴다면, 스킬이 대신 부르는 작은 제어 CLI를 요청한다. 에이전트는 토큰을 덜 쓰고 모든 실행이 반복 가능해진다. 에이전트가 잘 쓰는 CLI에는 이런 특징이 있다.

- 얇은 명령 여러 개보다 실제 일을 하는, 조합할 수 있는 명령 몇 개.
- 파괴적인 모든 것에 `--dry-run` 옵션.
- 기능을 한꺼번에가 아니라 차츰 드러내는 하위 명령.
- 무엇을 대신 해야 하는지 알려 주는 오류 메시지.
- 풍부한 `--help` 문구.
- JSON 같은 기계가 읽을 수 있는 출력.

그 김에 개발 환경도 반복 가능하게 만든다. 시드 데이터, 테스트 사용자, 환경을 언제나 같은 방식으로 띄우는 명령 하나다.

## 검증 스킬을 정직하게 유지하기

앱은 바뀌고 기능 지도는 낡는다. 하루에 한 번은 돌리고, 아무도 기억할 필요가 없도록 `/loop`나 예약 작업으로 돌리는 것이 이상적이다.

```text
/dstack:maintain-verification-skill
```

[`/dstack:maintain-verification-skill`](../../skills/maintain-verification-skill/SKILL.md)은 생성된 스킬을 감사한다. 기능마다 읽기 전용 소스 읽기 에이전트를 병렬로 돌린 다음, 지도에 있는 모든 기능을 조작하는 실행 한 번을 한다. 결과는 정확히 세 가지 중 하나다. `clean`은 범위를 모두 덮었고 올릴 것이 없다는 뜻이다. `changed`는 검증된 수정 커밋 하나이고, 검증 스킬 자신의 폴더에만 한정된다. `blocked`는 막힌 이유를 적는다. 제품 코드는 절대 고치지 않는다. 실행 중에 제품 회귀를 잡으면 문서를 고쳐서 숨기지 않고 그 회귀를 보고한다.

## 정형 검증 스킬로 성질 증명하기

검증 스킬은 사용자가 조작하는 경로를 증명한다. 어떤 버그는 아무도 조작하지 않는 경로에 산다. 겹치는 재시도 두 개, 쓰는 도중 만료되는 잠금, 순서가 뒤바뀌어 도착하는 상태 변경이 그렇다. 테스트는 그런 경우에 거의 닿지 못한다. 그런 버그의 비용이 큰 코드라면 다음을 실행한다.

```text
/dstack:create-formal-verification-skill
```

[`/dstack:create-formal-verification-skill`](../../skills/create-formal-verification-skill/SKILL.md)은 코드에서 대상을 고른다. 코드가 하는 약속, 어겨지면 사용자가 피해를 보고 테스트가 그것을 깨는 경우에 거의 닿지 못하는 약속이다. 검증하기 가장 쉬운 것이 아니라 가장 강한 대상을 고른다. 영역이나 버그를 이름으로 대면 거기서 시작한다.

```text
/dstack:create-formal-verification-skill the job lease and retry logic. a job must never run twice at once.
```

질문이 도구를 고른다. 이벤트가 나쁜 순서로 일어날 수 있는지는 설계의 작은 모델에 대한 모델 검사기가 맞고, 어떤 언어에서든 그 기본은 TLA+다. 코드가 모든 입력에서 제대로 동작하는지는 코드 위에서 도는 검증기가 맞는다. 사용자의 언어에서 도는 검증기가 없으면 에이전트가 그렇다고 말하고, 손으로 쓴 함수 모델이 아니라, 생성한 입력으로 실제 코드를 시험한다. 모든 크기에서 성립해야 하는 성질에는 증명이 필요할 수 있다. 에이전트는 어떤 도구를 왜 골랐는지 알려 준다.

성질 하나를 검증하고, 그 성질이 코드의 망가진 변형에서 실패하는 것을 보여 준다. 실패하는 것을 본 적 없는 점검은 아무것도 증명하지 못하기 때문이다. 현재 코드가 이미 그 성질을 어기고 있으면 반례를 코드의 용어로 쓴 짧은 단계 순서로 받는다. 성질은 말한 그대로 두므로 발견은 발견으로 남는다. 요청하지 않으면 제품 코드는 바뀌지 않는다.

다음 에이전트에게 변경이 검증된 코드를 건드리는지, 점검을 명령 하나로 어떻게 돌리는지, 진짜 버그와 모델링 오류를 어떻게 구별하는지 알려 주는 프로젝트 전용 스킬을 쓴다. 넘겨주기 전에 생성기가 그 스킬을 성질을 깨는 임시 변경에 대해 한 번 따라 해 보고, 점검이 그것을 잡아야 한다. 넘길 때는 무엇을 어떤 도구와 범위로 검증했는지, 점검이 무엇을 찾았는지, 무엇은 덮지 못하는지를 말한다. 통과는 모델이나 범위를 덮는 것이지 시스템 전체를 덮는 것이 아니다.

스킬은 각 점검이 어떤 코드를 덮는지, 점검이 코드와 마지막으로 맞았던 커밋이 무엇인지도 적어 둔다. 스킬을 건너뛴 병합과 리팩터링은 사라진 코드의 설명 위에서 점검이 통과하게 만들 수 있다. 그 뒤에는 [`/dstack:maintain-formal-verification-skill`](../../skills/maintain-formal-verification-skill/SKILL.md)을 실행한다. 코드에서 검증을 갱신하고, 다시 돌리고, 갱신한 점검이 여전히 실패할 수 있음을 보여 주고, 각 실패가 검증의 어긋남인지 코드의 버그인지 알려 준다.

## 동작을 상태 차트로 보여 주기

모델 용어의 반례는 사용자를 납득시킨다. 그 동작을 소유한 기획자나 디자이너는 자기 용어로 봐야 한다. 실행한다.

```text
/dstack:statechart what the user sees when they edit a note offline
```

[`/dstack:statechart`](../../skills/statechart/SKILL.md)는 사용자가 보는 것을 Mermaid 상태 차트로 그린다. TLA+ 모델에서 생성하므로 그림과 검사한 모델이 어긋날 수 없다. 읽는 사람의 규칙("오프라인일 때는 Synced가 보이지 않는다")은 불변식이 된다. 차트는 규칙을 깨는 상태마다 표시하고, 보고서는 읽는 사람의 말로 거기까지 가는 가장 짧은 경로를 준다. 넘기기 전에 에이전트가 각 버그 경로를 실제 코드에서 재현하므로 모델링 오류가 버그로 읽는 사람에게 닿지 않는다.

## 커밋하고 main에 push한다

```text
/dstack:d-mode commit and push. small ordered commits, evidence in the commit body.
```

[Commit and push 플레이북](../../skills/d-mode/playbooks/commit-and-push.md)은 리뷰 요청 절차 없이 `main`에 직접 올린다. 문지기는 로컬 게이트 하나다. 올리는 바로 그 커밋에서 빌드와 테스트가 통과해야 하고, 올리는 방식은 fast-forward push뿐이다. 커밋 제목은 `type(scope): subject` 형식이고, 본문은 20줄 이하로 `Why:`, `What changed:`, `Verification:`을 쓴다. `Verification:` 줄에는 게이트 명령과 종료 코드가 들어간다.

여섯 단계로 요약하면 다음과 같다. 괄호는 플레이북의 단계 번호다.

1. 정리하고 스테이징한다(1~2단계). diff에서 설명하는 주석, 불필요한 방어 코드, 목적과 무관한 수정을 걷어 낸다. `git status --porcelain`을 읽고 경로로 스테이징한다. `git add -A`는 쓰지 않고, 비밀 값, 벤더 바이너리, 빌드 산출물은 스테이징하지 않고 `.gitignore` 줄을 제안한다.
2. 작은 커밋으로 나눈다(3단계). 커밋마다 따로 빌드되게 하고, 순서가 스스로 증명하게 정렬한다.
3. 게이트를 찾는다(4단계). 프로젝트 `CLAUDE.md`, `verify-<app>` 스킬, 언어 스킬 순서로 보고, 게이트를 처음 명시한 곳을 쓴다. 테스트 명령이 없는 프로젝트도 빌드와 실제 산출물 한 번 실행이 게이트다.
4. 올릴 커밋에서 게이트를 돌린다(5단계). 명령을 한 줄씩 실행하고 0이 아닌 종료 코드에서 멈춘다. 모든 명령이 이 HEAD에서 0으로 끝나야 통과다.
5. diff의 범위를 확인한다(6단계). `git diff --stat origin/main..HEAD`를 실행해 처음에 말한 목표 밖의 파일이 바뀌었으면, 통계를 보여 주고 push 전에 한 번 묻는다.
6. 원격과 맞추고 push한다(7~8단계). `git fetch origin main` 뒤에 `git merge-base --is-ancestor origin/main HEAD`의 종료 코드로 갈린다. 0은 그대로 push, 1은 `git rebase origin/main` 뒤에 게이트를 다시 돌리고, 그 밖의 값은 오류라서 멈춘다. `git push origin HEAD:main` 뒤에는 `git fetch origin main`을 다시 실행하고, `git rev-parse HEAD`와 `git rev-parse origin/main`이 같은지 확인한다.

단계가 실패하면 아래 표를 따른다. ID는 플레이북의 것과 같다.

| ID | 상황 | 보이는 것 | 할 일 |
|---|---|---|---|
| F01 | 내 커밋에서 게이트가 빨갛다 | 빌드나 테스트 명령이 0이 아닌 종료 코드로 끝난다 | push하지 않는다. 새 커밋으로 앞으로 고치거나, `origin/main`에 없는 커밋은 amend한다. 게이트 전체를 다시 돌린다 |
| F02 | 기준(base)에서도 게이트가 빨갛다 | 임시 worktree(`git worktree add --detach <dir> origin/main`)의 `origin/main`에서 같은 명령이 실패한다 | 기준의 실패를 한 줄로 보고한다. 기준에서 통과하는 명령이 내 커밋에서 하나도 실패하지 않을 때만 push한다. 임시 worktree를 지운다 |
| F03 | 게이트가 없다 | 빌드도 테스트도 없고 `dstack-gate: manual` 줄도 없다 | 커밋을 로컬에 둔 채 멈춘다. `verification: none available`을 보고하고 push 전에 묻는다 |
| F04 | 수동 게이트가 확인되지 않았다 | `dstack-gate: manual`이 선언돼 있는데 사용자가 이번 변경의 실행을 확인하지 않았다 | 무엇을 실행할지 알려 주고 한 번 묻는다. 무인 실행이면 커밋을 로컬에 둔 채 멈추고 `verification: manual run pending`을 보고한다 |
| F05 | push가 fast-forward가 아니라고 거절된다 | `! [rejected]`와 `fetch first` 또는 `non-fast-forward` | 누군가 먼저 push했다. 7단계로 돌아간다. 한 번의 실행에서 3번 거절되면 멈추고 보고한다 |
| F06 | rebase가 충돌에서 멈춘다 | `CONFLICT`, 그리고 `git status`가 rebase 진행 중이라고 보여 준다 | 양쪽이 모두 내가 바꾼 파일에 있고 옳은 결과가 분명할 때만 푼다. 아니면 `git rebase --abort`로 내 커밋을 되살리고, 충돌하는 두 커밋을 보고한다 |
| F07 | 작업 폴더에 내 것이 아닌 작업이 있다 | `git status --porcelain`에 내가 바꾸지 않은 파일이 나온다 | 스테이징하지 않는다. push에는 깨끗한 작업 폴더가 필요 없다. 7단계가 rebase해야 하면 `git rebase --autostash origin/main`을 쓴다. stash가 다시 적용되지 않으면 멈춘다. 작업은 `git stash list`에 안전하게 있고, 절대 버리지 않는다 |
| F08 | main이 아니라 worktree 브랜치에 있다 | `git branch --show-current`가 다른 이름을 출력한다 | worktree에서 `git rebase main`을 하고, 메인 체크아웃에서 `git merge --ff-only <branch>`를 한다. 그다음 거기서 5~8단계를 실행한다 |
| F09 | HEAD가 분리됐다 | `git branch --show-current`가 아무것도 출력하지 않는다 | `git switch -c d/<slug>`로 커밋을 브랜치에 보존한 뒤 F08처럼 처리한다 |
| F10 | 커밋 훅이 커밋을 거부한다 | `git commit`이 0이 아닌 종료 코드로 끝나고 훅의 출력이 나온다 | 훅이 보고한 것을 고치고, 고친 것을 경로로 스테이징하고, 다시 커밋한다. `--no-verify`는 절대 쓰지 않는다 |
| F11 | push 훅이나 서버가 push를 거부한다 | `pre-push hook` 출력 또는 `protected branch` | 정확한 메시지를 보고한다. `--no-verify`를 쓰지 않는다. 원격의 설정을 바꾸지 않는다 |
| F12 | 인증이 실패한다 | `Authentication failed`, `Permission denied`, 또는 답할 수 없는 자격 증명 요청 | 보고한다. 커밋은 로컬에 남는다. 자격 증명 도우미나 원격 URL을 바꾸지 않는다 |
| F13 | 실제 편집 없이 파일 전체가 바뀐 것으로 보인다 | `git diff --stat`이 모든 줄을 나열하고, 그 파일에 대한 `git diff -w --ignore-cr-at-eol`은 비어 있다 | 줄 끝이 뒤집혔다. 커밋하지 않는다. 실제 편집이 없으면 `git restore <file>`을 한다. 그 파일과 저장소의 `.gitattributes` 또는 `core.autocrlf` 설정을 보고한다 |
| F14 | 경로가 너무 길다 | Windows에서 체크아웃, rebase, worktree 추가 중 `Filename too long` | 보고하고 사용자가 실행할 해결책을 알려 준다. `git config --global core.longpaths true`다. 전역 git 설정은 직접 바꾸지 않는다 |
| F15 | `origin` 원격이 없다 | `git remote`가 아무것도 출력하지 않는다 | 커밋만 한다. 아무것도 push하지 않았다고 보고한다 |
| F16 | push한 커밋이 잘못된 것으로 드러난다 | 8단계 뒤에 점검이나 사용자가 문제를 찾는다 | `git revert <sha>`를 하고 게이트를 돌린 뒤 되돌림 커밋을 push한다. `origin/main`을 reset하거나 다시 쓰지 않는다 |

절대 하지 않는 것은 다섯 가지다.

- N1. `main`에 `git push --force`나 `--force-with-lease`.
- N2. 게이트가 빨갛거나 없거나 확인되지 않은 채로 하는 push. 이번 push에 대해 사용자가 분명한 말로 허락한 경우만 예외다.
- N3. 내가 만들지 않은 작업에 `git add -A`, `git stash drop`, `git reset --hard`.
- N4. 이미 `origin/main`에 있는 커밋을 다시 쓰는 `git commit --amend`나 rebase.
- N5. 커밋이나 push에 `--no-verify`.

셸에서 검증할 수 없는 프로젝트(E3D 안의 PML, 벤더 설치가 필요한 C#)는 프로젝트 `CLAUDE.md`에 `dstack-gate: manual` 한 줄을 선언해 수동 게이트를 쓴다. 사용자가 이번 세션에서 수동 실행이 통과했다고 확인해 줘야 게이트가 통과이고, 무엇을 실행했는지는 커밋 본문에 `Verification: manual (<실행한 것>)`으로 남는다. 무인 실행에서는 확인받을 수 없으므로 통과로 치지 않고 멈춘다(F04).

## 여러 건은 Autopilot으로

서로 독립인 변경이 여러 건이면 [Autopilot 플레이북](../../skills/d-mode/playbooks/autopilot.md)을 쓴다. 항목마다 담당 에이전트가 자기 worktree에서 만들고, 그것을 쓰지 않은 검증 에이전트가 증명한 것만 차례로 main에 올린다. 밤샘 큐는 [자는 동안 작업 돌리기](./07-overnight.md)에서 다룬다.

다음: [자는 동안 작업 돌리기](./07-overnight.md).
