# T80 작업 보고서 — 마을 NPC legacy 청산 + 이름표 수정

- **작업**: T80 마을 NPC legacy 설정 청산 + 이름표 버그 수정 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | town.map `IsLegacy=true` 0건 | Maker MCP 미연결 — refresh·Play 검증 보류(제작자)
- **수행 에이전트/환경**: Cursor (구현자) · Maker MCP 미연결
- **날짜**: 2026-07-23

## 1. 요약

마을 NPC 7기(상인·촌장·낚시꾼·주민 A~D) 모델·맵 배치에서 미사용 `StateComponent`/`StateAnimationComponent`/`TouchReceiveComponent`를 제거해 legacy 잔재를 없앴다. ResidentA~D 이름표가 전원 "촌장"이던 T77 잔재를 대화 톤에 맞는 개별 이름으로 교체했다. 재스캔 결과 `IsLegacy=true` **0건**.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/NPC/Models/Merchant.model` | State/StateAnimation/TouchReceive 제거 (9→6 comps) |
| `RootDesk/MyDesk/NPC/Models/Villager_Elder.model` | 동일 제거 |
| `RootDesk/MyDesk/NPC/Models/Villager_Fisher.model` | 동일 제거 |
| `RootDesk/MyDesk/NPC/Models/Villager_ResidentA.model` | 동일 제거 + NameTag=`미나` |
| `RootDesk/MyDesk/NPC/Models/Villager_ResidentB.model` | 동일 제거 + NameTag=`유나` |
| `RootDesk/MyDesk/NPC/Models/Villager_ResidentC.model` | 동일 제거 + NameTag=`다은` |
| `RootDesk/MyDesk/NPC/Models/Villager_ResidentD.model` | 동일 제거 + NameTag=`토리` |
| `map/town.map` | 위 7 엔티티 동일 컴포넌트 제거 + ResidentA~D NameTag 맵 오버라이드 |

## 3. 구현 상세

1. **재확인**: `NPC/Scripts/*.mlua`에서 State/StateAnimation/TouchReceive/ActionSheet 참조 **0건** — 제거 안전.
2. **legacy 청산**: ModelBuilder `removeComponent` (Values·Property 링크 동시 정리) + MapBuilder `removeComponent` — 폴백(`IsLegacy=false`만 패치)은 불필요.
3. **TouchReceive 제거**: T59 클릭 금지 정책 정합. 상호작용은 F/`InteractRequestEvent` 경로 유지.
4. **이름표 선정표** (`DialogDataSet` 톤 기반, 제작자 취향으로 CSV/모델만 바꿔 교체 가능):

| NPC | NameTag | 근거(대화 톤) |
|---|---|---|
| Villager_Elder | 촌장 (유지) | 기존 |
| Villager_Fisher | 낚시꾼 (유지) | 기존 |
| Villager_ResidentA | **미나** | 광장·분수 |
| Villager_ResidentB | **유나** | 노점·과일 |
| Villager_ResidentC | **다은** | 버섯집·가로등 |
| Villager_ResidentD | **토리** | 헛간·가축 |

5. **Rigidbody**: 범위 밖 — 정적 NPC에 `RigidbodyComponent` 잔존(RectTile↔Kinematicbody 권장과 불일치). 통행 차단은 현행 유지. 교체는 별도 승인 티켓 권장(§5).

## 4. 수행한 검증과 결과

- **맵 재스캔 (실행)**: `map/town.map`에서 `IsLegacy === true` **0건**.
- **맵 NameTag (실행)**: Elder=`촌장`, Fisher=`낚시꾼`, A=`미나`, B=`유나`, C=`다은`, D=`토리`. 컴포넌트 = Transform,SpriteRenderer,Rigidbody,ChatBalloon,NameTag,script.*
- **모델 (실행)**: ResidentA~D Name 동일, comps=6.
- **Maker refresh**: 보류 — MCP 미연결.
- **Play 런타임**: 보류(제작자 수행).

## 5. 발견한 문제 / 후속 제안

- 정적 마을 NPC의 `RigidbodyComponent` → `KinematicbodyComponent`(또는 비충돌 Body 제거) 정합은 별도 T티켓 후보. 이번 Acceptance 범위 밖이라 미착수.
- Merchant NameTag는 맵에 명시 Name이 없음(모델 기본값 의존) — 표시 이상 시 후속.

## 6. 제작자 런타임 체크리스트

- [ ] Maker `refresh` 후 빌드 Error=0
- [ ] 주민/상인 F 대화·상점·말풍선·AutoTalk 정상
- [ ] 이름표: 촌장 1명 + 낚시꾼 + 미나/유나/다은/토리 (촌장 5명 현상 소멸)
- [ ] 고양이 배회 회귀 0
- [ ] (선택) 이름 취향 불만 시 슬롯명 지목 → 개별 교체

## 7. 이력

- 2026-07-23 최초 작성 (구현자)
