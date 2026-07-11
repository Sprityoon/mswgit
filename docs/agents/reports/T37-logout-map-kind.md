# T37 작업 보고서 — 로그아웃 위치 정책 (lastMapKind)

- **작업**: T37 로그아웃 위치 정책 — 사냥터 종료 시 마을 스폰 (+ 세이브 유실 핫픽스)
- **상태**: 재작업 코드 완료 | Maker refresh 빌드 **Error=0** | Play 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: 버그픽스 배치 레인 1
- **날짜**: 2026-07-11

## 1. 요약

1차에서 마을 스폰은 동작했으나, 비홈 저장 시 `SavePlayerData` 중간 `GetAndWait("SaveData")` Yield로 로그아웃 중 컴포넌트가 파괴되며 **인벤/코인 등이 빈 값으로 덮이는 유실**이 발생했다. 재작업으로 세이브 경로 Yield를 제거하고 `LastHomePos` 세션 캐시 + 진입 직후 선캡처로 교체했다.

## 2. 수정 파일 목록

| 파일 | 변경 요지 |
|---|---|
| `Player/Scripts/PersistenceManager.mlua` | lastMapKind / LastHomePos / 선캡처 세이브 / IsDefault 마을 워프 |

## 3. 구현 상세

### 1차
- save/load `lastMapKind`, town|hunt → IsDefault 스폰, pos 오염 방지 시도.

### 재작업 (지휘자 지시 — 🔴 유실 핫픽스)
- **①** `SavePlayerData` 내 `GetAndWait` **완전 제거**.
- **②** `LastHomePos[userId]` — home 저장·Load 시 갱신, 비홈 저장 시 캐시 사용(없으면 -3,0).
- **③** 진입 직후 pc/inv 저장 필드를 지역 변수 선캡처 후 캡처본만 인코드 (§1.2 규칙 9).

## 4. 수행한 검증과 결과

### 1차
- refresh Error=0 (total 436) — 이후 Play에서 인벤 유실 확인

### 재작업
- Maker refresh: `{"status":"ok"}`
- 빌드: total **440** · **Error=0** · Warning 11 · Info 429
- 정적: `SavePlayerData` 경로 `GetAndWait` 0건
- **Play 런타임 검증 보류(제작자 수행)**

## 5. 발견한 문제 / 후속 제안

- 없음.

## 6. 제작자 런타임 체크리스트

- [ ] 영지 종료 → 영지 그 자리
- [ ] 마을 종료 → 마을 기본 스폰
- [ ] **사냥터에서 아이템 획득 → 종료 → 재접속: 마을 스폰 + 인벤/코인/레벨 온전**
- [ ] 영지 좌표 미오염
- [ ] 구세이브(lastMapKind 없음) → 영지 폴백

## 7. 이력

- 2026-07-11 최초 작성 (레인 1)
- 2026-07-11 재작업: GetAndWait 제거 + LastHomePos + 선캡처 (인벤 전량 소실 핫픽스)
