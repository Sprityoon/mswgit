#!/usr/bin/env python3
import os
import sys
from PIL import Image

# Add skill script directory to sys.path to import pixeltool
SKILL_DIR = r"c:\minho\메이플월드\.agents\skills\image-to-pixel\scripts"
sys.path.append(SKILL_DIR)
import pixeltool

def main():
    gen_path = r"C:\Users\윤민호\.gemini\antigravity-ide\brain\438f1113-2dad-475b-a17b-c759442e4b69\topdown_front_barn_gen_1784702226146.png"
    pxg_out_path = r"c:\minho\메이플월드\scratch\artwork_rework\topdown_barn_front.pxg"
    png_out_path = r"c:\minho\메이플월드\scratch\artwork_rework\topdown_barn_front_256.png"

    # 1. Open generated image
    im = Image.open(gen_path).convert("RGBA")
    w, h = im.size
    target_size = 256

    if (w, h) != (target_size, target_size):
        im = im.resize((target_size, target_size), Image.Resampling.LANCZOS)
        w, h = target_size, target_size

    px_data = list(im.getdata()) if hasattr(im, 'getdata') else list(im.get_flattened_data())
    rows = [px_data[y * w : (y + 1) * w] for y in range(h)]

    # 2. Define MapleStory Cartoon palette ramps & keys
    # Warm, slightly desaturated, high-contrast, selout-compatible ramps
    palette_def = [
        # Background / Transparent
        ('.', 'transparent'),
        
        # Roof Ramps (MapleStory Warm Terracotta Red Tile)
        ('r', '#521A15'), # Dark wine selout
        ('R', '#8C2E24'), # Deep shadow
        ('o', '#BF4737'), # Mid shadow
        ('O', '#E55F4D'), # Base Maple red fill
        ('p', '#F4887A'), # Mid highlight
        ('P', '#FBB7AD'), # Top rim highlight
        
        # Wood Frame & Wall Ramps (Maple Warm Honey Wood & Timber)
        ('w', '#4A300E'), # Dark timber brown selout
        ('W', '#78501B'), # Deep shadow wood
        ('y', '#AA762B'), # Mid shadow wood
        ('Y', '#DDA641'), # Base honey wood fill
        ('z', '#F0C96A'), # Mid highlight beam
        ('Z', '#FCE59E'), # Light top wood accent
        
        # Barn Doorway & Dark Interior
        ('d', '#181524'), # Deepest dark interior shadow
        ('D', '#2D283E'), # Frame shadow
        
        # Hay Bales Ramps (Maple Warm Golden Yellow Straw)
        ('h', '#694B0A'), # Selout dark gold
        ('H', '#9C7317'), # Deep shadow straw
        ('s', '#CF9E25'), # Mid shadow straw
        ('S', '#F4C73B'), # Base Maple yellow fill
        ('t', '#FCE36D'), # Mid highlight straw
        ('T', '#FFF7B3'), # Top straw highlight
        
        # Anvil & Metal Ramps (Maple Slate Blue-Grey Metal)
        ('m', '#1C2736'), # Selout deep slate
        ('M', '#32445B'), # Deep shadow metal
        ('v', '#4F6787'), # Base slate blue fill
        ('V', '#7B96BC'), # Highlight metal
        ('u', '#B8D0EF'), # Specular sheen
        
        # Grass Base Ramps (Maple Bright Sage/Fresh Green)
        ('g', '#1B3D11'), # Selout dark forest green
        ('G', '#336322'), # Deep grass shadow
        ('x', '#5AA83B'), # Mid shadow green
        ('X', '#83C963'), # Base Maple green fill
        ('q', '#AEE594'), # Light highlight grass
        ('Q', '#D8FAD0'), # Top rim light grass
    ]

    color_map = {}
    for key, hex_val in palette_def:
        if hex_val == 'transparent':
            continue
        hex_clean = hex_val.lstrip('#')
        r = int(hex_clean[0:2], 16)
        g = int(hex_clean[2:4], 16)
        b = int(hex_clean[4:6], 16)
        color_map[key] = (r, g, b)

    # Function to find closest key
    def get_closest_key(r, g, b, a):
        # White or near white background -> transparent
        if a < 30 or (r > 240 and g > 240 and b > 240):
            return '.'
        best_key = '.'
        min_dist = 999999
        for key, rgb in color_map.items():
            dist = (r - rgb[0])**2 + (g - rgb[1])**2 + (b - rgb[2])**2
            if dist < min_dist:
                min_dist = dist
                best_key = key
        return best_key

    # Generate initial grid
    grid = []
    for y in range(h):
        line = []
        for x in range(w):
            r, g, b, a = rows[y][x]
            key = get_closest_key(r, g, b, a)
            line.append(key)
        grid.append(line)

    # 3. Post-process cleanup passes for Maple Cartoon style:
    # Pass A: Selout enforcement on outer border (replace edge pixels adjacent to '.' with appropriate selout key)
    selout_map = {
        'o': 'r', 'O': 'r', 'p': 'r', 'P': 'r', 'R': 'r',
        'Y': 'w', 'z': 'w', 'Z': 'w', 'y': 'w', 'W': 'w',
        'S': 'h', 's': 'h', 'H': 'h', 't': 'h', 'T': 'h',
        'v': 'm', 'V': 'm', 'u': 'm', 'M': 'm',
        'x': 'g', 'X': 'g', 'q': 'g', 'Q': 'g', 'G': 'g',
    }

    for y in range(h):
        for x in range(w):
            key = grid[y][x]
            if key in selout_map:
                # Check 4-neighbors for '.' (transparent)
                is_edge = False
                for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w:
                        if grid[ny][nx] == '.':
                            is_edge = True
                            break
                    else:
                        is_edge = True
                        break
                if is_edge:
                    grid[y][x] = selout_map[key]

    # Pass B: Remove single stray orphan pixels surrounded by '.'
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            if grid[y][x] != '.':
                dots = 0
                for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    if grid[y + dy][x + dx] == '.':
                        dots += 1
                if dots == 4:
                    grid[y][x] = '.'

    # Convert back to string lines
    grid_lines = ["".join(row) for row in grid]

    # Write .pxg file
    pxg_content = []
    pxg_content.append("PXG 1")
    pxg_content.append(f"size {w} {h}")
    for key, hex_val in palette_def:
        pxg_content.append(f"{key} {hex_val}")
    pxg_content.append("grid")
    pxg_content.extend(grid_lines)

    with open(pxg_out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(pxg_content) + "\n")

    print(f"Successfully updated {pxg_out_path} ({w}x{h}) with MapleStory palette")

if __name__ == "__main__":
    main()
