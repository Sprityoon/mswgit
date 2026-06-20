# 개발 워크플로우 및 MCP 검증 (Workflow & Verification)

> 이 문서는 [AGENTS.md](../../AGENTS.md)의 온디맨드 세부 가이드입니다. 구현·검증 단계 진입 시 로드하십시오.

## MSW-MCP 연동 및 검증 프로세스

* 에디터 제어 및 로그 모니터링은 **`msw-maker-mcp`**를 활용하십시오.
* **필수 툴 체인**:
  * `refresh`: 파일 변경 사항을 에디터에 동기화.
  * `play` / `stop`: 플레이 모드 시작 및 중지.
  * `clear_logs` -> `logs`: 빌드 오류 및 런타임 오류 검출.
* **RUID 유효성**: `SpriteRendererComponent` 등 생성 시, `SpriteRUID`를 비워두지 말고 적절한 리소스를 `msw-search`로 검색하여 바인딩하십시오.
* **Builder 사용**: `.map`, `.model`, `.ui` 파일을 수정할 때는 [references/builder-protocol.md](../../plugins/msw-maker-base-skill/skills/msw-general/references/builder-protocol.md)를 숙지하고 각각의 Builder 스크립트를 사용하십시오.

## DEVELOPMENT WORKFLOW

1. **Plan (계획)**: 변경 유형 확인 (New / Modify / Both), 작업 내역 분해 및 `TodoWrite` 작성.
2. **Analyze (분석)**: `.d.mlua` 및 기존 코드 분석, 데이터셋 구조 분석.
3. **Implement (구현)**: 지정된 빌더 사용, `log()` 추가, `SpawnService` parent 확인, float 대신 number/integer 활용.
4. **Verify (검증)**: `refresh` -> `play` -> `logs` -> `stop` 순서로 검증 및 로그 확인.
5. **On Failure (실패 시)**: 실행 영역(Client vs Server) 및 `logs` 체크 후 재시도.
