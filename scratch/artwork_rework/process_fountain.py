import os
from PIL import Image

def process_image():
    src_path = r"C:\Users\윤민호\.gemini\antigravity-ide\brain\b9d055b5-25c8-4d77-9c02-ef350c679cf6\msw_topdown_town_fountain_1784708138752.png"
    out_dir = r"c:\minho\메이플월드\scratch\artwork_rework"
    os.makedirs(out_dir, exist_ok=True)
    
    img = Image.open(src_path).convert("RGBA")
    
    # Convert white background to transparent
    datas = img.getdata()
    new_data = []
    for item in datas:
        r, g, b, a = item
        # White background filter
        if r > 240 and g > 240 and b > 240:
            new_data.append((255, 255, 255, 0))
        elif r > 225 and g > 225 and b > 225 and abs(r-g)<15 and abs(g-b)<15:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    
    # Crop bounding box of content
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    # Create 128x128 canvas
    target_128 = 128
    w, h = img.size
    max_dim = max(w, h)
    scale_128 = (target_128 - 12) / float(max_dim)
    w_128 = int(w * scale_128)
    h_128 = int(h * scale_128)
    
    img_128_scaled = img.resize((w_128, h_128), Image.Resampling.NEAREST)
    final_128 = Image.new("RGBA", (target_128, target_128), (0, 0, 0, 0))
    paste_x128 = (target_128 - w_128) // 2
    paste_y128 = target_128 - h_128 - 6
    final_128.paste(img_128_scaled, (paste_x128, paste_y128), img_128_scaled)
    
    out_128 = os.path.join(out_dir, "msw_topdown_fountain_128.png")
    final_128.save(out_128)
    print(f"Saved {out_128}")
    
    # Create 256x256 canvas
    target_256 = 256
    scale_256 = (target_256 - 24) / float(max_dim)
    w_256 = int(w * scale_256)
    h_256 = int(h * scale_256)
    
    img_256_scaled = img.resize((w_256, h_256), Image.Resampling.NEAREST)
    final_256 = Image.new("RGBA", (target_256, target_256), (0, 0, 0, 0))
    paste_x256 = (target_256 - w_256) // 2
    paste_y256 = target_256 - h_256 - 12
    final_256.paste(img_256_scaled, (paste_x256, paste_y256), img_256_scaled)
    
    out_256 = os.path.join(out_dir, "msw_topdown_fountain_256.png")
    final_256.save(out_256)
    print(f"Saved {out_256}")

if __name__ == "__main__":
    process_image()
