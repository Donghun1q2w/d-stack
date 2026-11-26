# dstack 설치

이 쪽에서는 플러그인을 설치하고, dstack이 쓸 모델을 고르고, 첫 작업을 실행한다. 설치는 명령 두 줄, 설정은 명령 하나와 짧은 대화로 끝난다.

## 플러그인 설치

Claude Code 대화창에서 실행한다.

```text
/plugin marketplace add Donghun1q2w/d-stack
/plugin install dstack@d-stack
```

Claude Code는 플러그인 명령에 접두사를 붙인다. 그래서 이 가이드의 dstack 명령은 모두 `/dstack:setup-dstack`처럼 `/dstack:`으로 시작한다.

## 모델 고르기

실행한다.

```text
/dstack:setup-dstack
```

[`/dstack:setup-dstack`](../../skills/setup-dstack/SKILL.md)은 사용할 수 있는 모델을 찾고, 추론 예산을 묻고, 역할(코드 위임, 판단, 리뷰 패널)마다 값을 보여 주며 무엇을 원하는지 묻는다. 질문에 답하면 `%USERPROFILE%\.claude\rules\dstack-models.md`를 쓴다. 모든 dstack 스킬이 읽는 작은 규칙 파일이다. 이 파일에는 세션이 명령을 실행하는 셸(Git Bash 또는 PowerShell)도 `shell:` 한 줄로 함께 기록된다.

기본값은 `large` 예산과 같다. 코드, 글, 판단은 Opus xhigh로 돌고, 패널과 swarm 워커는 high로 돈다. 어떤 역할도 xhigh를 넘지 않는다. 리뷰 패널 밖에서 Fable은 사용자가 그 작업에 Fable을 직접 지정했을 때, 또는 같은 브리프로 돌린 Opus 두 번이 점검에 실패한 뒤에만 돈다. `medium`은 각 역할을 한 단계, `small`은 두 단계 낮추고, 둘 다 토큰을 덜 쓴다.

신경 쓰는 것만 바꾸면 된다. 규칙에 줄이 없는 역할은 스킬의 기본값을 쓴다. 기본값으로 되돌리려면 그 역할의 줄을 지운다. `/dstack:setup-dstack`을 다시 실행하면 기본값과 모델이 다른 역할은 그대로 둔다. 기본값이 바뀌면, 바뀌기 전에 쓴 규칙은 `/dstack:setup-dstack`을 다시 실행할 때까지 옛 기본값을 붙들고 있다. 다시 실행하면 알아볼 수 있는 옛 기본값은 새 값으로 바꾸고, 어느 것을 바꿨는지 알려 주고, 나머지 선택은 유지한다. 알아보지 못하는 고정값을 없애려면 그 역할의 줄이나 파일을 먼저 지운다.

모델을 자동으로 따라가게 하고 싶을 수 있다. 역할 값을 `inherit`로 두면 dstack은 서브에이전트의 `model`과 `effort` 필드를 생략하고, 서브에이전트는 부모 대화의 모델을 그대로 쓴다. `inherit`는 모델 이름이 아니다. 패널 역할의 값은 목록이고, 항목마다 서브에이전트가 하나씩 돌기 때문에 목록 길이가 패널 크기를 정한다. `codex` 값은 패널 역할에만 쓸 수 있다. 다른 회사 모델 좌석이고 `codex:codex-rescue` 서브에이전트로 돈다. codex 플러그인이 설치돼 있지 않으면 그 좌석은 `opus high`로 대체되고, 대체됐다는 사실을 알려 준다. 설정은 `swarm workers`도 정한다. 비교 실행이 갈래마다 모델을 따로 정하지 않는 한 `/dstack:swarm`의 모든 워커가 쓰는 기본 모델이다.

## 검증 제안을 받아들이거나 넘기기

설정이 끝날 때 `/dstack:setup-dstack`은 프로젝트에서 앱 동작을 증명할 방법을 찾는다. `verify-*` 스킬이나 이미 있는 구동 장치(하네스)다. 둘 다 없으면 [`/dstack:create-verification-skill`](../../skills/create-verification-skill/SKILL.md)로 하나 만들어 주겠다고 한 번 제안한다.

수락하면 `.claude/skills/verify-<app>/`를 쓴다. 에이전트가 사용자처럼 앱을 조작하도록 가르치는 프로젝트 전용 스킬이다. 넘겨주기 전에 그 스킬이 실제로 동작하는지 한 번 증명한다. 거절하면 설정은 그대로 넘어간다. `/dstack:create-verification-skill`은 언제든 직접 실행할 수 있다. 자세한 내용은 [검증하고 main에 올리기](./06-verify-and-ship.md#프로젝트-검증-스킬-만들기)에 있다.

dstack이 처음이라면 수락한다. 자기 작업을 직접 확인할 수 있는 에이전트는 점검이 통과할 때까지 계속 간다. 그러지 못하는 에이전트는 모든 결과를 사용자에게 돌려보내 손으로 확인하게 만든다. 이 가이드의 모든 내용 가운데 검증 스킬의 효과가 가장 크다.

그다음 설정은 프로젝트에 정형 검증 스킬이 없으면, [`/dstack:create-formal-verification-skill`](../../skills/create-formal-verification-skill/SKILL.md)로 정형 검증 스킬을 하나 만들어 주겠다고 한 번 제안한다. 테스트는 누군가 쓰기로 한 경우만 확인한다. 정형 검증 스킬은 "작업이 한 번에 두 번 돌지 않는다" 같은 코드의 핵심 성질 하나를, 정해 둔 범위 안의 모든 경우에 대해 확인한다. 코드에 동시성, 재시도, 상태 기계, 파서가 있어서 버그의 비용이 크고, 깨지는 경우에 테스트가 거의 닿지 못한다면 수락한다. 그렇지 않으면 거절하고, 사정이 바뀌면 나중에 실행한다. [검증하고 main에 올리기](./06-verify-and-ship.md#정형-검증-스킬로-성질-증명하기)에 설명이 있다.

설정이 끝나면 새 대화를 시작한다. 모델 규칙은 새 세션에 적용된다.

## 비용 관리하기

dstack은 서브에이전트와 리뷰 패널에 토큰을 더 쓴다. 엄밀함의 대가다. 덜 쓰려면 다음과 같이 한다.

- `/dstack:setup-dstack`을 다시 실행해 더 작은 추론 예산이나 더 싼 모델을 고른다. 메인 대화에는 강한 모델을 두고 코드 역할에는 더 싸고 빠른 모델을 두는 구성이 좋다.
- 역할을 `inherit`로 두어 대화 자체의 모델로 돌린다.
- 패널 목록을 줄인다. 항목마다 서브에이전트가 하나씩 돈다.
- `/dstack:d-mode`는 엄밀함이 필요한 작업에만 쓴다. 작고 뻔한 수정에는 필요 없다.

## 첫 작업 돌려 보기

현실적이지만 작은 일을 골라 동료에게 설명하듯 말한다.

```text
/dstack:d-mode add a --json flag to this command. text output stays byte-identical. verify both.
```

할 일 목록을 지켜본다. 첫 항목들은 이 프롬프트에 맞춰 고른 플레이북, 여기서는 Feature 플레이북의 단계를 그대로 옮긴 것이다.

이후에는 평소처럼 후속 요청을 입력하면 된다. `/dstack:d-mode`는 한 번 입력하면 그 대화에 남는다. `/clear` 뒤나 새 세션에서는 다시 입력한다.

다음: [`/dstack:d-mode`로 작업 보내기](./02-d-mode.md).
