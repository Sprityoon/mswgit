// Generates the mining-reticle PNG (100x100 RGBA) directly — no browser/puppeteer.
// Gold cell-frame with bright corner accents + faint interior fill, transparent bg.
const fs = require("fs");
const zlib = require("zlib");

const W = 100, H = 100;
const buf = Buffer.alloc(W * H * 4); // RGBA, zero = transparent

function px(x, y, r, g, b, a) {
  const i = (y * W + x) * 4;
  buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = a;
}

const GOLD = [255, 210, 63];
const ACCENT = [255, 241, 176];

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const inOuter = x >= 4 && x < 96 && y >= 4 && y < 96;
    if (!inOuter) continue;
    const onFrame = (x < 11 || x >= 89 || y < 11 || y >= 89);
    // corner accent regions (~22px legs)
    const cornerX = (x < 26 || x >= 74);
    const cornerY = (y < 26 || y >= 74);
    const onAccent = onFrame && ((cornerX && (y < 11 || y >= 89)) || (cornerY && (x < 11 || x >= 89)));
    if (onAccent) {
      px(x, y, ACCENT[0], ACCENT[1], ACCENT[2], 255);
    } else if (onFrame) {
      px(x, y, GOLD[0], GOLD[1], GOLD[2], 242); // ~0.95
    } else {
      px(x, y, GOLD[0], GOLD[1], GOLD[2], 51);  // ~0.20 faint fill
    }
  }
}

// ---- PNG encode ----
function crcTable() {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
}
const CRCT = crcTable();
function crc32(buf2) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf2.length; i++) c = CRCT[(c ^ buf2[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

// filtered scanlines (filter byte 0 per row)
const raw = Buffer.alloc(H * (1 + W * 4));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 4)] = 0;
  buf.copy(raw, y * (1 + W * 4) + 1, y * W * 4, (y + 1) * W * 4);
}
const idatData = zlib.deflateSync(raw);
const png = Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idatData), chunk("IEND", Buffer.alloc(0))]);

fs.writeFileSync("scripts/reticle.png", png);
console.log("wrote scripts/reticle.png (" + png.length + " bytes, " + W + "x" + H + " RGBA)");
