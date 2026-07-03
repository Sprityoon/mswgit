// apply_entity_layer.cjs — 맵 레이어 재구성 배치 (docs/design/skill-tree-plan.md §5)
//
// 실행 시점: 헤네시스(wall) 타일셋 확정 + 스킬트리 플레이 검증 통과 후.
// 하는 일 (멱등):
//   1. 월드 스프라이트 모델들의 SpriteRendererComponent.SortingLayer → "MapLayer5"
//      (몬스터 4 + NPC 1 + 건물 2 = 플랜 명시 7종, 그리고 드롭 아이템/포탈 16종은 SL 미설정이라 명시 부여)
//   2. Util/RenderLayers.mlua 의 EntityLayer 상수 "MapLayer2" → "MapLayer5" 플립
//      → 런타임 스폰 스프라이트 8곳(자원/가구/스포너 몬스터/프리뷰)이 한 번에 따라온다.
//   3. OrderInLayer 는 기존 값 유지 (전부 ≥2 확인 완료 — 타일(1)보다 위)
//
// 실행: node scripts/apply_entity_layer.cjs && (Maker MCP refresh)
// 남는 수동 작업(Maker UI): 레이어 엔티티 이름 정규화, RectTileMap_2(MapLayer5 점유) 정리,
//                          RectTileMap_1 타일셋 지정, 아바타 가림 플레이 확인.

const path = require("path");
const fs = require("fs");
const { ModelBuilder } = require("../plugins/msw-maker-base-skill/skills/msw-general/scripts/model/msw_model_builder.cjs");

const ROOT = path.join(__dirname, "..");
const ENTITY_LAYER = "MapLayer5";

// 플랜 §5 명시 7종 (SortingLayer 기존값 MapLayer0/2 → MapLayer5)
const EXPLICIT = [
  "RootDesk/MyDesk/Monster/Models/Slime.model",
  "RootDesk/MyDesk/Models/Monsters/Boar.model",
  "RootDesk/MyDesk/Models/Monsters/HornMushroom.model",
  "RootDesk/MyDesk/Models/Monsters/SlimeKing.model",
  "RootDesk/MyDesk/Models/NPCs/Merchant.model",
  "RootDesk/MyDesk/Models/MapObjects/Building_House.model",
  "RootDesk/MyDesk/Models/MapObjects/Building_ResearchLab.model",
];

// 드롭/설치물 모델 (SortingLayer 미설정 → 명시 부여; 플랜 표의 "드롭 전부" 항목)
const DROPS_DIRS = ["RootDesk/MyDesk/item/Models", "RootDesk/MyDesk/Furniture/Models"];

function flipModel(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) { console.log("MISSING", rel); return; }
  const b = ModelBuilder.read(p);
  if (!b.hasComponent("MOD.Core.SpriteRendererComponent")) { console.log("skip (no sprite)", rel); return; }
  const cur = b.hasValue("MOD.Core.SpriteRendererComponent", "SortingLayer")
    ? b.getValue("MOD.Core.SpriteRendererComponent", "SortingLayer") : null;
  if (cur === ENTITY_LAYER) { console.log("ok (already)", rel); return; }
  b.value("MOD.Core.SpriteRendererComponent", "SortingLayer", ENTITY_LAYER, "string");
  // OrderInLayer 보장 (없으면 타일(1) 위인 2)
  if (!b.hasValue("MOD.Core.SpriteRendererComponent", "OrderInLayer")) {
    b.value("MOD.Core.SpriteRendererComponent", "OrderInLayer", 2, "int");
  }
  b.write(p);
  console.log(`flipped ${rel}: ${cur} -> ${ENTITY_LAYER}`);
}

for (const rel of EXPLICIT) flipModel(rel);
for (const dir of DROPS_DIRS) {
  for (const f of fs.readdirSync(path.join(ROOT, dir))) {
    if (f.endsWith(".model")) flipModel(`${dir}/${f}`);
  }
}

// RenderLayers 상수 플립 (런타임 스폰 8곳 일괄 반영)
const rl = path.join(ROOT, "RootDesk/MyDesk/Util/RenderLayers.mlua");
let src = fs.readFileSync(rl, "utf8");
if (src.includes('property string EntityLayer = "MapLayer2"')) {
  src = src.replace('property string EntityLayer = "MapLayer2"', 'property string EntityLayer = "MapLayer5"');
  fs.writeFileSync(rl, src, "utf8");
  console.log('RenderLayers.EntityLayer flipped -> "MapLayer5"');
} else if (src.includes('property string EntityLayer = "MapLayer5"')) {
  console.log("RenderLayers.EntityLayer already MapLayer5");
} else {
  console.error("WARN: EntityLayer property not found in RenderLayers.mlua — check manually");
  process.exitCode = 1;
}
console.log("done. 다음: Maker refresh → 플레이로 아바타/엔티티 가림 확인");
