import os

# Define 64x64 grid for top-down stall (128x128 output at 2x scale)
# Palette definition
PALETTE = {
    ".": "transparent",
    "_": "#120B0570", # Soft Ground Shadow
    "K": "#1A1009", # Darkest Outline / Shadow
    
    # Straw / Thatch Roof Ramps (Brown-Yellow-Beige)
    "r": "#3D2B15", # Roof shadow
    "R": "#684A28", # Roof base
    "m": "#9E7643", # Roof midtone
    "M": "#C9A364", # Roof highlight 1
    "h": "#EAD18C", # Roof highlight 2
    
    # Vine / Leaves Ramps (Green)
    "v": "#1E360C", # Leaf dark
    "V": "#3D6619", # Leaf base
    "g": "#6EA329", # Leaf midtone
    "G": "#A3D84C", # Leaf highlight
    
    # Wood Posts & Counter Ramps (Warm Wood)
    "w": "#2A1A0E", # Wood shadow
    "W": "#52361E", # Wood base
    "d": "#7E5632", # Wood midtone
    "D": "#AA7D4C", # Wood highlight
    
    # Flag / Banner (Ivory & Red Seal)
    "f": "#695A44", # Flag shadow
    "F": "#BDB29A", # Flag base
    "e": "#E5DEC9", # Flag highlight
    "x": "#8C2A1E", # Flag pattern/stamp
    
    # Dango / Rice Cakes (Pink, Green, Yellow, White)
    "p": "#9E3B52", # Pink dango shadow
    "P": "#E27B91", # Pink dango
    "k": "#3B692B", # Green dango shadow
    "a": "#75B05B", # Green dango
    "y": "#B88E2B", # Yellow dango shadow
    "Y": "#F3C853", # Yellow dango
    "o": "#A8A092", # White dango shadow
    "O": "#F2EDE4", # White dango
    "c": "#5C3E25", # Tray/Box wood
    "C": "#8C633D", # Tray/Box highlight
}

def generate_stall_pxg():
    grid = [["." for _ in range(64)] for _ in range(64)]
    
    # Helper functions to draw on grid with Y-offset (+4)
    Y_OFF = 4
    
    def set_p(x, y_orig, char):
        y = y_orig + Y_OFF
        if 0 <= x < 64 and 0 <= y < 64:
            grid[y][x] = char
            
    def fill_rect(x1, y1, x2, y2, char):
        for y in range(y1, y2 + 1):
            for x in range(x1, x2 + 1):
                set_p(x, y, char)

    # 1. Ground Shadow (Top-down footprint)
    for y in range(48, 59):
        w_factor = (y - 48) / 10.0
        x_min = int(8 + w_factor * 2)
        x_max = int(58 - w_factor * 2)
        for x in range(x_min, x_max + 1):
            set_p(x, y, "_")

    # 2. Flag Pole & Banner (Right side: X=48..59, Y=12..48)
    for y in range(12, 54):
        set_p(53, y, "W")
        set_p(54, y, "d")
        set_p(55, y, "w")
    for x in range(45, 57):
        set_p(x, 14, "d")
        set_p(x, 15, "W")
    set_p(53, 14, "M")
    set_p(54, 14, "M")

    for y in range(16, 43):
        for x in range(46, 53):
            if x == 46:
                set_p(x, y, "f")
            elif x == 52:
                set_p(x, y, "F")
            elif (x + y) % 3 == 0:
                set_p(x, y, "e")
            else:
                set_p(x, y, "F")
    
    set_p(49, 22, "x")
    set_p(49, 23, "x")
    set_p(48, 23, "x")
    set_p(50, 23, "x")
    set_p(49, 36, "x")
    set_p(49, 37, "x")

    # 3. Main Stall Posts (X=11..15, 39..43; Y=26..50)
    for y in range(26, 51):
        set_p(11, y, "w")
        set_p(12, y, "W")
        set_p(13, y, "d")
        set_p(14, y, "D")
        set_p(15, y, "w")
    for y in range(26, 51):
        set_p(39, y, "w")
        set_p(40, y, "W")
        set_p(41, y, "d")
        set_p(42, y, "D")
        set_p(43, y, "w")

    # 4. Thatch / Straw Roof (Top-down dome perspective: X=6..48, Y=6..26)
    roof_rows = [
        (18, 36, 6, "h"),
        (14, 40, 7, "h"),
        (12, 42, 8, "M"),
        (10, 44, 9, "M"),
        (9, 45, 10, "m"),
        (8, 46, 11, "m"),
        (7, 47, 12, "m"),
        (6, 48, 13, "m"),
        (6, 48, 14, "R"),
        (6, 48, 15, "R"),
        (6, 48, 16, "R"),
        (7, 47, 17, "R"),
        (7, 47, 18, "r"),
        (8, 46, 19, "r"),
        (9, 45, 20, "r"),
        (10, 44, 21, "W"),
        (11, 43, 22, "w"),
        (12, 42, 23, "K"),
    ]
    for x1, x2, y, char in roof_rows:
        for x in range(x1, x2 + 1):
            if char in ["M", "h"] and (x + y * 2) % 4 == 0:
                set_p(x, y, "h")
            elif char in ["m", "R"] and (x * 3 + y) % 5 == 0:
                set_p(x, y, "M")
            elif char == "R" and (x + y) % 3 == 0:
                set_p(x, y, "r")
            else:
                set_p(x, y, char)

    for x in range(10, 45):
        set_p(x, 24, "m")
        set_p(x, 25, "R")
        set_p(x, 26, "r")
        if x % 3 == 0:
            set_p(x, 24, "h")
            set_p(x, 25, "m")

    # Vine Leaves on Top Roof (X=10..38, Y=7..18)
    vines = [
        (12, 10), (13, 10), (14, 10), (13, 9), (13, 11),
        (18, 8), (19, 8), (20, 8), (19, 7), (19, 9), (21, 9),
        (25, 9), (26, 9), (27, 9), (26, 8), (26, 10), (28, 10),
        (31, 11), (32, 11), (33, 11), (32, 10), (32, 12),
        (37, 13), (38, 13), (39, 13), (38, 12), (38, 14),
        (11, 12), (10, 13), (10, 14), (9, 15),
        (15, 12), (16, 13), (16, 14), (17, 15), (17, 16),
        (24, 11), (25, 12), (25, 13), (26, 14),
        (34, 13), (35, 14), (36, 15), (36, 16),
    ]
    for vx, vy in vines:
        set_p(vx, vy, "g")
        if (vx + vy) % 2 == 0:
            set_p(vx, vy, "G")
        set_p(vx - 1, vy, "V")
        set_p(vx, vy + 1, "v")

    # 5. Wooden Counter / Display Table (X=12..42, Y=34..48)
    fill_rect(13, 35, 41, 46, "d")
    fill_rect(13, 35, 41, 36, "D")
    fill_rect(13, 47, 41, 48, "W")
    for x in range(13, 42):
        set_p(x, 49, "w")
        set_p(x, 50, "K")

    # 6. Goods on Display (Dango Trays, Boxes)
    fill_rect(15, 38, 23, 45, "c")
    fill_rect(16, 37, 22, 38, "C")
    fill_rect(17, 40, 21, 43, "O")
    set_p(18, 41, "P")
    set_p(20, 41, "a")
    set_p(19, 42, "Y")

    fill_rect(25, 36, 40, 39, "c")
    dango_t1 = [
        (26, 37, "P"), (28, 37, "P"), (30, 37, "O"), (32, 37, "O"), (34, 37, "a"), (36, 37, "a"), (38, 37, "Y"),
        (27, 38, "P"), (29, 38, "O"), (31, 38, "O"), (33, 38, "a"), (35, 38, "Y"), (37, 38, "Y"),
    ]
    for dx, dy, col in dango_t1:
        set_p(dx, dy, col)

    fill_rect(25, 41, 40, 45, "C")
    fill_rect(25, 45, 40, 46, "c")
    dango_t2 = [
        (26, 42, "Y"), (28, 42, "Y"), (30, 42, "P"), (32, 42, "P"), (34, 42, "O"), (36, 42, "a"), (38, 42, "a"),
        (27, 43, "Y"), (29, 43, "P"), (31, 43, "P"), (33, 43, "O"), (35, 43, "a"), (37, 43, "a"),
        (26, 44, "P"), (28, 44, "O"), (30, 44, "a"), (32, 44, "Y"), (34, 44, "P"), (36, 44, "O"), (38, 44, "a"),
    ]
    for dx, dy, col in dango_t2:
        set_p(dx, dy, col)

    # Output according to PXG 1 format
    lines = []
    lines.append("PXG 1")
    lines.append("size 64 64")
    lines.append("// MSW Top-Down Stall (Dango / Rice Cake Shop)")
    for char, color in PALETTE.items():
        lines.append(f"{char} {color}")
    lines.append("grid")
    for row in grid:
        lines.append("".join(row))
        
    return "\n".join(lines)

if __name__ == "__main__":
    out_dir = "scratch/artwork_rework"
    os.makedirs(out_dir, exist_ok=True)
    pxg_content = generate_stall_pxg()
    
    pxg_path = os.path.join(out_dir, "msw_topdown_stall.pxg")
    with open(pxg_path, "w", encoding="utf-8") as f:
        f.write(pxg_content)
    print(f"Generated {pxg_path}")
