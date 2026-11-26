# 변경을 만들고 diff를 정리한다

구현 플레이북은 한 가지 규율을 공유한다. 관찰한 것을 말하고, 증거는 플레이북이 요구하게 한다. 이 쪽은 흔한 구현 작업마다 프롬프트에 무엇을 넣을지 보여 주고, diff를 검토하기 쉽게 유지하는 정리 습관을 다룬다.

## 구현 플레이북에는 아는 것을 담아 요청한다

버그 프롬프트는 증상을 말하고 재현부터 하라고 요청한다.

```text
/dstack:d-mode this command emits two records after a retry. repro first, then fix and verify.
```

기능 프롬프트는 동작과 바뀌면 안 되는 것을 말한다.

```text
/dstack:d-mode add a --json flag. text output stays byte-identical. verify both forms.
```

리팩터링 프롬프트는 구조를 옮기기 전에 동작을 고정한다.

```text
/dstack:d-mode move parsing into one module, zero behavior change. record the current output first and prove it's unchanged after.
```

성능 프롬프트는 느낌이 아니라 측정값을 말한다.

```text
/dstack:d-mode startup takes 1.8s on this fixture. trace it, fix the measured cause, show me before and after.
```

이 프롬프트들은 각자의 플레이북([Bug fix](../../skills/d-mode/playbooks/bug-fix.md), [Feature](../../skills/d-mode/playbooks/feature.md), [Refactoring](../../skills/d-mode/playbooks/refactoring.md), [Perf issue](../../skills/d-mode/playbooks/perf-issue.md))으로 간다. 입력하지 않은 단계는 플레이북이 채운다. 고치기 전에 재현하고, 구현하기 전에 데이터 모양을 정하고, 구조를 바꾸기 전에 동작을 고정하고, 최적화하기 전에 프로파일을 뜬다.

숫자 하나를 꾸준히 개선하려면 [Hillclimb 플레이북](../../skills/d-mode/playbooks/hillclimb.md)이 있다. 지표, 목표, 시도 횟수의 하한을 주면 측정 장치를 고정한 채 가설 하나씩 반복한다. 개선된 것은 남기고 나머지는 모두 되돌린다.

두 성능 플레이북은 자기 수치에 [`/dstack:benchmark-checklist`](../../skills/benchmark-checklist/SKILL.md)를 돌린다. Perf issue는 기준선과 그 뒤의 모든 수치를 점검하고, Hillclimb는 측정 장치를 고정하기 전에 점검한다. 언제 직접 입력하는지는 [검증하고 main에 올리기](./06-verify-and-ship.md#측정한-수치-점검하기)에 있다.

수정 전에 원인부터 알고 싶을 때가 있다. 누수, 유휴 CPU 점유, 화면 깨짐처럼 지금 일어나는 증상에는 [Runtime forensics 플레이북](../../skills/d-mode/playbooks/runtime-forensics.md)이 실행 중인 프로세스에 계측을 넣는다. 이미 받아 둔 프로파일에는 [Trace forensics 플레이북](../../skills/d-mode/playbooks/trace-forensics.md)이 자료를 읽고 시간을 가장 많이 쓰는 프레임(핫 프레임)을 소스에 대응시킨다. 둘 다 수정이 아니라 진단을 돌려준다.

```text
/dstack:d-mode here's a cpuprofile from the slow startup. tell me where the time goes and which source lines own it. no fix yet.
```

## `/dstack:tdd`로 실패하는 테스트부터 쓴다

버그에 싼 로컬 테스트 경로가 있으면 프롬프트 전체가 두 단어일 수 있다.

```text
/dstack:tdd implement
```

맥락이 있으면 그것으로 충분하다. [`/dstack:tdd`](../../skills/tdd/SKILL.md)는 의도한 이유로 실패하는 가장 작은 테스트를 쓰고, 그다음 수정을 쓰고, 테스트를 다시 돌린다. 테스트가 넓은 하네스 설정이나 깨지기 쉬운 목(mock) 객체를 요구하면 스킬이 그렇게 말하고 가장 가까운 실행 가능한 점검을 대신 쓴다. 실제 명령이 더 강한 증거인 곳에 테스트를 억지로 만들지 않는다.

## 언어 규칙 스킬

언어별 규칙 스킬은 그 언어의 규칙과, Commit and push 플레이북이 게이트로 돌리는 빌드와 테스트 명령을 담는다. 새로 만든 C#, Python, Rust, PML 스킬 4종은 해당 확장자의 파일을 열면 자동으로 로드된다. TypeScript 스킬은 파일을 열어도 자동으로 로드되지 않는다. d-mode는 `.ts`나 `.tsx` 파일을 고치기 전에 이 스킬을 직접 읽고, d-mode 밖에서는 이름으로 불러서 쓴다.

| 스킬 | 대상 파일 | 게이트 명령 | 로드 |
|---|---|---|---|
| `csharp-best-practices` | `.cs`, `.csproj`, `.sln`, `.xaml` | `dotnet build -c Release`, `dotnet test -c Release --no-build` | 자동 |
| `python-best-practices` | `.py`, `pyproject.toml` | `python -m pytest` | 자동 |
| `rust-best-practices` | `.rs`, `Cargo.toml` | `cargo build`, `cargo test` | 자동 |
| `pml-best-practices` | `.pmlfnc`, `.pmlfrm`, `.pmlobj`, `.pmlmac`, `.mac` | 수동 게이트. 프로젝트 `CLAUDE.md`의 `dstack-gate: manual` 한 줄 | 자동 |
| [`typescript-best-practices`](../../skills/typescript-best-practices/SKILL.md) | `.ts`, `.tsx` | 규칙만 담고 있다. 명령은 프로젝트 `CLAUDE.md`를 따른다 | d-mode가 읽는다. 그 밖에는 `/dstack:typescript-best-practices` 입력 |

포맷터, 린터, 타입 검사 명령은 프로젝트가 그렇게 설정돼 있을 때만 게이트에 들어간다. 조건은 도구마다 다르다. `dotnet format`은 저장소에 `.editorconfig`가 있을 때, `ruff`와 `mypy`는 `pyproject.toml`의 해당 절이나 설정 파일이 있을 때, `cargo fmt`와 `cargo clippy`는 그 구성 요소가 설치돼 있을 때다. 설정이 없는 프로젝트에 가상 환경을 만들거나 패키지를 설치해서 게이트를 맞추지 않는다. 각 스킬의 명령과 조건은 [csharp-best-practices](../../skills/csharp-best-practices/SKILL.md), [python-best-practices](../../skills/python-best-practices/SKILL.md), [rust-best-practices](../../skills/rust-best-practices/SKILL.md), [pml-best-practices](../../skills/pml-best-practices/SKILL.md)에 있다.

## 커밋하기 전에 정리한다

[Commit and push 플레이북](../../skills/d-mode/playbooks/commit-and-push.md) 1단계가 커밋하기 전에 diff를 정리하고, d-mode가 커밋 본문에 [`/dstack:unslop`](../../skills/unslop/SKILL.md)을 적용한다. 1단계는 설명하는 주석, 호출자가 필요로 하지 않는 방어 코드, 죽은 호환 경로, 디버그 출력, 목적과 무관한 수정을 걷어 낸다.

글에는 `/dstack:unslop`이 대상과 추가 규칙을 받는다.

```text
/dstack:unslop the readme changes, no emdashes
```

자기만의 줄임말이 생길 것이다. 스킬은 `unslop that, tighten it`처럼 짧은 프롬프트에서도 의도를 잘 읽는다.

## `/dstack:no-comments`로 주석 걷어내기

주석은 따로 한 번 걸러야 하고, 그것을 쓴 에이전트가 해서는 안 된다. 작성자는 사용자가 자기 주석을 옹호하듯 자기 주석을 옹호한다. 그러니 검토 전에 새 눈에게 넘긴다.

```text
/dstack:no-comments the diff
```

[`/dstack:no-comments`](../../skills/no-comments/SKILL.md)는 [Comment Sicko](../../agents/comment-sicko.md)를 띄운다. 짧은 보존 목록을 가진 읽기 전용 검토자다. 라이선스 머리말, 공개 API의 문서 주석, 코드가 말해 주지 못하는 것을 설명하는 링크, 바꿀 수 없는 외부 의존성이 강제하는 동작은 남긴다. 나머지는 모두 지운다. 자기 코드의 놀라운 부분에는 그런 예외가 없다. 주석은 리팩터링 신호로 돌아오고, `/dstack:no-comments`는 받아들인 신호를 근본 원인에서 고친다. 주석이 "do not remove" 같은 제약을 주장하면 스킬이 그 주장을 타입, 테스트, 린트로 옮기자고 제안한다. 어느 쪽이든 주석은 지운다.

역할 분담을 분명히 해 둘 만하다. Commit and push 플레이북의 1단계가 코드에서 군더더기를 걷어 내고, `/dstack:unslop`이 글에서 걷어 내고, `/dstack:no-comments`가 주석을 쓰지 않은 검토자에게 주석을 넘긴다.

**함정:** 정리는 선택 사항인 마감이 아니다. 설명하는 주석과 방어용 군더더기가 남은 diff는 검토자에게 미완성으로 읽히고, 불필요한 코드는 다음 버그가 숨는 자리다. diff가 부풀었다고 느껴지면 검토에서 지적받은 뒤가 아니라 커밋하기 전에 `clean the diff`라고 말한다.

다음: [검증하고 main에 올리기](./06-verify-and-ship.md).
