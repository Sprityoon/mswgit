# 로컬 스킬 및 레퍼런스 로드 프로토콜 (Skill Loading Protocol)

> 이 문서는 [AGENTS.md](../../AGENTS.md)의 온디맨드 세부 가이드입니다. 작업 도메인을 분류한 뒤 해당 스킬/레퍼런스를 로드할 때 참조하십시오.

* **로컬 스킬 디렉토리**: `<App Data Directory>/config/plugins/msw-maker-base-skill/skills/` (에이전트가 본인의 App Data Directory 경로 하위에서 로드)

| 도메인 트리거 키워드 | 스킬 폴더명 | 필수 레퍼런스 파일 |
|---|---|---|
| script / mlua / component / event / lifecycle | `msw-scripting` | `references/verify-checklist.md`, `references/datastorage.md` |
| sprite / animation / sound / RUID / find | `msw-search` | `references/resource/search.md`, `references/resource/detail.md` |
| SpriteRUID / ImageRUID / thumbnail:// / icon | `msw-sprite-ruid` | (없음) |
| avatar / costume / equipment / state | `msw-avatar` | (없음) |
| DefaultPlayer / player / speed / camera | `msw-defaultplayer` | (없음) |
| attack / hit / damage / combat / monster | `msw-combat-system` | `../msw-general/references/monster.md`, `references/hp-gauge.md` |
| inventory / shop / ranking / quest / packages | `msw-packages` | (없음) |
| popup / HUD / button / toast / .ui | `msw-ui-system` | `references/templates/templates.md`, `../msw-general/references/builder-protocol.md` §3 |
| entity / .map / transform / spawn | `msw-general` | `references/entity.md`, `references/builder-protocol.md` §1 |
| .model / template | `msw-general` | `references/model.md`, `references/builder-protocol.md` §4 |
| TileMapMode / Body / gravity / platform | `msw-general` | `references/platform.md`, `references/platform-rect.md` (RectTile 용) |
| DataSet / userdataset / .csv | `msw-general` | `references/dataset.md` |
| MCP tools / refresh / logs | `msw-general` | `references/workspace.md` |
