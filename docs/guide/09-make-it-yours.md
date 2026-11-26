# 내 것으로 만들기

`d-mode`는 한 사람의 스타일이다. 그 밑의 플레이북, 라우팅, 모델 역할은 사용자의 스타일에도 똑같이 잘 맞는다. 이 쪽은 개인용 모드 만들기, 세션의 교훈 남기기, 에이전트가 실수를 반복하지 않도록 저장소 고치기, 한 가지 일에 집중한 스킬 쓰기, 스킬 변경을 믿기 전에 시험하기를 다룬다. 마지막에는 dstack 자체를 확장하는 문서로 안내한다.

생각보다 작게 시작한다. 첫날에는 스킬이 많이 필요하지 않고, 이 플러그인 전체도 필요하지 않다. 평범하게 프롬프트하고, 에이전트가 어디서 실패하는지 지켜보다가, 같은 실패가 두 번 나오면 스킬이나 점검을 더한다.

## `/dstack:automate-me`로 나만의 모드 만들기

```text
/dstack:automate-me
```

스타일을 설명할 필요는 없다. [`/dstack:automate-me`](../../skills/automate-me/SKILL.md)가 이력에서 읽어 내기 때문이다. 활성 작업 공간의 최근 대화록에서 답변, 위임, 검증, 코드, 글, 절차에 대해 반복되는 선호를 뽑아 내고, 어떤 패턴이 정말 사용자의 것인지 묻는다. 그다음 Authoring a skill 플레이북에 따라 `.claude/skills/<your-name>-mode/SKILL.md` 초안을 쓰고, 초안을 [`/dstack:unslop`](../../skills/unslop/SKILL.md)에 통과시키고, 그 스킬을 별도 커밋으로 올려서 다른 변경처럼 검토할 수 있게 한다.

습관이 달라질 때마다 다시 실행한다.

```text
/dstack:automate-me update my mode skill with everything since its last edit
```

갱신 모드는 스킬이 마지막으로 바뀐 뒤의 이력만 뽑는다. 반박하지 않은 규칙은 유지하고, 새 증거가 있는 규칙은 고치고, 새 패턴에 대해서만 절을 더한다.

## `/dstack:reflect`로 세션의 교훈 남기기

무언가를 가르쳐 준 작업이 끝난 직후에 실행한다.

```text
/dstack:reflect that took way too long. capture what we learned so the next run doesn't repeat it.
```

[`/dstack:reflect`](../../skills/reflect/SKILL.md)는 대화록을 읽고, 미래 에이전트의 작업을 바꿀 교훈만 남기고, 제안을 `Accepted`, `Rejected`, `Backlog`로 나눈다. 스킬을 바꾸기 전에 사용자의 승인을 기다린다. 미래의 결정을 바꿀 제안만 승인한다. 이상한 세션 하나는 일화이지 규칙이 아니다.

## 환경 고치기

같은 실수 때문에 에이전트를 계속 바로잡고 있다면, 고칠 곳은 다음 프롬프트가 아니라 저장소다. 얼마나 잘 버티는지로 방법의 순위를 매긴다.

1. 구조나 더 나은 자료구조로 실수를 불가능하게 만든다.
2. 타입으로 막거나, 오류 메시지가 고칠 방법을 말해 주는 린트나 CI 점검으로 막는다.
3. 테스트로 잡는다.
4. 문서나 에이전트 규칙으로 적어 둔다. 에이전트가 규칙을 건너뛰어도 실패하는 것이 없으므로 이것이 마지막이다.

사람의 검토는 목록에 없다. 커밋마다 같은 실수를 잡아야 하는 검토자가 바로 이 일이 고치려는 문제다. [`/dstack:correct`](../../skills/correct/SKILL.md)가 그 일을 한다.

```text
/dstack:correct agents keep calling the database client directly instead of going through the repository layer
```

최근 커밋, 되돌림, 검토 의견, 우회를 설명하는 주석을 읽고 실수를 부류로 묶는다. 한 부류는 두 번 일어나야 셈에 든다. 가장 빈번한 부류부터 커밋 하나씩, 통하는 가장 높은 수준에서 고치고, 새 점검이 실제 과거의 실수에서 실패한다는 것을 증명한다. 에이전트 지침 파일에는 규칙마다 그것을 강제하는 수단을 짝지운 표도 유지하므로, 아무것도 강제하지 않는 규칙은 반복으로 드러난다. 답은 부류마다 증거, 고른 수준, 더 높은 수준이 통하지 않은 이유를 나열한다.

인자 없이 실행하면 이력에서 스스로 부류를 찾는다. `/dstack:reflect`와 `/dstack:correct`는 일을 나눠 맡는다. `/dstack:reflect`는 세션 하나에서 스킬을 개선한다. `/dstack:correct`는 실수 부류가 돌아오지 못하게 저장소를 바꾼다. 고치는 방법이 새 경계라면 `/dstack:architect`와 짝지운다.

## 한 가지 일에 집중한 스킬 쓰기

붙잡아 두고 싶은 작업 흐름을 이미 알고 있을 때 쓴다.

```text
/dstack:d-mode write a skill for verifying database migrations in this repo
```

스킬 쓰기는 [Authoring a skill 플레이북](../../skills/d-mode/playbooks/authoring-a-skill.md)에 맞는다. 작성 플레이북이 frontmatter와 링크를 검증하고 commit and push 플레이북으로 올린다. 에이전트가 읽는 글은 사람이 읽는 글보다 기준이 높다. 도움이 안 되는 문장이 미래의 어느 에이전트가 따를 지시가 되기 때문이다. `SKILL.md`를 자유롭게 쓰지 말고 플레이북이 그 기준을 지키게 한다.

특수한 경우 둘은 전용 생성기가 있다. 앱을 조작하고 동작을 증명해야 하는 스킬은 검증 스킬이므로 [`/dstack:create-verification-skill`](../../skills/create-verification-skill/SKILL.md)과 [`/dstack:maintain-verification-skill`](../../skills/maintain-verification-skill/SKILL.md)을 쓴다. 모델 검사기, 증명, 다른 검증기로 코드의 성질을 확인하는 스킬은 정형 검증 스킬이므로 [`/dstack:create-formal-verification-skill`](../../skills/create-formal-verification-skill/SKILL.md)과 [`/dstack:maintain-formal-verification-skill`](../../skills/maintain-formal-verification-skill/SKILL.md)을 쓴다. 두 종류는 [검증하고 main에 올리기](./06-verify-and-ship.md#정형-검증-스킬로-성질-증명하기)에서 다룬다.

## `/dstack:technical-writing`으로 기준에 맞춰 문서 쓰기

스킬만이 사용자가 내놓는 글은 아니다. 문서, RFC, README, 커밋 메시지에는 이렇게 한다.

```text
/dstack:technical-writing review the readme changes
```

[`/dstack:technical-writing`](../../skills/technical-writing/SKILL.md)은 층을 이룬 기준을 적용한다. 목표는 지친 엔지니어가 한 번 읽고 이해하는 글이다. 먼저 문서의 방식(튜토리얼, 방법 안내, 참조, 설명)을 고르고, 그다음 문장 단위로 다듬는다. 누가 무엇을 하는지 분명히 하고, 문장 하나에 생각 하나를 담고, 두 가지로 읽히는 문장을 없앤다. 사용자나 에이전트가 방금 쓴 글을 검토하는 데 쓰거나, 문서를 요청할 때 미리 이름을 댄다.

## 스킬 변경을 눈가림으로 시험하기

스킬 수정은 앞으로의 모든 세션에 영향을 주므로 실험처럼 시험한다. 남이 만든 스킬을 들여올 때도 마찬가지다. 사용자의 작업에서 에이전트가 나아지는지 확인한 뒤에 유지한다.

```text
/dstack:d-mode run the eval playbook on this skill change. same task for both variants, candidates stay blind.
```

스킬이 계속 빗나가고 무엇을 해야 하는지 안다면 한 작업에서 바꾸고 시험한다.

```text
/dstack:d-mode update the review skill so it flags missing migrations, and eval the change.
```

평가를 처음부터 요청하면 수정이 정직하게 유지된다. 나쁜 세션 하나에서 쓴 수정은 그 세션에 과적합하기 쉽고, 수정이 쌓이면 스킬이 표류한다. 평가가 표류를 push 전에 잡는다.

[Eval 플레이북](../../skills/d-mode/playbooks/eval.md)은 실패 방식 하나, 관찰자 효과를 중심으로 짜여 있다. 평가받는 줄 아는 에이전트는 다르게 행동한다. 그래서 후보 에이전트는 자연스러워 보이는 작업을 흔적을 지운 디렉터리에서 받고, "eval"이나 "candidate"라는 말도, 서로의 존재도 알지 못한다. 심판 하나가 모든 출력을 중립적인 라벨로 채점하고, 스킬이 가리키는 파일을 차례로 따라 읽었는지는 후보가 주장한 것이 아니라 실제로 연 파일로 채점한다.

판정을 받아들이기 전에 모든 출력을 직접 읽는다. 심판과 의견이 다르면 자기 판단보다 먼저 기준표를 의심한다.

**함정:** 스킬이 말을 안 듣는다고 작업 도중에 스킬을 고치지 않는다. 별도 커밋으로 고치고 작업은 계속 진행한다. 기능 작업에 뒤엉켜 올라간 스킬 수정은 검토에서 보이지 않고 평가할 수도 없다.

## dstack 확장

dstack에 스킬, 플레이북, 언어 스킬을 더하는 규칙과 하위 호환 규칙은 [EXTENDING.md](../EXTENDING.md)에 있다. 원본에서 가져온 것과 달라진 점, 원본의 새 변경을 검토하는 절차는 [UPSTREAM.md](../UPSTREAM.md)에 있다.

다음: [레시피와 함정](./10-recipes-and-pitfalls.md).
