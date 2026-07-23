# RoguelikeWorld(뱀서라이크) 예제 학습 가이드 — 프로젝트 관점 큐레이션

> 원본: [MSW-Git/GlobalContestExamples/04.RoguelikeWorld](https://github.com/MSW-Git/GlobalContestExamples/tree/main/04.RoguelikeWorld) — 실제 샘플 월드 기반 공식 튜토리얼 시리즈(한국어판 `ko/docs` 미러, 8편).
> 핵심 학습 축: **TriggerComponent vs CollisionService 충돌 감지 2방식** + **오브젝트 풀링** + DataSet 주도 무기/몬스터/레벨/강화 + DataStorage 기초.

## 읽기 규약 (에이전트)

- 원문은 **Maker 에디터 수동 조작 튜토리얼**(스크린샷·드래그 단계 포함)이다. 우리 프로젝트에서 같은 작업은 **MapBuilder/ModelBuilder/UIBuilder + .mlua 직접 편집**으로 수행한다 — 원문은 *패턴·구조 참조용*이지 절차 그대로 따라 하는 문서가 아니다.
- 원문은 RectTile + `KinematicbodyComponent` 톱다운 구성 — **이 프로젝트와 동일 플랫폼 조합**이라 코드 패턴이 거의 그대로 이식된다.
- 충돌/전투 구현 전에는 벤더 `msw-combat-system` 스킬 §1-7(충돌 기반 히트 감지 방식 선택표)을 먼저 — 이 예제의 2방식 구분과 같은 결론을 표로 제공한다.

## 문서별 요약 + 적용 포인트

| 문서 | 배우는 것 | 이 프로젝트 적용 포인트 |
|---|---|---|
| [00-overview.md](00-overview.md) | 시리즈 전체 구조, 폴더 구성(DataTable/Script/Type/Model/Resource) | 예제 폴더 분류 ≒ 우리 `directory-structure.md` 규칙과 동형 — 검증용 대조 |
| [01-world-environment.md](01-world-environment.md) | RectTileMap 특징, 맵 추가/형식 변경, TileSet 배치, `KinematicbodyComponent` 프로퍼티 | 우리 기본 플랫폼 조합과 동일 — 신규 맵 생성 시 참조. 맵 형식 변경은 파괴적(우리 규약: AI가 직접 전환 금지) |
| [02-character-select-ui.md](02-character-select-ui.md) | 캐릭터 선택 UI: DataSet 추가 → UI 자동 갱신 구조, Type 스크립트, `UIManageLogic`, `PlayerStatController` | **데이터 추가만으로 UI 갱신**되는 구조가 R3(데이터 주도)의 모범 사례. 직업/스킬 선택 화면 신설 시 구조 차용 |
| [03-player-attack.md](03-player-attack.md) | **TriggerComponent(엔티티 상주 콜라이더 겹침) vs `_CollisionService:GetSimulator(entity)`(코드 호출형 범위 질의)** 차이와 무기별 사용, 무기 DataSet, `WeaponDataLogic` | 신규 스킬/무기 판정 설계 시 1순위 참조. 우리 combat 스킬 §1-7 표와 함께 읽기 |
| [04-monster-system.md](04-monster-system.md) | 몬스터 DataSet·관리 Logic, **CollisionGroup 분리(Monster/Weapon/Player)**, 스폰, **오브젝트 풀**(`ObjectPoolComponent`로 EXP 아이템 반환), `_DamageCalcHelper` Logic(데미지 식 단일화) | 대량 스폰 최적화(우리 청크 스폰 최적화와 비교), 데미지 계산식을 Logic 한 곳에 모으는 패턴 — 강화/버프 배율 추가 시 유지보수 지점 단일화 |
| [05-level-system.md](05-level-system.md) | 레벨 DataSet(레벨별 요구 경험치), 경험치 아이템, `PlayerEXPCollider`(TriggerComponent `BoxSize`를 자석 범위로 런타임 리사이즈) | 자석(줍기 범위) 패턴 — 채집물 자동 획득 반경 도입 시 그대로 적용 가능 |
| [06-enhancement-system.md](06-enhancement-system.md) | 레벨업 시 강화 선택 UI, `EnhanceData` DataSet(강화 항목·수치), `LevelUpLogic`→`GameLogic` 연결 | 로그라이크식 "3택 강화" 루프의 완결 구현 — 스킬트리와 다른 세션형 성장 콘텐츠(던전/보스전 버프) 설계 시 참조 |
| [07-datastorage.md](07-datastorage.md) | 최고 기록 저장/로드(`DataStorageLogic`), 샘플 월드와 동기화, **데이터 변조 주의** | 입문 수준 — 실전 저장 설계는 벤더 `msw-scripting/references/datastorage.md` §8(멀티 컴포넌트 영속화 프로토콜)이 상위 호환. R7(세이브 Yield 금지)과 함께 적용 |

## 이 예제에서 가져올 만한 핵심 패턴 3가지

1. **충돌 감지 방식 선택 기준** (03): 상주 히트박스(장착 무기·지속 장판) → `TriggerComponent`; 시전 순간 범위 질의(원형 폭발·부채꼴 판정) → `_CollisionService:GetSimulator()`. 프레임별 거리 계산 수기 구현은 두 경우 모두에서 금지(combat 스킬 §1-7).
2. **오브젝트 풀** (04): 짧은 수명 엔티티(드랍 아이템·투사체·이펙트)를 Spawn/Destroy 반복 대신 풀에서 대여/반환. `_EntityService:GetEntityByPath("/maps/.../ObjectPool")` + 풀 컴포넌트 패턴.
3. **`DamageCalcHelper` 단일 Logic** (04): 데미지 식을 개별 공격 스크립트에 흩뿌리지 않고 Logic 하나로 — 강화·버프 배율이 늘어날수록 효과가 커지는 구조. 우리 전투 밸런스 개편 시 도입 검토.
