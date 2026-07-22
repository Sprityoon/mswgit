#!/usr/bin/env python3
import os
import sys
from PIL import Image

# Add skill script directory to sys.path to import pixeltool
SKILL_DIR = r"c:\minho\메이플월드\.agents\skills\image-to-pixel\scripts"
sys.path.append(SKILL_DIR)
import pixeltool

def main():
    gen_path = r"C:\Users\윤민호\.gemini\antigravity-ide\brain\a967dd00-209d-4c1e-b66c-f5f3e3760fc3\msw_topdown_barn_gen_1784700871578.png"
    pxg_out_path = r"c:\minho\메이플월드\scratch\artwork_rework\msw_topdown_barn.pxg"
    png_out_path = r"c:\minho\메이플월드\scratch\artwork_rework\msw_topdown_barn_256.png"

    # 1. Open generated image
    im = Image.open(gen_path).convert("RGBA")
    w, h = im.size
    target_size = 256

    # Resize to exact 256x256 if needed
    if (w, h) != (target_size, target_size):
        im = im.resize((target_size, target_size), Image.Resampling.LANCZOS)
        w, h = target_size, target_size

    px_data = list(im.getdata())
    rows = [px_data[y * w : (y + 1) * w] for y in range(h)]

    # 2. Define cartoon palette ramps & keys
    # Key mapping (single char per color)
    palette_def = [
        # Background / Transparent
        ('.', 'transparent'),
        
        # Roof Ramps (Gambrel orange-red tile)
        ('r', '#7A2A20'), # Deep shadow / selout
        ('R', '#B14A2E'), # Mid shadow
        ('o', '#DE5B35'), # Base fill
        ('O', '#EE7E48'), # Mid highlight
        ('p', '#F7AC69'), # Top highlight
        
        # Wood Frame Ramps (Warm yellow timber & beams)
        ('w', '#5E421A'), # Selout/Dark shadow
        ('W', '#8C6324'), # Deep shadow
        ('y', '#B88B32'), # Mid shadow
        ('Y', '#E0B143'), # Base timber fill
        ('z', '#F5C85A'), # Highlight beam
        ('Z', '#FDE48C'), # Light top accent
        
        # Barn Doorway & Interior
        ('d', '#1A1829'), # Deepest dark entrance
        ('D', '#302B47'), # Entrance frame shadow
        
        # Hay Bales Ramps (Golden yellow straw)
        ('h', '#7D5104'), # Selout/Shadow
        ('H', '#AD8834'), # Deep shadow
        ('s', '#D6A927'), # Mid shadow
        ('S', '#F0C431'), # Base yellow fill
        ('t', '#FAF063'), # Top highlight straw
        
        # Anvil & Metal Ramps (Slate blue-grey)
        ('m', '#1E2836'), # Selout/Dark metal
        ('M', '#36475C'), # Deep shadow
        ('v', '#526A87'), # Base slate fill
        ('V', '#7C9ABF'), # Highlight metal
        ('u', '#B5CBEB'), # Specular sheen
        
        # Tree Stump & Wheelbarrow Wood (Rustic brown wood)
        ('b', '#3B2817'), # Dark wood selout
        ('B', '#593E26'), # Deep brown shadow
        ('n', '#7B5838'), # Base brown fill
        ('N', '#9C734D'), # Mid highlight brown
        
        # Grass Base Ramps (Fresh ground green)
        ('g', '#244512'), # Selout/Grass shadow
        ('G', '#3C6A21'), # Deep grass shadow
        ('x', '#5CA632'), # Base grass green
        ('X', '#82C750'), # Mid highlight grass
        ('q', '#B0E678'), # Light rim grass
        
        # Fence Ramps (Off-white / pale cyan wooden fence)
        ('f', '#5A6B75'), # Fence shadow
        ('F', '#A5B8C4'), # Base pale wood
        ('e', '#E1EBF0'), # Fence highlight
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
        # White / light background threshold -> transparent
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

    # Generate grid
    grid_lines = []
    for y in range(h):
        line = []
        for x in range(w):
            r, g, b, a = rows[y][x]
            key = get_closest_key(r, g, b, a)
            line.append(key)
        grid_lines.append("".join(line))

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

    print(f"Wrote {pxg_out_path} ({w}x{h})")

    # Render with pixeltool
    # Render PNG 1:1 and preview @4x
    pxg_data = pixeltool.load_pxg(pxg_out_path)
    out_rows, out_w, out_h = pixeltool.render_rows(pxg_data)
    png_bytes = pixeltool.png_encode(out_rows, out_w, out_h)
    open(png_out_path, "wb").write(png_bytes)
    print(f"Rendered {png_out_path}")

    # Generate preview @4x
    prev_rows = pixeltool.scale_rows(out_rows, out_w, out_h, 4)
    prev_path = png_out_path.replace(".png", "@4x.png")
    open(prev_path, "wb").write(pixeltool.png_encode(prev_rows, out_w * 4, out_h * 4))
    print(f"Rendered preview {prev_path}")

if __name__ == "__main__":
    main()
