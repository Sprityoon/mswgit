# T51 작업 보고서 — 지형 편집 대각 2칸 마스크 → SubGrass 전용 타일 매핑

- **작업**: T51 지형 편집 대각선 타일 정식화 (`docs/agents/subagent-handoff.md` §3 해당 항목 — ⚖️ 2026-07-15 보스 직접 지시, 지휘자 직접 수행 소급 티켓)
- **상태**: 완료 | mlua-diagnose errors=0 | refresh 빌드 Error=0 | **Play 런타임 검증 PASS(지휘자 — 서버 스크립트 재현·로그 근거)**
- **수행 에이전트/환경**: 지휘자(Claude Fable 5), Maker 기동 상태(MCP refresh/play/execute_script/logs 사용), LSP(mlua-diagnose 훅) 사용
- **날짜**: 2026-07-15

## 1. 요약 (3~5줄)

삽/괭이/씨앗 지형 편집에서 셀의 2×2 흙 마스크가 대각 2칸(6=TL+BR, 9=TR+BL)이 되는 경우 표현할 타일이 없어 3칸 볼록으로 승격(추가)하거나 1칸 오목으로 강등(감산)하는 보정 로직이 "다른 타일 대체" 증상의 원인이었다. 제작자가 wall.tileset에 추가한 `SubGrassLTRD`(마스크 6)·`SubGrassRTLD`(마스크 9) 2종을 마스크 매핑에 정식 편입하고 보정 로직을 폐기해 **전 마스크 0~15가 타일로 직접 표현**되게 했다. 패밀리/길 분류 함수에 SubGrass를 편입해 자원 스폰 억제·미니맵 흙색이 자동 상속되고, Play 컨텍스트에서 digHole 대각 시나리오 양방향 재현으로 실타일 도장을 확인했다.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/MapObjects/Scripts/ResourceSpawner.mlua` | `TileNameToMask`/`MaskToTileName`에 SubGrass 2종 추가(6↔LTRD, 9↔RTLD) · `FixDiagonalMask`/`FixDiagonalMaskSubtract` 삭제 · `SetCellMask` 보정 래퍼 폐기(`SetCellMaskExact` 단일화) · digPath/digHole/plantGrass 경로에서 보정 호출 제거 · `IsGrassTileName`/`IsGrassEdgeTileName`에 SubGrass prefix 편입 · 스킴 헤더 주석 갱신 |
| `RootDesk/MyDesk/UI/Scripts/UIMinimapController.mlua` | `TileColor`에 SubGrass prefix 분기 추가 — 방향 에지와 같은 흙색 (0.76,0.60,0.42) |

(제작자 선행 작업: `RootDesk/MyDesk/wall.tileset`에 `SubGrassRTLD`/`SubGrassLTRD` 타일 등재 + `tileimg/` 아트 2장 — Maker에서 수행, 본 티켓 범위 밖.)

## 3. 구현 상세

- **매핑**: 접미사=흙 쪽 관례 그대로 — `SubGrassLTRD` = LT(TL=4)+RD(BR=2) = 마스크 6, `SubGrassRTLD` = RT(TR=8)+LD(BL=1) = 마스크 9. 기존 `Grass*` 13종 매핑 무변경.
- **보정 폐기**: 대각이 표현 가능해졌으므로 추가식 승격(`FixDiagonalMask`)·감산식 강등(`FixDiagonalMaskSubtract`) 모두 삭제. `SetCellMask`(보정 경유 래퍼)는 `SetCellMaskExact`와 동일해져 후자로 단일화 — digPath 밴드/캡, digHole 홀/프린지, plantGrass 감산 전 경로가 마스크 그대로 도장.
- **분류 편입**: `IsGrassTileName`(패밀리)·`IsGrassEdgeTileName`(길 판정) 둘 다 `SubGrass` prefix에 true — 자원 스폰 `RequiredTile` 판정(대각 셀="Soil" — 잔디 요구 자원 억제)과 미니맵 흙색이 기존 깔때기를 통해 자동 상속.
- **스펙에서 벗어난 결정**: 없음. 하드코딩 없음(타일명은 마스크 매핑 테이블 = 단일 소스, 분기는 prefix 관례).
- **생성기(`scripts/build_maps.cjs`) 무변경**: 블록아웃 문법(길 밴드/홀)은 대각을 산출하지 않으므로 기능 영향 없음. 대각은 런타임 편집 전용 확장.
- **재사용**: 기존 마스크 연산·fringe 테이블·SetTile(string) 경로 전부 그대로. 신규 로직 없음(테이블 4행 + prefix 분기 3곳 추가, 보정 함수 2종 삭제로 순감).

## 4. 수행한 검증과 결과

- **mlua-diagnose**: ResourceSpawner.mlua / UIMinimapController.mlua — errors=0, warnings=0 (편집 중간의 'not found' info는 호출부 정리로 전량 해소).
- **Maker refresh 빌드**: **Error=0** (total 490 = Info 473 / Warning 17 — T50 시점 기준선과 동일, 신규 경고 0).
- **Play 런타임 재현 (server_main, `maker_execute_script`, persist=false — 세이브 무오염)**:
  - town 맵 FullGrass 6×3 스트립에서 digHole 2회(대각 배치) → 중간 셀 실도장 확인:
    - `[SUBGRASS-TEST] A mid(-19,-19) = SubGrassRTLD (expect SubGrassRTLD)` ✓
    - `[SUBGRASS-TEST] B mid(-16,-19) = SubGrassLTRD (expect SubGrassLTRD)` ✓
  - 마스크 왕복: `roundtrip 6=SubGrassLTRD 9=SubGrassRTLD back=6/9` ✓
  - 분류: `family=true edge=true` ✓ / 런타임 Error 0건.
- **보류**: 실제 삽/괭이 손조작 육안(타일 아트 이음새 감성 포함)은 제작자 Play — 아래 §6.

## 5. 발견한 문제 / 후속 제안

- **🔴 .ui 스테일 덮어쓰기 사고 발견(본 티켓과 별건)**: 제작자의 Maker 세션(2026-07-15 01:59 저장 — subgrass 타일 추가 시점)이 에디터의 구버전 UI 메모리 상태로 `ui/HUDGroup.ui`·`ui/PopupGroup.ui`를 덮어써 T47·T48·T50 산출물(BtnSkillTree/SkillDetailPanel/노드 아이콘 칩)이 워킹 트리에서 소실. 지휘자가 `git stash push`(stash@{0} `maker-stale-ui-rollback-backup 2026-07-15`)로 백업하며 HEAD 상태 복구 + refresh로 에디터 동기화(Error=0). 재발 방지 규칙 → handoff §1.2 규칙 11 신설.
- 대각 타일이 실제로 나오는 경로는 "두 흙 영역이 대각으로 접근"하는 경우(digHole 프린지 코너 중첩, digPath 캡 중첩)다. build_maps 생성기는 대각을 만들지 않으므로 맵 재생성과 무관.

## 6. 제작자 런타임 체크리스트

- [ ] 영지에서 괭이 digHole 두 개를 대각으로 파서 사이 셀에 대각 타일(SubGrass)이 박히는지 육안 확인 (양 대각 방향 모두)
- [ ] 삽 digPath 끝단 캡이 기존 오목 코너와 만나 대각이 될 때 자연스러운지
- [ ] 씨앗 plantGrass로 대각 셀 주변을 되심었을 때 역연산 정상(잔디 복원)
- [ ] 대각 셀이 미니맵에서 흙색으로 표시
- [ ] 대각 셀 위에 잔디 요구 자원(나무 등)이 리스폰되지 않음
- [ ] 재접속 후 대각 타일 유지(델타 재생 결정론)
- [ ] 타일 아트 2장(tileimg/)의 이음새가 인접 Grass 에지·코너와 시각적으로 맞물리는지 (안 맞으면 아트만 교체 — 로직 무관)

## 7. 이력

- 2026-07-15 최초 작성 (지휘자 Claude Fable 5 — 보스 직접 지시 "이 로직부분은 맡기지말고 직접 개선해줘"에 따른 지휘자 직접 수행, §5 조항 11 준수 소급 정식화)
