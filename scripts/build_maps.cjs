// build_maps.cjs — 영지/마을/사냥터 초기 블록아웃 일괄 페인팅 (2026-07-08 밀착 페어 문법)
//
// ⛔⛔ 맵 소유권 전환 (2026-07-04): 초기 블록아웃이 끝났고 이제 맵은 **Maker 손편집이 소스 오브 트루스**다.
//    이 스크립트를 다시 돌리면 대상 레이어를 전부 재계산해 **사용자 손편집을 통째로 덮어쓴다**
//    (revision 범프 때문에 refresh에서 파일이 에디터 씬을 이긴다).
//    → 명시적 `--force` 없이는 실행을 거부한다. 사용자가 다시 블록아웃을 원할 때만 사용할 것.
//
// ── 스킴 명세 (2026-07-08 확정 — 서브셀 흙 마스크 + 두 가지 문법) ──────────────────────
//   레이어: L1 RectTileMap(SL0)=Soil 전면 / L2 RectTileMap2(SL1)=잔디 커버 / L3 RectTileMap3(SL2)=설치 바닥(런타임)
//          / L4 RectTileMap4(SL3)=Big Wall 충돌 밴드 / L5 RectTileMap5(SL4)=경계 테라스 비주얼 / MapLayer5=엔티티 전용
//   타일 시트 = wall.tileset (2026-07-07 리네임: 프린지 = Grass{LT,T,RT,L,R,LD,D,RD} 8방 + 오목 = Grass{LT,RT,LD,RD}Corner 4종)
//
//   모든 지형은 셀당 2×2 **서브셀 흙 마스크** 하나로 표현한다 (BL=(2x,2y) BR=(2x+1,2y) TL=(2x,2y+1) TR=(2x+1,2y+1)):
//     흙 0칸 → FullGrass | 인접 2칸 → Grass{T|D|L|R} | 3칸 → 볼록 Grass{LT|RT|LD|RD} | 1칸 → 오목 Grass{..}Corner
//     4칸 → L2 빈 칸(홀 — L1 Soil 노출) | 대각 2칸 → 무효(산출 검사에서 에러)
//   접미사 방향 = 흙(길) 쪽. 이 매핑은 구 홀 문법의 오토타일과 완전 호환(아트 방향 T2 검증 그대로 유효).
//
//   문법 1 — 길 (밀착 에지 페어, L2 홀 0칸): walk() 폴리라인. 점 = 셀 경계 좌표 (bx = 셀 bx|bx+1 사이).
//     수평 구간 → 흙 밴드 sy∈{2by+1, 2by+2} (윗줄 GrassD + 아랫줄 GrassT 밀착 페어), 수직 구간 → sx∈{2bx+1, 2bx+2}.
//     ㄱ자 꺾임 = 바깥 볼록 Grass{diag} + 안쪽 자동, 자유 끝단 = 오목 코너 페어 캡(대각 페어 캡),
//     광장/다른 길과의 접속 = 마스크 합집합으로 자동. 길 셀에는 홀이 절대 생기지 않는다.
//   문법 2 — 광장/밭/아레나 (홀 유지, 에지 간격 ≥1칸): plaza() 사각형 = 셀 사각형 + ½셀 마진.
//     내부 셀 = L2 홀(Soil 노출), 둘레 잔디 셀 = 프린지 에지, 모서리 = 오목 Grass*Corner 자동.
//     island() = 광장 안 잔디 섬(정원) — 같은 ½ 마진 규칙으로 도려냄 (섬 둘레 광장 셀에 프린지).
//
//   경계: 충돌은 Big Wall(L4, max(|x|,|y|) ≥ R-2), 비주얼은 TerraceTop 링 + 북벽 CliffFace(L5가 위에 덮음).
//   흙 마스크는 플레이어블 셀(|x|,|y| ≤ R-3)로 클립 — 벽까지 닿는 길은 밴드 밑에서 플러시하게 끊긴다.
//
//   런타임 대응 (ResourceSpawner/UIMinimapController): 방향 에지 Grass{dir} = 길(자원 스폰 억제, 미니맵 흙색),
//   FullGrass·Grass*Corner = 잔디(스폰 가능, 미니맵 잔디색), L2 빈 칸+L1 Soil = 광장 바닥(흙색).
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
  for (const need of ["FullGrass", "Soil", "GrassT", "GrassRT", "GrassR", "GrassRD", "GrassD", "GrassLD", "GrassL", "GrassLT",
    "GrassLTCorner", "GrassRTCorner", "GrassLDCorner", "GrassRDCorner",
    "TerraceTop", "TerraceTopT", "TerraceTopRT", "TerraceTopR", "TerraceTopRD", "TerraceTopD", "TerraceTopLD", "TerraceTopL", "TerraceTopLT",
    "CliffFaceL", "CliffFaceM", "CliffFaceR", "CliffFaceLD", "CliffFaceD", "CliffFaceRD", "Big Wall"]) {
    if (idx[need] === undefined) throw new Error("wall.tileset missing tile name: " + need);
  }
  return idx;
}

// ---------- 9방향 오토타일 접미사 (L5 테라스 링 전용 — 잔디 커버는 서브셀 모델 사용) ----------
function autotileSuffix(maskAt, x, y) {
  const t = maskAt(x, y + 1), d = maskAt(x, y - 1), l = maskAt(x - 1, y), r = maskAt(x + 1, y);
  if (!t && !l) return "LT";
  if (!t && !r) return "RT";
  if (!d && !l) return "LD";
  if (!d && !r) return "RD";
  if (!t) return "T";
  if (!d) return "D";
  if (!l) return "L";
  if (!r) return "R";
  return "";
}

// ---------- 서브셀 흙 마스크 빌더 ----------
// dirt: Set("sx,sy") — 서브셀 좌표. 셀 (x,y)의 서브셀 = sx∈{2x,2x+1}, sy∈{2y,2y+1}.
function makeDirt(bandInner) {
  const playMax = bandInner - 1; // 흙이 존재할 수 있는 마지막 플레이어블 셀
  const inPlay = (sx, sy) => {
    const cx = Math.floor(sx / 2), cy = Math.floor(sy / 2);
    return Math.abs(cx) <= playMax && Math.abs(cy) <= playMax;
  };
  const all = new Set();    // 전체 흙 (plaza + walk − island)
  const plazaOnly = new Set(); // plaza 기여분만 (검증: 홀은 광장에서만 허용)
  const walkCells = new Set(); // walk 밴드가 닿은 셀 (검증: 길 셀 L2 홀 0)
  const addRange = (set, sx0, sx1, sy0, sy1, isWalk) => {
    for (let sx = sx0; sx <= sx1; sx++) for (let sy = sy0; sy <= sy1; sy++) {
      if (!inPlay(sx, sy)) continue;
      set.add(sx + "," + sy);
      if (isWalk) walkCells.add(Math.floor(sx / 2) + "," + Math.floor(sy / 2));
    }
  };
  return {
    all, plazaOnly, walkCells,
    // 문법 2: 광장/밭/아레나 — 셀 사각형 [x0..x1]×[y0..y1] + ½셀 마진
    plaza(x0, x1, y0, y1) {
      addRange(all, 2 * x0 - 1, 2 * x1 + 2, 2 * y0 - 1, 2 * y1 + 2, false);
      addRange(plazaOnly, 2 * x0 - 1, 2 * x1 + 2, 2 * y0 - 1, 2 * y1 + 2, false);
    },
    // 광장 안 잔디 섬(정원) — 같은 ½ 마진으로 흙을 도려냄. plaza/walk 추가가 모두 끝난 뒤 호출할 것.
    island(x0, x1, y0, y1) {
      for (let sx = 2 * x0 - 1; sx <= 2 * x1 + 2; sx++) for (let sy = 2 * y0 - 1; sy <= 2 * y1 + 2; sy++) {
        all.delete(sx + "," + sy);
        plazaOnly.delete(sx + "," + sy);
      }
    },
    // 문법 1: 길 — 셀 경계 좌표 폴리라인. 점 (bx,by) = 셀 bx|bx+1, by|by+1 사이의 격자 교점.
    // 구간마다 폭 2서브셀(=시각 1셀) 흙 밴드. 자유 끝단은 오목 코너 페어로 자동 캡.
    walk(points) {
      for (let i = 1; i < points.length; i++) {
        const [ax, ay] = points[i - 1], [bx, by] = points[i];
        if (ax !== bx && ay !== by) throw new Error("walk: 구간은 수평/수직만 가능 " + JSON.stringify([points[i - 1], points[i]]));
        if (ay === by) { // 수평
          const x0 = Math.min(ax, bx), x1 = Math.max(ax, bx);
          addRange(all, 2 * x0 + 1, 2 * x1 + 2, 2 * ay + 1, 2 * ay + 2, true);
        } else {         // 수직
          const y0 = Math.min(ay, by), y1 = Math.max(ay, by);
          addRange(all, 2 * ax + 1, 2 * ax + 2, 2 * y0 + 1, 2 * y1 + 2, true);
        }
      }
    },
  };
}

// 셀 (x,y)의 2×2 서브셀 흙 패턴 → L2 타일 인덱스.
// 반환: tileIndex(잔디 패밀리) | null(홀 — L2 빈 칸) | undefined(무효 대각 패턴)
function cellTile(IDX, dirt, x, y) {
  const has = (sx, sy) => dirt.has(sx + "," + sy);
  const tl = has(2 * x, 2 * y + 1), tr = has(2 * x + 1, 2 * y + 1);
  const bl = has(2 * x, 2 * y), br = has(2 * x + 1, 2 * y);
  const n = (tl ? 1 : 0) + (tr ? 1 : 0) + (bl ? 1 : 0) + (br ? 1 : 0);
  if (n === 0) return IDX["FullGrass"];
  if (n === 4) return null;
  if (n === 2) {
    if (tl && tr) return IDX["GrassT"];
    if (bl && br) return IDX["GrassD"];
    if (tl && bl) return IDX["GrassL"];
    if (tr && br) return IDX["GrassR"];
    return undefined; // 대각 2칸 — 렌더 불가
  }
  if (n === 3) {
    if (!br) return IDX["GrassLT"];
    if (!bl) return IDX["GrassRT"];
    if (!tr) return IDX["GrassLD"];
    return IDX["GrassRD"];
  }
  // n === 1 — 오목 노치
  if (tl) return IDX["GrassLTCorner"];
  if (tr) return IDX["GrassRTCorner"];
  if (bl) return IDX["GrassLDCorner"];
  return IDX["GrassRDCorner"];
}

// (선택) 데코 플래토용 셀 사각형 헬퍼
function rect(set, x0, x1, y0, y1) {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) set.add(x + "," + y);
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
// layerNames: 논리 슬롯(base/grass/floors/walls/deco) -> 이 맵에서 실제 사용할 엔티티 이름.
function normalizeLayers(m, layerNames, forceSL) {
  const root = mapRootName(m);
  const ents = m.json.ContentProto.Entities;
  const scheme = [
    { slot: "base",   name: layerNames.base,   sl: "MapLayer0", ts: WALL_TILESET_RUID },
    { slot: "grass",  name: layerNames.grass,  sl: "MapLayer1", ts: WALL_TILESET_RUID },
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
const DEFAULT_LAYER_NAMES = { base: "RectTileMap", grass: "RectTileMap2", floors: "RectTileMap3", walls: "RectTileMap4", deco: "RectTileMap5" };

// design(d): d.plaza(...)/d.walk(...)/d.island(...) 호출로 흙 마스크를 구성하는 콜백.
// inspect: 보고용 점검 포인트 [{ kind, at, note }].
function paintMap(rel, R, design, opts) {
  opts = opts || {};
  const IDX = loadWallTileIndex();
  const m = loadMap(rel);
  console.log("##", rel);
  const L = normalizeLayers(m, opts.layerNames || DEFAULT_LAYER_NAMES, opts.forceSL);
  const bandInner = R - 2; // 3겹 경계 밴드 (ResourceSpawner.WallThickness=3과 일치)

  // L1: Soil 전면 (밴드 포함 — 길/광장 바닥이자 절벽 링 밑바탕)
  const base = new Map();
  for (let x = -R; x <= R; x++) for (let y = -R; y <= R; y++) base.set(x + "," + y, IDX["Soil"]);
  setTiles(L.base, base);

  // L2: 잔디 커버 — 서브셀 흙 마스크에서 셀별 패턴 → 타일. 홀(광장 내부)만 빈 칸으로 남긴다.
  const d = makeDirt(bandInner);
  design(d);
  const grassTiles = new Map();
  const bad = [];        // 무효 대각 패턴
  const pathHoles = [];  // 길(walk) 셀에 생긴 비인가 홀
  let holeCount = 0;
  for (let x = -R; x <= R; x++) for (let y = -R; y <= R; y++) {
    const t = cellTile(IDX, d.all, x, y);
    if (t === undefined) { bad.push(`(${x},${y})`); continue; }
    if (t === null) {
      holeCount++;
      // 검증: 홀은 광장 기여만으로도 홀이어야 한다 (길 밴드가 홀을 만들면 안 됨)
      if (d.walkCells.has(x + "," + y) && cellTile(IDX, d.plazaOnly, x, y) !== null) {
        pathHoles.push(`(${x},${y})`);
      }
      continue;
    }
    grassTiles.set(x + "," + y, t);
  }
  setTiles(L.grass, grassTiles);

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

  // 산출 검사 (Acceptance: 길 셀 L2 홀 0건 · 무효 타일 0건)
  if (bad.length > 0) throw new Error(`${rel}: 무효 대각 흙 패턴 ${bad.length}건 — ${bad.slice(0, 8).join(" ")}`);
  if (pathHoles.length > 0) throw new Error(`${rel}: 길 셀 L2 홀 ${pathHoles.length}건 — ${pathHoles.slice(0, 8).join(" ")}`);
  fs.writeFileSync(m.path, JSON.stringify(m.json, null, 2));
  console.log(`  saved: base=${base.size} grass=${grassTiles.size} holes=${holeCount} wall=${walls.size} deco=${deco.size}`);
  console.log(`  검사: 무효 타일 0건, 길 셀 L2 홀 0건 (길 셀 ${d.walkCells.size}개)`);
  if (opts.inspect) for (const p of opts.inspect) console.log(`  점검: [${p.kind}] (${p.at}) ${p.note}`);
}

// ================= 맵별 디자인 =================

// --- 영지 map01 (R=30, MyMap.png 레퍼런스): 중앙 우물 광장 + 굽이치는 북쪽 길 + 남서 밭 단지 ---
// 광장/밭/마당 = 문법 2(홀), 길 = 문법 1(밀착 페어 폭 1). walk 점 = 셀 경계 좌표.
paintMap("map/map01.map", 30, d => {
  d.plaza(-3, 3, -3, 3);          // 우물 광장 (7x7 홀 — MyMap 중앙 우물 자리)
  d.plaza(-2, 2, -16, -12);       // 남쪽 끝 마당 (5x5 홀, 닭장 자리)
  d.plaza(-23, -19, -8, -3);      // 밭 A (B와의 고랑 잔디 스트립 2칸 확보 — 페어 문법 최소 폭)
  d.plaza(-16, -10, -8, -3);      // 밭 B (진입로에 접함)
  d.plaza(-23, -10, -15, -11);    // 밭 C (아래 가로 구획)
  d.walk([[-1, 3], [-1, 9], [-6, 9], [-6, 18], [1, 18], [1, 27]]); // 북쪽 S자 길 (광장→북벽)
  d.walk([[3, -1], [27, -1]]);    // 동쪽 길 (광장→동벽, 강가 방면)
  d.walk([[-1, -4], [-1, -12]]);  // 남쪽 길 (광장→마당)
  d.walk([[-4, -1], [-10, -1], [-10, -12]]); // 서쪽 길 (광장→밭 B 동변→밭 C)
}, {
  // map01 레이어는 Maker에서 표준명으로 정규화 저장됨 (2026-07-04 사용자 작업) → 기본 매핑 사용.
  inspect: [
    { kind: "꺾임", at: "-1,9 / -6,9 / -6,18 / 1,18", note: "북쪽 S자 길 볼록/오목 코너 4곳" },
    { kind: "꺾임", at: "-10,-1", note: "서쪽 길 남향 꺾임" },
    { kind: "접속", at: "-1,3 · 3,-1 · -1,-4 · -4,-1", note: "우물 광장 4방 길 접속부" },
    { kind: "접속", at: "-1,-12", note: "남쪽 길→마당 북변" },
    { kind: "접속", at: "-10,-4 ~ -10,-12", note: "서쪽 길이 밭 B 동변을 따라 내려가 밭 C에 합류" },
    { kind: "플러시", at: "1,27 · 27,-1", note: "북벽/동벽 밑 플러시 끊김 (절벽/테라스가 덮음)" },
  ],
});

// --- 마을 town (R=35, Town.png 레퍼런스): 대형 석재 광장 + 4분면 정원 아일랜드 + 십자 대로 ---
// 대로는 폭 5의 넓은 흙 회랑 → 문법 2(홀 유지)로 유지. 정원 = island 도려냄.
// 기존 엔티티 유지: House(-5,5)·ResearchLab(5,5)는 북쪽 정원 위, Merchant(-3,2)·Portal(5,0)·Spawn(0,-1)은 광장 위
paintMap("map/town.map", 35, d => {
  d.plaza(-14, 14, -13, 9);       // 대광장 (석재 바닥 전체)
  d.plaza(-2, 2, 9, 32);          // 북쪽 대로 (건물 사이)
  d.plaza(-2, 2, -32, -13);       // 남쪽 대로
  d.plaza(14, 32, -2, 2);         // 동쪽 대로
  d.plaza(-32, -14, -2, 2);       // 서쪽 대로
  // 4분면 정원 아일랜드 (광장에서 잔디로 도려냄 — Town.png의 화단 구역) — plaza 뒤에 호출
  d.island(-11, -4, 2, 6);        // 북서 정원 (House가 위에 얹힘)
  d.island(4, 11, 2, 6);          // 북동 정원 (ResearchLab)
  d.island(-11, -4, -10, -5);     // 남서 정원
  d.island(4, 11, -10, -5);       // 남동 정원
}, {
  inspect: [
    { kind: "접속", at: "±2,9 · ±2,-13 · 14,±2 · -14,±2", note: "대광장↔십자 대로 4곳 어깨 (홀-홀 병합)" },
    { kind: "정원", at: "북서/북동/남서/남동 정원 12개 모서리", note: "광장 쪽 볼록 코너 프린지 방향 확인" },
    { kind: "플러시", at: "대로 4방 끝 (±32)", note: "벽 밴드 밑 플러시 끊김" },
  ],
});

// --- 사냥터 template_field (R=30): 공터 3곳 + 포탈 패드 2곳(문법 2) + 연결 길(문법 1) + NE 플래토 데코 ---
paintMap("map/template_field.map", 30, d => {
  d.plaza(-5, 5, -5, 5);          // 중앙 공터 (11x11, 귀환 포탈 (0,-3) 포함)
  d.plaza(-13, -7, -3, 3);        // 서쪽 포탈 패드 (7x7)
  d.plaza(7, 13, -3, 3);          // 동쪽 포탈 패드 (7x7)
  d.plaza(-21, -11, 9, 19);       // 북서 공터 (11x11)
  d.plaza(8, 20, -19, -7);        // 남동 공터 (13x13)
  d.walk([[-8, -1], [8, -1]]);    // 동서 연결 길 (서패드→중앙→동패드)
  d.walk([[-1, 4], [-1, 13], [-13, 13]]); // 북쪽 길 → 북서 공터
  d.walk([[13, -1], [13, -8]]);   // 남동 연결 (동패드 남변→남동 공터)
}, {
  layerNames: { base: "RectTileMap", grass: "RectTileMap2", floors: "RectTileMap3", walls: "RectTileMap4", deco: "RectTileMap5" },
  plateau: { x0: 17, x1: 24, y0: 15, y1: 20 },
  inspect: [
    { kind: "꺾임", at: "-1,13", note: "북쪽 길 서향 꺾임" },
    { kind: "접속", at: "-8,-1 · 8,-1 (패드) · -1,4 (중앙) · -13,13 (북서) · 13,-1 · 13,-8 (남동)", note: "길↔공터/패드 접속 6곳" },
    { kind: "통과", at: "중앙 공터 (-5..5, -1..0)", note: "동서 길이 중앙 홀을 관통 — 홀 합류 확인" },
  ],
});

// --- 보스 아레나 template_boss (R=15): 사각 아레나 + 남쪽 포탈 회랑 (둘 다 문법 2 — 회랑은 셀 중심 대칭 유지) ---
paintMap("map/template_boss.map", 15, d => {
  d.plaza(-7, 7, -5, 9);          // 아레나 (보스 (0,2) 중심, 15x15 홀)
  d.plaza(-1, 1, -10, -3);        // 남쪽 포탈 회랑 ((0,-8),(0,-7) 포함, 아레나 남변과 겹쳐 병합)
}, {
  // 기존 RectTileMap(SL4)/RectTileMap2(SL5)는 SL만 교정 (컴포넌트 필드 변경은 증분 적용 가능)
  forceSL: { RectTileMap: "MapLayer0", RectTileMap2: "MapLayer1" },
  inspect: [
    { kind: "접속", at: "±1,-5 부근", note: "회랑↔아레나 어깨 (홀-홀 병합) 오목 코너" },
    { kind: "끝단", at: "-1..1,-10", note: "회랑 남쪽 끝 프린지/코너" },
  ],
});

console.log("done. 다음: Maker refresh -> 빌드 로그 확인 (플레이 검증은 보스)");
