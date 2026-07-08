#!/usr/bin/env python3
"""pixeltool — render, convert, and analyze pixel art via the .pxg text format.

Pure Python 3 stdlib (no dependencies). Pillow is used only as an automatic
fallback for exotic inputs (16-bit/interlaced PNG, JPEG), if installed.

Subcommands:
  render    .pxg -> .png (+ optional nearest-neighbor preview, optional crop)
  grid      .png -> .pxg (for editing/analyzing existing sprites)
  analyze   .png -> palette clusters, ramps, outline stats, upscale detection
  pixelize  high-res .png -> quantized+downscaled .pxg (image-gen assisted path)

.pxg format (see references/pxg-format.md):
  PXG 1
  size 8 8
  . transparent
  O #1A3A5C
  b #4A90D9
  grid
  ..OOOO..
  .ObbbbO.
  ...
"""
import argparse
import json
import struct
import sys
import zlib
from collections import Counter

KEY_CHARS = (".abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
             "0123456789!@$%^&*()-=+[]{};:,<>?~")

# ---------------------------------------------------------------- PNG encode

def png_encode(rows, w, h):
    """rows: list of h lists of w (r,g,b,a) tuples -> PNG bytes."""
    raw = b"".join(
        b"\x00" + b"".join(struct.pack("4B", *px) for px in row) for row in rows
    )

    def chunk(tag, data):
        return (struct.pack(">I", len(data)) + tag + data
                + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))

    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr)
            + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


# ---------------------------------------------------------------- PNG decode

def _pil_decode(path):
    try:
        from PIL import Image
    except ImportError:
        sys.exit(f"{path}: unsupported format (16-bit/interlaced PNG, or not a PNG). "
                 "Re-save as a standard 8-bit PNG, or `pip install Pillow`.")
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    px = list(im.getdata())
    return [px[y * w:(y + 1) * w] for y in range(h)], w, h


def png_decode(path):
    """-> (rows of (r,g,b,a), w, h). Handles 8-bit non-interlaced PNG natively."""
    data = open(path, "rb").read()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        return _pil_decode(path)
    pos, ihdr, idat, plte, trns = 8, None, b"", None, None
    while pos + 8 <= len(data):
        (ln,) = struct.unpack(">I", data[pos:pos + 4])
        tag = data[pos + 4:pos + 8]
        body = data[pos + 8:pos + 8 + ln]
        pos += 12 + ln
        if tag == b"IHDR":
            ihdr = struct.unpack(">IIBBBBB", body)
        elif tag == b"PLTE":
            plte = body
        elif tag == b"tRNS":
            trns = body
        elif tag == b"IDAT":
            idat += body
        elif tag == b"IEND":
            break
    w, h, depth, ctype, _, _, interlace = ihdr
    if depth != 8 or interlace != 0 or ctype not in (0, 2, 3, 4, 6):
        return _pil_decode(path)
    nch = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[ctype]
    raw = zlib.decompress(idat)
    stride = w * nch
    rows, prev, p = [], bytearray(stride), 0
    for _ in range(h):
        f = raw[p]
        p += 1
        line = bytearray(raw[p:p + stride])
        p += stride
        if f == 1:
            for i in range(nch, stride):
                line[i] = (line[i] + line[i - nch]) & 255
        elif f == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 255
        elif f == 3:
            for i in range(stride):
                a = line[i - nch] if i >= nch else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 255
        elif f == 4:
            for i in range(stride):
                a = line[i - nch] if i >= nch else 0
                b = prev[i]
                c = prev[i - nch] if i >= nch else 0
                pa, pb, pc = abs(b - c), abs(a - c), abs(a + b - 2 * c)
                pred = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pred) & 255
        prev = line
        row = []
        for x in range(w):
            i = x * nch
            if ctype == 2:
                row.append((line[i], line[i + 1], line[i + 2], 255))
            elif ctype == 6:
                row.append((line[i], line[i + 1], line[i + 2], line[i + 3]))
            elif ctype == 0:
                g = line[i]
                row.append((g, g, g, 255))
            elif ctype == 4:
                g = line[i]
                row.append((g, g, g, line[i + 1]))
            else:  # 3: palette
                idx = line[i]
                r, g, b = plte[idx * 3], plte[idx * 3 + 1], plte[idx * 3 + 2]
                a = trns[idx] if (trns and idx < len(trns)) else 255
                row.append((r, g, b, a))
        rows.append(row)
    return rows, w, h


# ---------------------------------------------------------------- .pxg I/O

def parse_hex(s):
    s = s.lstrip("#")
    if len(s) == 3:
        s = "".join(c * 2 for c in s)
    if len(s) == 6:
        s += "FF"
    if len(s) != 8:
        raise ValueError(f"bad color #{s}")
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4, 6))


def pxg_parse(text, path="<pxg>"):
    lines = [ln.rstrip() for ln in text.splitlines()]
    palette, w, h, grid_rows, in_grid = {}, None, None, [], False
    for n, ln in enumerate(lines, 1):
        s = ln.strip()
        if not s or s.startswith("//"):
            continue
        if not in_grid:
            if s.upper().startswith("PXG"):
                continue
            if s.lower().startswith("size"):
                _, w, h = s.split()
                w, h = int(w), int(h)
            elif s.lower() == "grid":
                in_grid = True
            else:
                parts = s.split()
                if len(parts) != 2 or len(parts[0]) != 1:
                    sys.exit(f"{path}:{n}: bad palette line {s!r} (want: <char> <#hex|transparent>)")
                key, val = parts
                palette[key] = (0, 0, 0, 0) if val.lower() == "transparent" else parse_hex(val)
        else:
            cells = s.split() if " " in s else list(s)
            grid_rows.append(cells)
    if w is None:
        sys.exit(f"{path}: missing 'size W H' line")
    if len(grid_rows) != h:
        sys.exit(f"{path}: grid has {len(grid_rows)} rows, size says {h}")
    rows = []
    for y, cells in enumerate(grid_rows):
        if len(cells) != w:
            sys.exit(f"{path}: grid row {y + 1} has {len(cells)} cells, size says {w}")
        row = []
        for x, cell in enumerate(cells):
            if cell not in palette:
                sys.exit(f"{path}: row {y + 1} col {x + 1}: key {cell!r} not in palette")
            row.append(palette[cell])
        rows.append(row)
    return rows, w, h


def pxg_emit(rows, w, h):
    """rows of RGBA -> pxg text. Transparent -> '.'; errors if > len(KEY_CHARS) colors."""
    colors = []
    seen = {}
    for row in rows:
        for px in row:
            px = (0, 0, 0, 0) if px[3] == 0 else px
            if px not in seen:
                seen[px] = None
                colors.append(px)
    opaque = [c for c in colors if c != (0, 0, 0, 0)]
    if len(opaque) > len(KEY_CHARS) - 1:
        sys.exit(f"{len(opaque)} colors — too many for .pxg keys "
                 f"(max {len(KEY_CHARS) - 1}). Run `pixelize --colors N` first.")
    keymap = {(0, 0, 0, 0): "."}
    ks = [c for c in KEY_CHARS if c != "."]
    for i, c in enumerate(opaque):
        keymap[c] = ks[i]
    out = ["PXG 1", f"size {w} {h}", ". transparent"]
    for c in opaque:
        r, g, b, a = c
        hexs = f"#{r:02X}{g:02X}{b:02X}" + (f"{a:02X}" if a != 255 else "")
        out.append(f"{keymap[c]} {hexs}")
    out.append("grid")
    for row in rows:
        out.append("".join(keymap[(0, 0, 0, 0) if px[3] == 0 else px] for px in row))
    return "\n".join(out) + "\n"


def upscale(rows, w, h, k):
    return [[px for px in row for _ in range(k)] for row in rows for _ in range(k)]


# ---------------------------------------------------------------- analysis

def rgb_dist2(a, b):
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2


def detect_upscale(rows, w, h):
    for k in range(min(w, h, 16), 1, -1):
        if w % k or h % k:
            continue
        ok = all(
            rows[by * k + dy][bx * k + dx] == rows[by * k][bx * k]
            for by in range(h // k) for bx in range(w // k)
            for dy in range(k) for dx in range(k)
        )
        if ok:
            return k
    return 1


def cluster_palette(counter, threshold=28):
    """Greedy cluster of (rgb -> count); returns [(rgb, count)] descending."""
    clusters = []  # [ [sum_r,sum_g,sum_b,count,rep], ... ]
    for color, cnt in counter.most_common():
        for cl in clusters:
            if rgb_dist2(color, cl[4]) <= threshold ** 2:
                cl[0] += color[0] * cnt
                cl[1] += color[1] * cnt
                cl[2] += color[2] * cnt
                cl[3] += cnt
                break
        else:
            clusters.append([color[0] * cnt, color[1] * cnt, color[2] * cnt, cnt, color])
    out = []
    for sr, sg, sb, c, _ in clusters:
        out.append(((round(sr / c), round(sg / c), round(sb / c)), c))
    return sorted(out, key=lambda t: -t[1])


def rgb_to_hsv(c):
    r, g, b = [v / 255 for v in c]
    mx, mn = max(r, g, b), min(r, g, b)
    d = mx - mn
    if d == 0:
        hue = 0.0
    elif mx == r:
        hue = ((g - b) / d) % 6
    elif mx == g:
        hue = (b - r) / d + 2
    else:
        hue = (r - g) / d + 4
    return hue * 60, (d / mx if mx else 0), mx


def analyze(path, as_json=False):
    rows, w, h = png_decode(path)
    k = detect_upscale(rows, w, h)
    if k > 1:
        rows = [[rows[y * k][x * k] for x in range(w // k)] for y in range(h // k)]
        w, h = w // k, h // k
    total = w * h
    opaque = Counter()
    transparent = 0
    for row in rows:
        for px in row:
            if px[3] < 128:
                transparent += 1
            else:
                opaque[px[:3]] += 1
    clusters = cluster_palette(opaque)
    # silhouette (outline) colors: opaque px with a transparent 4-neighbor
    edge = Counter()
    for y in range(h):
        for x in range(w):
            if rows[y][x][3] < 128:
                continue
            for dx, dy in ((0, 1), (0, -1), (1, 0), (-1, 0)):
                nx, ny = x + dx, y + dy
                if not (0 <= nx < w and 0 <= ny < h) or rows[ny][nx][3] < 128:
                    edge[rows[y][x][:3]] += 1
                    break
    edge_total = sum(edge.values()) or 1
    black_share = sum(c for col, c in edge.items() if max(col) < 40) / edge_total
    # ramps: group clusters by hue
    ramps, used = [], set()
    cl_hsv = [(col, cnt, rgb_to_hsv(col)) for col, cnt in clusters]
    for i, (col, cnt, (hue, s, v)) in enumerate(cl_hsv):
        if i in used or s < 0.12:
            continue
        ramp = [(v, col)]
        used.add(i)
        for j, (col2, cnt2, (h2, s2, v2)) in enumerate(cl_hsv):
            if j in used or s2 < 0.12:
                continue
            if min(abs(hue - h2), 360 - abs(hue - h2)) <= 16:
                ramp.append((v2, col2))
                used.add(j)
        if len(ramp) >= 2:
            ramps.append([c for _, c in sorted(ramp)])
    hx = lambda c: "#%02X%02X%02X" % c
    report = {
        "file": path,
        "stored_size": [w * k, h * k],
        "detected_upscale": k,
        "logical_size": [w, h],
        "transparent_share": round(transparent / total, 3),
        "unique_colors": len(opaque),
        "palette_clusters": [{"hex": hx(c), "share": round(n / max(sum(opaque.values()), 1), 3)}
                             for c, n in clusters[:20]],
        "ramps_dark_to_light": [[hx(c) for c in r] for r in ramps[:8]],
        "outline": {
            "pure_black_share": round(black_share, 3),
            "top_colors": [hx(c) for c, _ in edge.most_common(5)],
        },
    }
    if as_json:
        print(json.dumps(report, indent=2))
    else:
        print(f"{path}: stored {w * k}x{h * k}, upscale x{k} -> logical {w}x{h}")
        print(f"  transparent {report['transparent_share'] * 100:.0f}%, "
              f"{len(opaque)} unique colors, {len(clusters)} clusters")
        print("  palette:", " ".join(p["hex"] for p in report["palette_clusters"][:12]))
        for r in report["ramps_dark_to_light"]:
            print("  ramp:", " -> ".join(r))
        print(f"  outline: pure-black {black_share * 100:.0f}% | top {report['outline']['top_colors']}")
    return report


# ---------------------------------------------------------------- check

def parse_range(s):
    if ".." in s:
        a, b = s.split("..")
        return float(a), float(b)
    v = float(s)
    return v, v


def load_any(path):
    if path.lower().endswith(".pxg"):
        return pxg_parse(open(path, encoding="utf-8").read(), path)
    return png_decode(path)


def check(path, args):
    rows, w, h = load_any(path)
    xs, ys = [], []
    for y in range(h):
        for x in range(w):
            if rows[y][x][3] >= 128:
                xs.append(x)
                ys.append(y)
    if not xs:
        sys.exit(f"{path}: no opaque pixels")
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    bw, bh = x1 - x0 + 1, y1 - y0 + 1
    baseline_gap = h - 1 - y1
    cx_off = (x0 + x1 + 1) / 2 - w / 2
    print(f"{path}: canvas {w}x{h}  bbox ({x0},{y0})-({x1},{y1})")
    print(f"  width-occ {bw / w:.2f}  height-occ {bh / h:.2f}  "
          f"baseline-gap {baseline_gap}px  center-x offset {cx_off:+.1f}px  "
          f"margins L{x0} T{y0} R{w - 1 - x1} B{baseline_gap}")
    failures = []

    def expect(name, value, spec):
        lo, hi = parse_range(spec)
        ok = lo <= value <= hi
        print(f"  CHECK {name} {spec}: {'PASS' if ok else 'FAIL'} ({value:.2f})")
        if not ok:
            failures.append(name)

    if args.baseline is not None:
        expect("baseline-gap", baseline_gap, args.baseline)
    if args.width_occ is not None:
        expect("width-occ", bw / w, args.width_occ)
    if args.height_occ is not None:
        expect("height-occ", bh / h, args.height_occ)
    if args.center_x is not None:
        expect("center-x-abs", abs(cx_off), f"0..{args.center_x}")
    if args.margin_min is not None:
        expect("margin-min", min(x0, y0, w - 1 - x1), f"{args.margin_min}..{10 ** 9}")
    if args.opaque_edges:
        holes = sum(1 for x in range(w) if rows[0][x][3] < 128 or rows[h - 1][x][3] < 128)
        holes += sum(1 for y in range(h) if rows[y][0][3] < 128 or rows[y][w - 1][3] < 128)
        ok = holes == 0
        print(f"  CHECK opaque-edges: {'PASS' if ok else f'FAIL ({holes} transparent edge px)'}")
        if not ok:
            failures.append("opaque-edges")
    if failures:
        sys.exit(1)


# ---------------------------------------------------------------- pixelize

def median_cut(counter, n_colors):
    box = list(counter.items())  # [(rgb, count)]
    boxes = [box]
    while len(boxes) < n_colors:
        boxes.sort(key=lambda b: -sum(c for _, c in b))
        big = None
        for cand in boxes:
            lo = [min(px[ch] for px, _ in cand) for ch in range(3)]
            hi = [max(px[ch] for px, _ in cand) for ch in range(3)]
            if max(h - l for h, l in zip(hi, lo)) > 0:
                big = cand
                break
        if big is None:
            break
        boxes.remove(big)
        lo = [min(px[ch] for px, _ in big) for ch in range(3)]
        hi = [max(px[ch] for px, _ in big) for ch in range(3)]
        ch = max(range(3), key=lambda i: hi[i] - lo[i])
        big.sort(key=lambda t: t[0][ch])
        half = sum(c for _, c in big) / 2
        acc, cut = 0, 1
        for i, (_, c) in enumerate(big):
            acc += c
            if acc >= half:
                cut = max(1, min(i + 1, len(big) - 1))
                break
        boxes += [big[:cut], big[cut:]]
    pal = []
    for b in boxes:
        tot = sum(c for _, c in b)
        pal.append(tuple(round(sum(px[ch] * c for px, c in b) / tot) for ch in range(3)))
    return pal


def pixelize(path, size, colors, out):
    rows, w, h = png_decode(path)
    if "x" in size:
        tw, th = (int(v) for v in size.split("x"))
    else:
        tw = int(size)
        th = max(1, round(h * tw / w))
    counter = Counter()
    for row in rows:
        for px in row:
            if px[3] >= 128:
                counter[px[:3]] += 1
    if not counter:
        sys.exit(f"{path}: image is fully transparent")
    pal = median_cut(counter, colors)

    def nearest(c):
        return min(pal, key=lambda p: rgb_dist2(p, c))

    out_rows = []
    for ty in range(th):
        row = []
        y0, y1 = ty * h // th, max(ty * h // th + 1, (ty + 1) * h // th)
        for tx in range(tw):
            x0, x1 = tx * w // tw, max(tx * w // tw + 1, (tx + 1) * w // tw)
            cell = Counter()
            alpha_hits = 0
            n = 0
            for y in range(y0, y1):
                for x in range(x0, x1):
                    n += 1
                    px = rows[y][x]
                    if px[3] >= 128:
                        alpha_hits += 1
                        cell[nearest(px[:3])] += 1
            if alpha_hits * 2 < n:
                row.append((0, 0, 0, 0))
            else:
                r, g, b = cell.most_common(1)[0][0]
                row.append((r, g, b, 255))
        out_rows.append(row)
    open(out, "w", encoding="utf-8", newline="\n").write(pxg_emit(out_rows, tw, th))
    print(f"{out}: {tw}x{th}, {colors} colors (dominant-per-cell; clean up by hand next)")


# ---------------------------------------------------------------- commands

def main():
    ap = argparse.ArgumentParser(prog="pixeltool", description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("render", help=".pxg -> .png")
    p.add_argument("input")
    p.add_argument("-o", "--out")
    p.add_argument("--preview", type=int, default=0, metavar="N",
                   help="also write <out>@Nx.png upscaled preview")
    p.add_argument("--crop", nargs=4, type=int, metavar=("X", "Y", "W", "H"))

    p = sub.add_parser("grid", help=".png -> .pxg")
    p.add_argument("input")
    p.add_argument("-o", "--out")
    p.add_argument("--detect-scale", action="store_true",
                   help="collapse a detected integer upscale to the logical grid")

    p = sub.add_parser("analyze", help="report palette/ramps/outline of a sprite")
    p.add_argument("input")
    p.add_argument("--json", action="store_true")

    p = sub.add_parser("check", help="measure/verify composition (bbox, baseline, occupancy) of .png or .pxg")
    p.add_argument("input")
    p.add_argument("--baseline", metavar="MIN..MAX", help="px gap below lowest opaque pixel")
    p.add_argument("--width-occ", metavar="MIN..MAX", help="bbox width / canvas width")
    p.add_argument("--height-occ", metavar="MIN..MAX", help="bbox height / canvas height")
    p.add_argument("--center-x", type=float, metavar="TOL", help="max |bbox center - canvas center| px")
    p.add_argument("--margin-min", type=int, metavar="N", help="min transparent margin on left/top/right")
    p.add_argument("--opaque-edges", action="store_true", help="tile mode: all edge pixels must be opaque")

    p = sub.add_parser("pixelize", help="hi-res image -> quantized+downscaled .pxg")
    p.add_argument("input")
    p.add_argument("--size", required=True, metavar="W[xH]")
    p.add_argument("--colors", type=int, default=24)
    p.add_argument("-o", "--out")

    a = ap.parse_args()
    if a.cmd == "render":
        rows, w, h = pxg_parse(open(a.input, encoding="utf-8").read(), a.input)
        if a.crop:
            x, y, cw, ch = a.crop
            rows = [r[x:x + cw] for r in rows[y:y + ch]]
            w, h = cw, ch
        out = a.out or a.input.rsplit(".", 1)[0] + ".png"
        open(out, "wb").write(png_encode(rows, w, h))
        print(out)
        if a.preview > 1:
            k = a.preview
            pv = out.rsplit(".", 1)[0] + f"@{k}x.png"
            open(pv, "wb").write(png_encode(upscale(rows, w, h, k), w * k, h * k))
            print(pv)
    elif a.cmd == "grid":
        rows, w, h = png_decode(a.input)
        if a.detect_scale:
            k = detect_upscale(rows, w, h)
            if k > 1:
                rows = [[rows[y * k][x * k] for x in range(w // k)] for y in range(h // k)]
                w, h = w // k, h // k
                print(f"// collapsed x{k} upscale -> {w}x{h}", file=sys.stderr)
        out = a.out or a.input.rsplit(".", 1)[0] + ".pxg"
        open(out, "w", encoding="utf-8", newline="\n").write(pxg_emit(rows, w, h))
        print(out)
    elif a.cmd == "analyze":
        analyze(a.input, a.json)
    elif a.cmd == "check":
        check(a.input, a)
    elif a.cmd == "pixelize":
        pixelize(a.input, a.size, a.colors,
                 a.out or a.input.rsplit(".", 1)[0] + ".pxg")


if __name__ == "__main__":
    main()
