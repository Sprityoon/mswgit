# T35 작업 보고서 — `row.RowIndex` API 오용 수정 (LEA-3005 핫픽스)

- **작업**: T35 `row.RowIndex` API 오용 수정 — 몬스터 틴트·코인 드롭 LEA-3005
- **상태**: 코드 완료 | Maker refresh 빌드 **Error=0** | Play 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: 레인 A 핫픽스 · Maker MCP `maker_refresh_workspace` via `scratch/mcp_probe.py`
- **날짜**: 2026-07-11

## 1. 요약

`UserDataRow`에 없는 `row.RowIndex`로 `GetCell`을 호출해 스폰 틱·처치 시 `[LEA-3005] InvalidArgument`가 나던 4건을 `row:GetItem(columnName)` + pcall 가드로 교체했다. 저장소 `RootDesk/MyDesk/**/*.mlua` 기준 `.RowIndex` 잔존 0. refresh 빌드 Error=0. Play 실동작은 제작자 확인 범위.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/MapObjects/Scripts/ResourceSpawner.mlua` | `GetBiomeMonsterTintHex`: `GetCell(row.RowIndex,…)` → `row:GetItem("MonsterTint")` + pcall |
| `RootDesk/MyDesk/Monster/Scripts/Monster.mlua` | `Dead()` 코인 드롭: DropChance/MinAmount/MaxAmount 3건 → `row:GetItem` + pcall |

## 3. 구현 상세

- **①** `GetBiomeMonsterTintHex`: FindRow 성공 후 `pcall(function() return row:GetItem("MonsterTint") end)`. 실패/nil/공란 → `""` (스폰 틱 비중단).
- **②** `Dead()`: 로컬 `rowNum(col, default)` 헬퍼로 DropChance/MinAmount/MaxAmount 조회. `tonumber`·기본값 유지, max&lt;min 시 max=min 보정.
- **③** `RootDesk/MyDesk` 전역 `.RowIndex` grep → **0건**.

**스펙 이탈**: 없음. pcall 패턴은 `Furnace.mlua` `readDur` 선례.

## 4. 수행한 검증과 결과

- **정적**: `.RowIndex` grep 잔존 0 (MyDesk `*.mlua`).
- **Maker refresh**: `{"status":"ok"}`.
- **빌드 로그**: total 396 · **Error=0** · Warning=8 · Info=388.
  - 관련 Warning: `model://slime_king` LWA-4012 BossDropMin/Max (기존 소음, T35 무관).
- **Play 런타임 검증 보류(제작자 수행)** — Acceptance ② 체크리스트는 §6.

## 5. 발견한 문제 / 후속 제안

- 없음. T35 PASS 후 제작자가 T28/T34 런타임 보류 해소 판정 가능.

## 6. 제작자 런타임 체크리스트

- [ ] 사냥터 몬스터 정상 스폰 (스폰 틱 중단 없음)
- [ ] rocky/desert/snowfield 몬스터 틴트 적용
- [ ] 몬스터 처치 시 코인 드롭·사체 소거
- [ ] (보스) 보상·도안 드롭·Kill 경로 정상
- [ ] logs에 LEA-3005 **0건**
- [ ] (연동) T28 코인·T34 틴트/상자 런타임 보류 해소 판정

## 7. 이력

- 2026-07-11 최초 작성 (레인 A 핫픽스)
