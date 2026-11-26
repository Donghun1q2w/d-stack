# 코드를 바꾸기 전에 이해한다

이해하지 못하는 코드를 고치는 일은 미묘한 회귀가 배포되는 경로이고, 이는 에이전트에게도 사용자에게도 마찬가지다. 에이전트는 대개 두 가지 방식으로 실패한다. 원하는 것을 잘못 읽거나, 일을 제대로 할 맥락이 없다. [프롬프트에 넣을 것](./02-d-mode.md#프롬프트에-넣을-것)이 첫 번째를 다룬다. 이 쪽은 두 번째를 다룬다.

dstack은 네 가지 입구를 준다. `/dstack:how`는 코드가 지금 무엇을 하는지 설명한다. `/dstack:why`는 코드가 그렇게 생긴 이유를 파헤친다. `/dstack:teach`는 둘을 하나의 설명으로 섞는다. `/dstack:recall`은 어떤 주제에 대한 사용자 자신의 최근 맥락을 다시 쌓는다. 넷 모두 에이전트가 자기 생각을 사용자가 확인할 수 있는 말로 설명하게 만든다. 사용자보다 코드를 더 잘 알지도 모르는 에이전트를 감독하는 방법이 이것이다.

![탐정이 돋보기로 기계 설계도를 살피는 동안 로봇들이 사건 파일을 가져오고, 뒤쪽 증거판이 단서들을 서로 잇는 그림.](./images/understanding.jpg)

## 읽기 전용 조사로 시작한다

원인이 분명하지 않으면 수정이 아니라 조사 결과를 요청한다.

```text
/dstack:d-mode investigate why background jobs time out every few hours. give me what we know, what data you used, and your best hypotheses. don't change any code yet.
```

"don't change any code yet"은 이 요청을 [Investigation 플레이북](../../skills/d-mode/playbooks/investigation.md)으로 보낸다. 코드를 추적하고, 동기에 대한 질문에는 `/dstack:why`를 더하고, 출처를 단 설명을 돌려준다. 선택지 사이의 결정이면 장단점 표가 붙은 추천을 돌려준다. "what data you used"를 물으면 에이전트가 증거와 추측을 구분하게 된다. 조사 결과가 수정을 가리키면 수정은 새 작업으로 시작한다.

## `/dstack:how`로 동작 추적하기

```text
/dstack:how do we dedupe notifications? is there an n+1 when we look up subscribers?
```

실제로 가진 질문을 그대로 묻는다. [`/dstack:how`](../../skills/how/SKILL.md)는 코드를 읽고, 서브시스템을 소개해 주는 시니어 엔지니어의 수준으로 실행 흐름, 핵심 타입, 자명하지 않은 부분을 답한다. 코드를 탐색하고 설명을 쓰는 읽기 전용 서브에이전트를 하나 띄운다.

## `/dstack:why`로 이력 파헤치기

```text
/dstack:why was the retry limit set to five? does the reason still hold?
```

[`/dstack:why`](../../skills/why/SKILL.md)는 코드가 아니라 기록으로 답한다. 코드를 들여온 변경과 이후의 모든 변경에 딸린 커밋과 커밋 메시지, 연결된 이슈를 읽고, 그 흔적이 빈약하면 다른 출처를 본다. 답은 작성자들이 쓴 것을 인용하고, 에이전트 자신의 추론은 추론이라고 표시하고, 기록이 답하지 못하는 것을 말한다. "아무도 이유를 적어 두지 않았다"도 하나의 답이기 때문이다.

둘은 자연스럽게 합쳐진다. 이력이 지금의 엉망을 설명할 것 같다면 `do why first then how`가 좋은 프롬프트다.

## `/dstack:teach`로 제대로 이해하기

```text
/dstack:teach me how this change alters retries. convince me it fixes the cause and not the symptom.
```

[`/dstack:teach`](../../skills/teach/SKILL.md)는 요약으로는 부족할 때 쓴다. `/dstack:how`와 `/dstack:why`를 돌리고(작은 변경이면 하나만 돌릴 수도 있다), 그 결과를 엮어, 도해를 하나씩 더해 가는 쉬운 설명으로 만든다. "convince me"라는 틀은 다시 쓸 만하다. 설명이 둘러보기가 아니라 시험해 볼 수 있는 논증이 된다.

에이전트 자신의 선택에도 쓸 수 있다.

```text
/dstack:teach me why you implemented it this way and not with a queue. what did you trade off, and why?
```

가르치는 일은 사용자만큼 에이전트에게도 도움이 된다. 자기 작업을 설명해야 하는 에이전트는 코드를 읽고 주장마다 증거를 대야 한다. 자신 있게 말하고 넘어갈 수 없다.

## `/dstack:recall`로 내 맥락 되살리기

```text
/dstack:recall catch me up on the export work from last week
```

[`/dstack:recall`](../../skills/recall/SKILL.md)은 사용자 자신의 최근 대화와 공유 기록(이슈, 이전 수정, 아직 발생하는 오류)을 뒤져서 지금 상태와 다음 할 일을 정리해 돌려준다. 옛 대화에는 새 에이전트에게 없는 맥락이 들어 있다. 그러니 옛 주제로 새 작업을 시작할 때는 먼저 그 맥락을 불러온 다음 새 입력을 넘긴다.

```text
/dstack:recall my work on the virtualized list from yesterday, then read this bug report.
```

특정 대화 하나를 이어 가고 싶다면 `/dstack:recall`이 아니라 아래의 Session pickup 플레이북을 쓴다.

## Session pickup으로 이전 작업 이어받기

다른 에이전트(또는 지난주의 사용자)가 브랜치를 중간에 두고 떠났을 때 쓴다.

```text
/dstack:d-mode take over this branch. read the decision log, figure out what's done, and continue from there. don't redo finished work.
```

[Session pickup 플레이북](../../skills/d-mode/playbooks/session-pickup.md)은 이전 기록을 권위 있는 것으로 취급한다. 브랜치 상태와 결정을 복원하고, 이어 갈 지점을 짚고, 물려받은 주장은 처음부터 다시 유도하지 않고 원래 목표에 비추어 검증한다.

**함정:** 이 쪽의 스킬을 "에이전트가 어차피 코드를 읽을 것"이라며 건너뛰지 않는다. 코드 흐름을 추적해 보지 않고 수정을 시작하는 에이전트는 처음 그럴듯해 보이는 자리에서 증상을 고치기 쉽다. `/dstack:how`를 먼저 하는 편이 두 번째 버그보다 싸다.

다음: [변경 설계하기](./04-design.md).
