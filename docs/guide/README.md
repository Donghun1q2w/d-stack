# dstack 가이드

dstack은 에이전트에게 일일이 지시하지 않을 때 가장 잘 돌아간다. 원하는 결과와 끝났다는 것을 어떻게 알 수 있는지만 말하면 된다. `/dstack:d-mode`가 플레이북을 고르고, 단계가 필요로 할 때 다른 스킬을 실행하고, 증거를 보여 준다. 이 가이드는 실제에 가까운 프롬프트로 그 습관을 익히게 한다.

배울 내용은 다음과 같다.

1. [dstack 설치](./01-setup.md). 플러그인을 설치하고 모델을 고른다.
2. [`/dstack:d-mode`로 작업 보내기](./02-d-mode.md). 목표를 주면 플레이북을 고르는 과정을 지켜본다.
3. [코드 이해하기](./03-understand.md). 고치기 전에 읽기 전용 조사와 `/dstack:how`, `/dstack:why`, `/dstack:teach`, `/dstack:recall`을 쓴다.
4. [변경 설계하기](./04-design.md). 코드의 모양이 굳기 전에 `/dstack:architect`, `/dstack:arena`, `/dstack:swarm`, `/dstack:interrogate`, 프로토타입, 계획서를 쓴다.
5. [변경 만들고 정리하기](./05-build-and-clean.md). 구현 플레이북, `/dstack:tdd`, `/dstack:unslop`, `/dstack:no-comments`를 쓴다.
6. [검증하고 main에 올리기](./06-verify-and-ship.md). 실제 앱에서 동작을 증명하고, 수치를 검증하고, 로컬 검증을 통과한 커밋을 main에 올린다.
7. [자는 동안 작업 돌리기](./07-overnight.md). 루프 전에 신뢰를 쌓고, 밤샘 계약을 정하고, 나중에 감사할 수 있는 결정 기록을 남기고, 여러 건의 큐는 Autopilot으로 처리한다.
8. [원칙 이름으로 조종하기](./08-principles.md). 작업 도중 에이전트의 방향을 바꾸는 24개의 이름이다.
9. [내 것으로 만들기](./09-make-it-yours.md). 나만의 모드, 반복되는 실수를 고치는 `/dstack:correct`, 스킬 변경을 시험하는 방법을 다룬다.
10. [레시피와 함정](./10-recipes-and-pitfalls.md). 그대로 쓸 프롬프트와 피할 실수를 모았다.

처음에는 순서대로 읽는다. 그 뒤에는 각 쪽이 따로 읽힌다.

막혔거나 어떤 스킬이 맞는지 모르겠으면 질문과 함께 [`/dstack:d-help`](../../skills/d-help/SKILL.md)를 입력한다.

```text
/dstack:d-help which skill should i use to review this branch?
```

`/dstack:d-help`는 질문에 답하고, 보낼 프롬프트를 건네고, 답의 출처인 스킬이나 가이드 쪽을 링크한다. 작업은 시작하지 않는다. dstack 실행은 토큰을 실제로 쓰기 때문에, 준비가 됐을 때 사용자가 그 프롬프트를 직접 보낸다. 사용자가 입력할 때만 돈다.

## 하나만 기억한다면

에이전트에게 목표와 그것을 확인할 방법을 사용자 자신의 말로 준다.

```text
/dstack:d-mode the export writes duplicate rows when a retry lands mid-run. repro first, then fix and verify.
```

플레이북 이름을 대거나 스킬을 나열할 필요는 없다. "repro first"와 확인할 수 있는 결과가 `/dstack:d-mode`에게 필요한 라우팅 신호의 전부다. `/dstack:d-mode`는 Bug fix 플레이북을 고르고, 그 단계를 할 일 목록에 옮기고, 단계마다 맞는 스킬을 부른다.

다음: [dstack 설치](./01-setup.md).
