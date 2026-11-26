# 원칙 이름으로 조종하기

dstack은 원칙 24개를 개별 스킬로 싣는다. `/dstack:d-mode`는 여러 단계로 이뤄진 작업이 시작될 때마다 그 색인을 읽고, 작업에 해당하는 원칙을 적용하고, 답에 적용한 원칙의 이름과 그것이 바꾼 결정을 함께 적는다.

원칙을 직접 부르지는 않는다. 이름으로 조종한다. 이름 하나는 에이전트가 이미 읽은 완전한 규칙을 가리키므로, 문구 하나가 지시 한 단락보다 정확하게 작업의 방향을 바꾼다.

## 실제로 조종하기

에이전트가 기존 어댑터 세 개 위에 새 어댑터를 덧붙이려 한다고 하자.

```text
use subtract before you add. delete the obsolete adapters first, then design what's left.
```

빌드가 통과했다는 이유로 성공했다고 주장한다고 하자.

```text
apply prove it works. run the real import flow and show me the written records.
```

병렬 시도 둘이 같은 브랜치에 쓰려 한다고 하자.

```text
separate before serializing shared state. give each attempt its own worktree, no locks.
```

문구가 통하는 것은 그 뒤의 규칙이 구체적이기 때문이다. 에이전트는 여전히 그 규칙이 어떤 결정을 바꿨는지 답에서 말해야 한다. 결정 없이 원칙만 인용했다면 에이전트가 규칙을 적용하지 않고 이름만 댄 것이다.

## 24개 한눈에

핵심 원칙은 얼마나 만들지, 언제 설계를 다시 생각할지를 정한다.

- [Laziness Protocol](../../skills/principle-laziness-protocol/SKILL.md)은 삭제와, 문제를 푸는 가장 작은 변경을 선호한다.
- [Foundational Thinking](../../skills/principle-foundational-thinking/SKILL.md)은 로직을 쓰기 전에 핵심 자료구조를 고른다.
- [Redesign from First Principles](../../skills/principle-redesign-from-first-principles/SKILL.md)는 새 요구를 처음부터 있었던 것처럼 통합한다.
- [Attack the Premise](../../skills/principle-attack-the-premise/SKILL.md)는 둘 이상의 실패한 수정이 공유한 전제를 적어 두고 다음 수정 전에 그것을 직접 시험한다.
- [Subtract Before You Add](../../skills/principle-subtract-before-you-add/SKILL.md)는 죽은 부분을 그 위에 쌓기 전에 걷어 낸다.
- [Minimize Reader Load](../../skills/principle-minimize-reader-load/SKILL.md)는 읽는 사람이 머릿속에 들고 있어야 하는 층과 숨은 상태를 접는다.
- [Outcome-Oriented Execution](../../skills/principle-outcome-oriented-execution/SKILL.md)은 다시 쓰기를 버릴 호환 상태를 보존하지 않고 목표 설계로 수렴시킨다.
- [Experience First](../../skills/principle-experience-first/SKILL.md)는 구현의 편의보다 사용자가 얻는 결과를 고른다.
- [Exhaust the Design Space](../../skills/principle-exhaust-the-design-space/SKILL.md)는 선례가 없으면 경쟁하는 프로토타입을 두세 개 만든다.
- [Build the Lever](../../skills/principle-build-the-lever/SKILL.md)는 작업을 하거나 증명하는 스크립트를 만들어 검토자가 다시 돌릴 수 있게 한다. 에이전트가 같은 일을 계속 손으로 하면, 있었으면 하는 도구나 스킬을 에이전트에게 직접 쓰게 한다. 스크립트가 한 단계를 매번 똑같이 할 수 있으면 스크립트를 쓰고, 에이전트는 판단이 필요한 곳에 아낀다.

설계 원칙은 상태, 검증, 호환성이 어디에 사는지를 정한다.

- [Model the Domain](../../skills/principle-model-the-domain/SKILL.md)은 반복되는 규칙을 흩어진 조건문이 아니라 하나의 구조에 담는다.
- [Boundary Discipline](../../skills/principle-boundary-discipline/SKILL.md)은 경계에서 검증하고 내부 타입은 믿는다.
- [Type System Discipline](../../skills/principle-type-system-discipline/SKILL.md)은 잘못된 상태를 표현할 수 없게 만든다.
- [Make Operations Idempotent](../../skills/principle-make-operations-idempotent/SKILL.md)는 재시도가 같은 끝 상태로 수렴하게 한다.
- [Migrate Callers Then Delete Legacy APIs](../../skills/principle-migrate-callers-then-delete-legacy-apis/SKILL.md)는 옮기는 일과 지우는 일을 한 번에 한다.
- [Separate Before Serializing Shared State](../../skills/principle-separate-before-serializing-shared-state/SKILL.md)는 조율을 더하기 전에 공유를 없앤다.

검증 원칙은 무엇을 증명으로 치는지 정한다.

- [Prove It Works](../../skills/principle-prove-it-works/SKILL.md)는 대리물이 아니라 실제 산출물을 검증한다.
- [Fix Root Causes](../../skills/principle-fix-root-causes/SKILL.md)는 코드를 바꾸기 전에 재현하고 원인까지 추적한다.
- [Sequence Work into Verifiable Units](../../skills/principle-sequence-verifiable-units/SKILL.md)는 작은 단위마다 점검으로 끝내고 나서 다음을 시작한다.
- [Test Behavior, Not Implementation](../../skills/principle-test-behavior-not-implementation/SKILL.md)은 코드의 사용자가 관찰할 수 있는 것을 단언해서, 그 동작이 깨지면 테스트가 실패하고 내부가 바뀌어도 살아남게 한다.
- [Explain the Number](../../skills/principle-explain-the-number/SKILL.md)는 측정한 수치를 누가 믿거나 보고하기 전에 무엇이 그것을 제한하는지 밝히고, 다른 것을 측정한 것이 아님을 배제한다. [`/dstack:benchmark-checklist`](../../skills/benchmark-checklist/SKILL.md)가 이것을 실제 실행으로 답하는 일곱 질문으로 바꾼다.

위임 원칙은 병렬 작업이 엉키지 않게 한다.

- [Guard the Context Window](../../skills/principle-guard-the-context-window/SKILL.md)는 대량의 읽기를 서브에이전트에 보내고 발견은 메인 대화에 둔다.
- [Never Block on the Human](../../skills/principle-never-block-on-the-human/SKILL.md)은 되돌릴 수 있는 일은 진행하고 결과를 보여 준다.

그리고 메타 원칙 하나가 있다.

- [Encode Lessons in Structure](../../skills/principle-encode-lessons-in-structure/SKILL.md)는 두 번 반복한 조언을 린트, 점검, 스크립트로 바꾼다. [`/dstack:correct`](../../skills/correct/SKILL.md)가 이것을 저장소 전체에 적용하는 방법은 [내 것으로 만들기](./09-make-it-yours.md#환경-고치기)에 있다.

목록을 외우지 않는다. 지금 훑어 두고, 여기 있는 이름 하나가 막았을 일을 에이전트가 하는 것을 볼 때 돌아온다. 어휘는 그렇게 몸에 붙는다.

다음: [내 것으로 만들기](./09-make-it-yours.md).
