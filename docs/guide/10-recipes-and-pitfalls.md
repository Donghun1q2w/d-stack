# 레시피와 함정

복사해 쓸 만한 프롬프트와, 누구나 한 번은 하는 실수를 모았다. 경로와 종료 조건은 자기 것으로 바꿔 쓴다. 레시피는 일부러 격식 없이 썼다. 실제로 그렇게 입력하고, 스킬은 의도를 잘 읽기 때문이다.

![한 사람이 완성된 요리를 맛보는 동안 로봇들이 레시피 상자를 보며 요리하고, 조리대 위에는 카드가 줄지어 꽂혀 있는 그림.](./images/recipes.jpg)

## 낯선 서브시스템 이해하기

```text
use /dstack:how first to understand how this initialization works. then use /dstack:why to figure out why it broke recently.
```

동작 원리가 먼저고 이력이 그다음이다. 스킬마다 보고서가 어떤 출처를 뒤졌는지 알려 주므로, 답이 무엇에 근거하는지 알 수 있다.

## 코드를 건드리기 전에 잡음 많은 보고를 다시 설명하게 하기

```text
/dstack:d-mode read this thread. restate the underlying issue in your own words, in plain english. don't change any code yet.
```

오해는 다시 설명에서 드러나고, 거기서는 메시지 한 번으로 바로잡는다. 에이전트가 자기 이해를 먼저 말할 때까지 사용자의 원인 추측은 말하지 않는다. `/dstack:in-your-own-words`는 플레이북 없이 다시 설명만 요청한다.

## 보내기 전에 프롬프트 다듬기

```text
/dstack:sharpen write the onboarding doc for the new billing service.
```

에이전트는 전문가라면 요청받지 않아도 했을 일, 시작할 날것의 자료, 방법과 도구, 결과가 맞는지 바깥에서 확인하는 방법을 말한다. 그것을 요구하도록 다시 쓴 프롬프트를 돌려주고, 작업은 하지 않는다. 다시 쓴 것이 맞게 읽히면 그것을 보낸다.

## 고르기 전에 프로토타입

```text
/dstack:d-mode prototype a few options for the settings layout. put them behind a switcher and send me screenshots of each.
```

설명이 아니라 돌아가는 것에서 고른다. 에이전트는 그 과정에서 레이아웃과 타이밍에 대한 자기 질문에 스스로 답한다.

## 정해진 설계를 계획서로 바꾸기

```text
/dstack:d-mode turn this design into a plan. small verifiable commits, each with its own proof.
```

설계가 정해진 뒤에만 요청한다. 계획서가 산출물이고, 그것을 실행할 플레이북의 이름을 적는다.

## 설계에 두 번째 의견 받기

```text
ask /dstack:arena for a second opinion on this thread and our approach
```

지금의 설계가 여러 후보 가운데 하나가 되고, 종합 결과가 패널이 더 나은 것을 찾았는지, 아니면 지금 가진 설계를 확인해 줬는지 알려 준다. 되돌리기 비싼 설계에 비하면 비용이 적다.

## 독립된 조각을 병렬로 점검하기

```text
/dstack:swarm check every package under packages/ against its check.ps1. one worker per package. one report.
```

워커마다 패키지 하나를 맡는다. 부모는 모든 조각을 기다렸다가 워커의 원본 출력 대신 `PASS`, `ISSUES`, `BLOCKED` 보고서 하나를 돌려준다.

## 브랜치를 회의적으로 검토하기

```text
/dstack:interrogate the whole branch, but skeptically. don't change anything yet. no nitpicks unless it's an actual bug or regression in behavior.
```

수식어가 실제로 일을 한다. "don't change anything yet"은 읽기 전용으로 두고, 사소한 지적을 금지하는 규칙은 잡음을 미리 걸러 검증된 지적이 시간을 쓸 만하게 만든다.

## 실패하는 테스트로 버그 고치기

```text
/dstack:d-mode repro the duplicate write first. if there's a cheap test path, /dstack:tdd it. then fix and rerun.
```

"if there's a cheap test path"가 중요하다. 깨지기 쉬운 목(mock) 객체로 테스트를 억지로 만들면 실제 명령을 돌리는 것보다 증명하는 것이 적고, 플레이북은 그렇게 말해도 된다.

## 증명과 함께 보고를 재현하고 고치기

```text
/dstack:d-mode repro this with /verify-<app>. if it repros on main, fix it and show me a video as proof.
```

"if it repros on main"은 버그가 이미 사라졌을 때 실행이 일찍 멈추게 한다. 영상으로 diff를 읽기 전에 수정을 확인할 수 있다.

## 테스트가 거의 닿지 못하는 성질 증명하기

```text
/dstack:create-formal-verification-skill the retry queue. a message must never be delivered twice.
```

정해 둔 범위의 모든 경우에서 확인한 성질 하나, 코드가 이미 그것을 어기고 있다면 코드의 용어로 쓴 반례, 그 코드를 바꾸는 모든 변경에서 다음 에이전트가 돌리는 프로젝트 전용 스킬을 받는다.

## 올리기 전에 수치 점검하기

```text
/dstack:benchmark-checklist vet this 40% speedup before it goes in the commit message
```

faster, slower, no measurable difference, inconclusive 중 하나를 받고, 실행 횟수, 범위, 수치를 제한하는 것이 붙는다.

## 같은 실수 바로잡기를 그만두기

```text
/dstack:correct agents keep adding new config flags without registering them in the schema
```

수정은 구조, 타입, 린트, 테스트로 저장소에 들어가므로 다음 에이전트가 그 실수를 할 수 없다.

## 작업을 시작하지 않고 방법 묻기

```text
/dstack:d-help how do i keep d-mode on in a new session?
```

답, 보낼 프롬프트, 출처 링크를 받는다. 그 프롬프트를 보내기 전에는 아무것도 돌지 않는다.

## 자리를 비운 사이 실행을 정직하게 유지하기

```text
im going to bed, keep going autonomously until every fixture passes. do not stop. keep a decision log i can audit in the morning.
```

전체 계약은 [밤샘 쪽](./07-overnight.md)에 있다. 작업과 종료 조건이 이미 대화에 있으면 짧은 형태로도 통한다.

## 표류하는 실행 바로잡기

조종하는 프롬프트는 한 줄이다.

```text
i said the goal is to repro. i did not ask for a fix yet.
```

```text
apply prove it works. show me the real output, not the build log.
```

```text
/dstack:unslop that, no emdashes
```

더 많은 말은 거의 필요 없다. 필요한 것은 맞는 이름이고, [원칙 쪽](./08-principles.md)이 그 어휘다.

## 쉬운 말로 답 받기

```text
/dstack:bro
```

프롬프트는 이것이 전부다. [`/dstack:bro`](../../skills/bro/SKILL.md)는 마지막 메시지를 사람이 다른 사람에게 말하듯, 전문 용어 없이, 더 짧게 다시 말한다. 답이 기술적으로는 충실한데 무슨 말인지 모르겠을 때 쓴다.

## 놓아 둔 대화 따라잡기

```text
/dstack:ketchup
```

[`/dstack:ketchup`](../../skills/ketchup/SKILL.md)은 마지막 메시지 이후 무엇이 바뀌었는지를 쉬운 말로 알려 주고, 사용자를 기다리는 결정마다 추천, 증거, 위험을 나열한다. 보고하는 동안 아무것도 바꾸지 않는다.

따라잡기를 영상으로 보려면 [`/dstack:ketchup-video`](../../skills/ketchup-video/SKILL.md)를 돌린다. 무슨 일이 있었는지를 자막이 달린 짧은 슬라이드 영상으로 보여 주고, 사용자를 기다리는 결정은 그 아래 글로 나열한다.

## 함정

- **프롬프트에 스킬 나열하기.** `use /dstack:architect then /dstack:arena then /dstack:interrogate`는 플레이북이 이미 순서를 정해 둔 단계를 뒤섞는다. 목표와 제약을 말한다. 기본값을 바꾸고 싶을 때만 스킬 이름을 댄다.
- **막연한 종료 조건.** "make it better"는 `/loop`에 확인할 것을 주지 않는다. 통과하거나 실패할 수 있는 명령이나 산출물을 준다.
- **원인 이론으로 시작하기.** 에이전트는 사용자가 가리킨 곳을 뒤진다. 먼저 문제를 다시 설명하게 하고, 그다음 감을 말한다.
- **첫 설계 받아들이기.** 시도를 한 번만 하면 모델이 처음 떠올린 모양에 갇힌다. 프로토타입이나 `/dstack:architect`를 요청하고 증거로 고른다.
- **추상적인 계획 다듬기.** 코드가 없는 계획에 적대적 검토를 하면 일어나지 않을 위험을 지어낸다. 열린 질문은 프로토타입으로 정리하고, 만들어진 것을 검토한다.
- **한 worktree에서 도는 병렬 에이전트.** 서로 덮어쓰고, 누가 무엇을 바꿨는지 아무도 알 수 없다. "own worktree per attempt"라고 말한다.
- **루프를 믿기 전에 루프 돌리기.** 자기 작업을 검증하지 못하는 루프는 확인되지 않은 작업을 더 빨리 만들 뿐이다. 검증 스킬이 먼저 동작하게 한다.
- **점검하지 않은 수치 믿기.** 데워진 캐시나 건너뛴 코드 경로가 속도 향상을 꾸며 낼 수 있다. 수치를 어디에 쓰기 전에 `/dstack:benchmark-checklist`를 돌린다.
- **같은 실수를 손으로 바로잡기.** 대화에서 한 교정은 한 번의 실행에만 도움이 된다. `/dstack:correct`는 저장소를 고쳐서 이후의 어떤 실행도 반복하지 못하게 한다.
- **범위 확인에 `/dstack:arena` 쓰기.** `/dstack:arena`는 설계나 코드 브리프 하나를 반복하고, 기반을 고르고, 가장 좋은 부분을 접목한다. `/dstack:swarm`은 조각이나 선언된 경주 갈래를 나누고 보고서 하나로 모은다.
- **모든 검토 의견 받아들이기.** 봇도 사람도 진짜 지적과 잡음을 한 목록에 올린다. `/dstack:interrogate`는 다시 돌려서 증명되는 지적만 남기고 버린 것과 이유를 나열하며, 어느 쪽이든 사용자가 뒤집을 수 있다.
- **`inherit`를 모델 이름으로 착각하기.** `inherit`는 "모델 필드를 생략해 서브에이전트가 부모 대화의 모델을 쓴다"는 뜻이다. 역할은 [설치](./01-setup.md)에서 다룬다.
- **초록색 빌드만 보고 성공 보고하기.** 빌드는 컴파일된다는 것만 증명한다. 실제 명령, 흐름, 저장된 값, 프로파일을 요청하고, 답에 증거가 있기를 기대한다.
- **`SKILL.md`를 자유롭게 쓰기.** 검증과 검토가 일어나도록 [Authoring a skill 플레이북](../../skills/d-mode/playbooks/authoring-a-skill.md)을 거친다.
- **PowerShell 5.1에서 두 명령을 연결 연산자로 잇는다.** Windows PowerShell 5.1에는 `&&`도 `||`도 없어서 명령이 구문 오류로 끝나고, `;`로 이으면 앞 명령이 실패해도 다음 명령이 돈다. 에이전트가 실행하는 게이트는 한 줄에 명령 하나인 목록으로 쓰고, 한 줄씩 실행하다가 0이 아닌 종료 코드에서 멈춘다.
- **검증 없이 push를 요청한다.** 게이트가 없거나 빨간 채로 "그냥 올려"라고 하면 에이전트는 멈추고 되묻는다([N2](./06-verify-and-ship.md#커밋하고-main에-push한다)). 이번 push에 대해 분명한 말로 허락해야만 올라가고, 그렇게 올라간 변경은 아무도 검증하지 않은 것이다. 확인 방법을 먼저 주고 push는 게이트가 통과한 뒤에 맡긴다.

이것이 가이드의 전부다. 건너뛰어 왔다면 [설치](./01-setup.md)로 돌아가 실제 작업 하나를 돌려 본다. 습관은 읽어서가 아니라 써서 몸에 붙는다.

[가이드 목차](./README.md)로 돌아간다.
