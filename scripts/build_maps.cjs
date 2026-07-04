// build_maps.cjs — 영지/마을/사냥터 초기 블록아웃 일괄 페인팅 (2026-07-04 컨셉)
//
// ⛔⛔ 맵 소유권 전환 (2026-07-04): 초기 블록아웃이 끝났고 이제 맵은 **Maker 손편집이 소스 오브 트루스**다.
//    이 스크립트를 다시 돌리면 대상 레이어를 전부 재계산해 **사용자 손편집을 통째로 덮어쓴다**
//    (revision 범프 때문에 refresh에서 파일이 에디터 씬을 이긴다).
//    → 명시적 `--force` 없이는 실행을 거부한다. 사용자가 다시 블록아웃을 원할 때만 사용할 것.
//
// 컨셉 (docs/design/skill-tree-plan.md §5 + 2026-07-04 결정):
//   - Grass(FullGrass)는 기본 바닥으로 전면 깔림, Soil은 사람이 다니는 길 (9방향 오토타일)
//   - 타일 시트 = wall.tileset (아트는 임시 — 이름/인덱스 구조만 확정)
//   - 표준 레이어: RectTileMap(SL0 베이스) / RectTileMap2(SL1 Soil길) / RectTileMap3(SL2 설치바닥, tile1)
//                / RectTileMap4(SL3 Big Wall 충돌 밴드) / RectTileMap5(SL4 경계 테라스 비주얼)
//                / MapLayer5 = 엔티티 전용 (타일 레이어 없음)
//   - 경계: 충돌은 Big Wall(레이어4), 비주얼은 TerraceTop 링 + 북벽 CliffFace(레이어5가 위에 덮음)
//
// 실행: node scripts/build_maps.cjs --force  (멱등 — 대상 레이어를 항상 새로 계산해 전체 재작성)
"use strict";
if (!process.argv.includes("--force")) {
  console.error("⛔ 맵은 이제 Maker 손편집 소유입니다. 이 생성기는 사용자 손편집을 전부 덮어씁니다.");
  console.error("   초기 블록아웃을 다시 깔고 싶을 때만: node scripts/build_maps.cjs --force");
  process.exit(1);
}
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const WALL_TILESET_RUID = "tileset://2361293b-a3c2-4138-8dec-4fb4d1f9acf4";
const TILE1_TILESET_RUID = "tileset://7e240dde-c5fe-4d2e-ad41-0a80f4b3ec7d";

// ---------- wall.tileset 이름 → tileIndex ----------
function loadWallTileIndex() {
  const ts = JSON.parse(fs.readFileSync(path.join(ROOT, "RootDesk/MyDesk/wall.tileset"), "utf8"));
  const datas = ts.ContentProto.Json.datas;
  const idx = {};
  datas.forEach((d, i) => { idx[d.Name] = i; });
  for (const need of ["FullGrass", "Soil", "SoilT", "SoilRT", "SoilR", "SoilRD", "SoilD", "SoilLD", "SoilL", "SoilLT",
    "SoilLT2", "SoilRT2", "SoilLD2", "SoilRD2",
    "TerraceTop", "TerraceTopT", "TerraceTopRT", "TerraceTopR", "TerraceTopRD", "TerraceTopD", "TerraceTopLD", "TerraceTopL", "TerraceTopLT",
    "CliffFaceL", "CliffFaceM", "CliffFaceR", "CliffFaceLD", "CliffFaceD", "CliffFaceRD", "Big Wall"]) {
    if (idx[need] === undefined) throw new Error("wall.tileset missing tile name: " + need);
  }
  return idx;
}

// ---------- 9방향 + 내부 모서리 오토타일 (ResourceSpawner:ComputeAutotileName과 동일 규칙) ----------
// inner=true면 4방이 다 차고 대각 하나만 빈 오목 지점에 XX2 내부 모서리 접미사를 쓴다 (Soil 전용 보조 타일).
function autotileSuffix(maskAt, x, y, inner) {
  const t = maskAt(x, y + 1), d = maskAt(x, y - 1), l = maskAt(x - 1, y), r = maskAt(x + 1, y);
  if (!t && !l) return "LT";
  if (!t && !r) return "RT";
  if (!d && !l) return "LD";
  if (!d && !r) return "RD";
  if (!t) return "T";
  if (!d) return "D";
  if (!l) return "L";
  if (!r) return "R";
  if (inner) {
    if (!maskAt(x - 1, y + 1)) return "LT2";
    if (!maskAt(x + 1, y + 1)) return "RT2";
    if (!maskAt(x - 1, y - 1)) return "LD2";
    if (!maskAt(x + 1, y - 1)) return "RD2";
  }
  return "";
}

// 대각 핀치 스무딩 (ResourceSpawner:AutotileSoilLayer와 동일 규칙)
function smoothMask(rawSet) {
  const has = (x, y) => rawSet.has(x + "," + y);
  const out = new Set(rawSet);
  const candidates = new Set();
  for (const key of rawSet) {
    const [x, y] = key.split(",").map(Number);
    for (let nx = x - 1; nx <= x + 1; nx++) for (let ny = y - 1; ny <= y + 1; ny++) candidates.add(nx + "," + ny);
  }
  for (const key of candidates) {
    if (out.has(key)) continue;
    const [x, y] = key.split(",").map(Number);
    if ((has(x + 1, y) && has(x, y + 1) && !has(x + 1, y + 1)) ||
        (has(x + 1, y) && has(x, y - 1) && !has(x + 1, y - 1)) ||
        (has(x - 1, y) && has(x, y + 1) && !has(x - 1, y + 1)) ||
        (has(x - 1, y) && has(x, y - 1) && !has(x - 1, y - 1))) {
      out.add(key);
    }
  }
  return out;
}

// ---------- 마스크 빌더 ----------
function disc(set, cx, cy, r) {
  for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) set.add(x + "," + y);
}
function rect(set, x0, x1, y0, y1) {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) set.add(x + "," + y);
}
function carve(set, x0, x1, y0, y1) {
  // 마스크에서 사각 영역을 제거 (광장 안 정원 아일랜드 등)
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) set.delete(x + "," + y);
}
// 팔각형: 정사각 반경 h에서 코너를 45° 챔퍼(길이 c)로 균일하게 깎는다.
// disc()의 원 래스터는 스텝 길이가 1,1,2,3…으로 불규칙해 9방향 모서리 타일이 지저분하게 섞임 —
// 팔각형은 직선 변 + 균일 1셀 스텝만 나와 테두리 프린지가 규칙적으로 이어진다.
function octagon(set, cx, cy, h, c) {
  for (let dx = -h; dx <= h; dx++)
    for (let dy = -h; dy <= h; dy++)
      if (Math.abs(dx) + Math.abs(dy) <= 2 * h - c) set.add((cx + dx) + "," + (cy + dy));
}

// ---------- 맵 파일 유틸 ----------
function loadMap(rel) {
  const p = path.join(ROOT, rel);
  return { path: p, json: JSON.parse(fs.readFileSync(p, "utf8")) };
}
function entJson(e) { return typeof e.jsonString === "string" ? JSON.parse(e.jsonString) : e.jsonString; }
function tileComp(js) { return (js["@components"] || []).find(c => c["@type"] === "MOD.Core.RectTileMapComponent"); }
function mapRootName(m) {
  for (const e of m.json.ContentProto.Entities) {
    const js = entJson(e);
    if ((js["@components"] || []).find(c => c["@type"] === "MOD.Core.MapComponent")) return js.name;
  }
  throw new Error("map root not found");
}
function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0; return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// 표준 레이어 확보 — ⚠️ 리네임 절대 금지 (Maker refresh 증분 적용이 이름 스왑에서 LEA-3054로 깨짐, 실측).
// 슬롯은 "기존 이름 그대로" 매핑하고, 없을 때만 표준 이름으로 새로 생성한다.
// layerNames: 논리 슬롯(base/soil/floors/walls/deco) -> 이 맵에서 실제 사용할 엔티티 이름.
function normalizeLayers(m, layerNames, forceSL) {
  const root = mapRootName(m);
  const ents = m.json.ContentProto.Entities;
  const scheme = [
    { slot: "base",   name: layerNames.base,   sl: "MapLayer0", ts: WALL_TILESET_RUID },
    { slot: "soil",   name: layerNames.soil,   sl: "MapLayer1", ts: WALL_TILESET_RUID },
    { slot: "floors", name: layerNames.floors, sl: "MapLayer2", ts: TILE1_TILESET_RUID }, // 설치 바닥(Baram_167)
    { slot: "walls",  name: layerNames.walls,  sl: "MapLayer3", ts: WALL_TILESET_RUID },
    { slot: "deco",   name: layerNames.deco,   sl: "MapLayer4", ts: WALL_TILESET_RUID },
  ];
  // 현재 타일 레이어 수집
  const layers = [];
  for (const e of ents) {
    const js = entJson(e);
    if (tileComp(js)) layers.push({ e, js });
  }
  // 이름으로만 배정 — 리네임 없음
  const used = new Set();
  const assigned = {};
  for (const s of scheme) {
    const found = layers.find(l => !used.has(l) && l.js.name === s.name);
    if (found) { used.add(found); assigned[s.slot] = found; }
  }
  // 미배정 잉여 레이어는 삭제하지 않고 비운다.
  // (엔티티 삭제 시 MapleMapLayer 짝 불일치로 맵 로드가 깨질 수 있음 — template_field 실측)
  for (const l of layers) {
    if (!used.has(l)) {
      tileComp(l.js).tileMap = [];
      console.log(`  - emptied extra tile layer '${l.js.name}' (${tileComp(l.js).SortingLayer})`);
    }
  }
  // 슬롯별 세팅/생성
  const result = {};
  let displayOrder = 20;
  for (const s of scheme) {
    let slot = assigned[s.slot];
    if (!slot) {
      // map01의 RectTileMap 구조를 본뜬 최소 레이어 엔티티 생성 (신규 생성은 증분 적용 정상 — town 실측)
      const js = {
        name: s.name,
        path: `/maps/${root}/${s.name}`,
        nameEditable: false, enable: true, visible: true, localize: false,
        displayOrder: displayOrder, pathConstraints: "///", revision: 1,
        origin: { type: "Model", entry_id: "recttilemap", sub_entity_id: null, root_entity_id: null, replaced_model_id: null },
        modelId: "recttilemap",
        "@components": [
          { "@type": "MOD.Core.TransformComponent", Position: { x: 0.0, y: 0.0, z: 0.0 }, QuaternionRotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, Enable: true },
          { "@type": "MOD.Core.RectTileMapComponent", SortingLayer: s.sl, TileSetRUID: s.ts, Enable: true, tileMap: [] },
        ],
        "@version": 1,
      };
      const e = { id: uuid(), path: js.path, componentNames: "MOD.Core.TransformComponent,MOD.Core.RectTileMapComponent", jsonString: js };
      ents.push(e);
      slot = { e, js };
      console.log(`  + created layer '${s.name}' (${s.sl})`);
    } else {
      const tc = tileComp(slot.js);
      tc.TileSetRUID = s.ts;
      if (forceSL && forceSL[s.name] !== undefined && tc.SortingLayer !== forceSL[s.name]) {
        console.log(`  ~ SL '${s.name}': ${tc.SortingLayer} -> ${forceSL[s.name]}`);
        tc.SortingLayer = forceSL[s.name];
      }
    }
    result[s.slot] = slot;
    displayOrder++;
  }
  return result;
}

function setTiles(slot, cells) {
  // cells: Map "x,y" -> tileIndex
  const tc = tileComp(slot.js);
  const arr = [];
  for (const [key, tileIndex] of cells) {
    const [x, y] = key.split(",").map(Number);
    arr.push({ type: 0, position: { x, y }, tileIndex });
  }
  arr.sort((a, b) => (a.position.x - b.position.x) || (a.position.y - b.position.y));
  tc.tileMap = arr;
  // Maker가 열어둔 맵의 증분 머지가 타일 변경을 건너뛰는 사례 실측 — revision 범프로 재인제스트 신호
  slot.js.revision = (slot.js.revision || 1) + 1;
}

// ---------- 페인터 ----------
const DEFAULT_LAYER_NAMES = { base: "RectTileMap", soil: "RectTileMap2", floors: "RectTileMap3", walls: "RectTileMap4", deco: "RectTileMap5" };

function paintMap(rel, R, soilRaw, opts) {
  opts = opts || {};
  const IDX = loadWallTileIndex();
  const m = loadMap(rel);
  console.log("##", rel);
  const L = normalizeLayers(m, opts.layerNames || DEFAULT_LAYER_NAMES, opts.forceSL);
  const bandInner = R - 2; // 3겹 경계 밴드 (ResourceSpawner.WallThickness=3과 일치)

  // L1: FullGrass 전면 (밴드 포함 — 절벽 링 밑바탕)
  const base = new Map();
  for (let x = -R; x <= R; x++) for (let y = -R; y <= R; y++) base.set(x + "," + y, IDX["FullGrass"]);
  setTiles(L.base, base);

  // L2: Soil 길 (스무딩 + 9방향 오토타일, 밴드 안쪽만)
  const soil = smoothMask(soilRaw);
  const inPlayable = (x, y) => Math.abs(x) < bandInner && Math.abs(y) < bandInner;
  const soilAt = (x, y) => soil.has(x + "," + y);
  const soilTiles = new Map();
  for (const key of soil) {
    const [x, y] = key.split(",").map(Number);
    if (!inPlayable(x, y)) continue;
    soilTiles.set(key, IDX["Soil" + autotileSuffix(soilAt, x, y, true)]);
  }
  setTiles(L.soil, soilTiles);

  // L3: 설치 바닥 — 런타임 전용, 비움
  setTiles(L.floors, new Map());

  // L4: Big Wall 충돌 밴드 (max(|x|,|y|) in [bandInner, R])
  const walls = new Map();
  for (let x = -R; x <= R; x++) for (let y = -R; y <= R; y++) {
    if (Math.max(Math.abs(x), Math.abs(y)) >= bandInner) walls.set(x + "," + y, IDX["Big Wall"]);
  }
  setTiles(L.walls, walls);

  // L5: 경계 테라스 비주얼 링 (+ 내부 데코 플래토) — 충돌 없음, Big Wall 위를 덮는다
  const deco = new Map();
  const bandAt = (x, y) => Math.max(Math.abs(x), Math.abs(y)) >= bandInner; // 맵 밖도 true (연속)
  for (let x = -R; x <= R; x++) for (let y = -R; y <= R; y++) {
    if (!bandAt(x, y)) continue;
    // 북벽 안쪽 2줄은 남향 절벽면 (이미지 문법: 테라스 상판 + 절벽면)
    if (Math.abs(x) < bandInner && y === bandInner) { deco.set(x + "," + y, IDX["CliffFaceD"]); continue; }
    if (Math.abs(x) < bandInner && y === bandInner + 1) { deco.set(x + "," + y, IDX["CliffFaceM"]); continue; }
    deco.set(x + "," + y, IDX["TerraceTop" + autotileSuffix(bandAt, x, y)]);
  }
  // 내부 데코 플래토 (선택)
  if (opts && opts.plateau) {
    const p = opts.plateau; // {x0,x1,y0,y1}
    const pSet = new Set();
    rect(pSet, p.x0, p.x1, p.y0, p.y1);
    const pAt = (x, y) => pSet.has(x + "," + y);
    for (const key of pSet) {
      const [x, y] = key.split(",").map(Number);
      if (y === p.y0) { deco.set(key, IDX["CliffFace" + (x === p.x0 ? "LD" : x === p.x1 ? "RD" : "D")]); continue; }
      deco.set(key, IDX["TerraceTop" + autotileSuffix(pAt, x, y)]);
    }
  }
  setTiles(L.deco, deco);

  fs.writeFileSync(m.path, JSON.stringify(m.json, null, 2));
  console.log(`  saved: base=${base.size} soil=${soilTiles.size} wall=${walls.size} deco=${deco.size}`);
}

// ================= 맵별 디자인 =================

// --- 영지 map01 (R=30, MyMap.png 레퍼런스): 중앙 우물 광장 + 굽이치는 북쪽 길 + 남서 밭 단지 ---
// 레퍼런스에서 제외(오브젝트/타일 부재): 울타리, 버섯집, 우물/닭장 오브젝트, 동쪽 강+다리, 격자선
{
  const s = new Set();
  octagon(s, 0, 0, 3, 2);             // 우물 광장 (7x7 팔각형 — MyMap 중앙 우물 자리)
  // 굽이치는 북쪽 길 (S자 커브, 전 구간 폭 2)
  rect(s, -1, 0, 3, 9);               //   ↑ 광장에서 북으로
  rect(s, -6, 0, 9, 10);              //   ← 서쪽 꺾임
  rect(s, -6, -5, 10, 18);            //   ↑
  rect(s, -6, 2, 18, 19);             //   → 동쪽 꺾임
  rect(s, 1, 2, 19, 27);              //   ↑ 북쪽 경계까지
  rect(s, 3, 27, -1, 0);              // 동쪽 길 (강가 방면)
  rect(s, -1, 0, -12, -3);            // 남쪽 길
  octagon(s, 0, -14, 2, 1);           // 남쪽 끝 마당 (닭장 자리)
  rect(s, -9, -3, -1, 0);             // 서쪽 길 (밭 방면)
  rect(s, -9, -8, -12, -1);           // 밭 진입로 (남쪽으로)
  // 남서 밭 단지 (MyMap 좌하단 경작지 — 고랑 느낌으로 3구획)
  rect(s, -23, -18, -8, -3);          // 밭 A
  rect(s, -16, -10, -8, -3);          // 밭 B (진입로에 접함)
  rect(s, -23, -10, -15, -11);        // 밭 C (아래 가로 구획)
  paintMap("map/map01.map", 30, s, {
    // map01 레이어는 Maker에서 표준명으로 정규화 저장됨 (2026-07-04 사용자 작업):
    // RectTileMap(SL0)/RectTileMap2(SL1)/RectTileMap3(SL3)/RectTileMap4(SL2)/RectTileMap5(SL4)/RectTileMap6(SL5)
    // → 기본 매핑 사용 (deco=RectTileMap5). SL 값은 건드리지 않음 (렌더 순서 동작에 문제 없음).
  });
}

// --- 마을 town (R=35, Town.png 레퍼런스): 대형 석재 광장 + 4분면 정원 아일랜드 + 십자 대로 ---
// 레퍼런스에서 제외(오브젝트/타일 부재): 분수, 울타리/생울타리, 꽃밭, 벤치, 가로등, 거목 상점
// 기존 엔티티 유지: House(-5,5)·ResearchLab(5,5)는 북쪽 정원 위, Merchant(-3,2)·Portal(5,0)·Spawn(0,-1)은 광장 위
{
  const s = new Set();
  rect(s, -14, 14, -13, 9);           // 대광장 (석재 바닥 전체)
  // 4분면 정원 아일랜드 (광장에서 잔디로 도려냄 — Town.png의 화단 구역)
  carve(s, -11, -4, 2, 6);            // 북서 정원 (House가 위에 얹힘)
  carve(s, 4, 11, 2, 6);              // 북동 정원 (ResearchLab)
  carve(s, -11, -4, -10, -5);         // 남서 정원
  carve(s, 4, 11, -10, -5);           // 남동 정원
  // 십자 대로 (광장 → 사방 경계)
  rect(s, -2, 2, 9, 32);              // 북쪽 대로 (건물 사이)
  rect(s, -2, 2, -32, -13);           // 남쪽 대로
  rect(s, 14, 32, -2, 2);             // 동쪽 대로
  rect(s, -32, -14, -2, 2);           // 서쪽 대로
  paintMap("map/town.map", 35, s);
}

// --- 사냥터 template_field (R=30): 공터 3곳 + 연결 길 + NE 플래토 데코 ---
{
  const s = new Set();
  octagon(s, 0, 0, 5, 3);             // 중앙 공터 (귀환 포탈 (0,-3) 포함)
  octagon(s, -10, 0, 3, 2);           // 서쪽 포탈 패드
  octagon(s, 10, 0, 3, 2);            // 동쪽 포탈 패드
  rect(s, -10, 10, -1, 0);            // 동서 연결 길
  octagon(s, -16, 14, 5, 3);          // 북서 공터
  rect(s, -1, 0, 4, 14);              // 북쪽 길
  rect(s, -16, -1, 13, 14);           // 북서 연결
  octagon(s, 14, -13, 6, 4);          // 남동 공터
  rect(s, 13, 14, -13, -1);           // 남동 연결
  paintMap("map/template_field.map", 30, s, {
    // 기존 6레이어 이름=표준, SL도 이미 0~5 순차 — 그대로 사용 (RectTileMap5=SL4가 데코)
    layerNames: { base: "RectTileMap", soil: "RectTileMap2", floors: "RectTileMap3", walls: "RectTileMap4", deco: "RectTileMap5" },
    plateau: { x0: 17, x1: 24, y0: 15, y1: 20 },
  });
}

// --- 보스 아레나 template_boss (R=15): 원형 아레나 + 남쪽 포탈 회랑 ---
{
  const s = new Set();
  octagon(s, 0, 2, 7, 4);             // 아레나 (보스 (0,2), 15x15 팔각형)
  rect(s, -1, 1, -10, -3);            // 남쪽 포탈 회랑 ((0,-8),(0,-7) 포함)
  paintMap("map/template_boss.map", 15, s, {
    // 기존 RectTileMap(SL4)/RectTileMap2(SL5)는 SL만 교정 (컴포넌트 필드 변경은 증분 적용 가능)
    forceSL: { RectTileMap: "MapLayer0", RectTileMap2: "MapLayer1" },
  });
}

console.log("done. 다음: Maker refresh -> play 검증");
