import os
from PIL import Image

def process_image():
    src_path = r"C:\Users\윤민호\.gemini\antigravity-ide\brain\b9d055b5-25c8-4d77-9c02-ef350c679cf6\msw_topdown_stall_c_straight2_1784702901206.png"
    out_dir = r"c:\minho\메이플월드\scratch\artwork_rework"
    os.makedirs(out_dir, exist_ok=True)
    
    img = Image.open(src_path).convert("RGBA")
    
    # Convert white / near-white background to transparent
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
        
    # Resize / pad to 256x256 square canvas
    w, h = img.size
    max_dim = max(w, h)
    
    square_size = 256
    scale = (square_size - 24) / float(max_dim)
    new_w = int(w * scale)
    new_h = int(h * scale)
    
    img_resized = img.resize((new_w, new_h), Image.Resampling.NEAREST)
    
    final_img = Image.new("RGBA", (square_size, square_size), (0, 0, 0, 0))
    paste_x = (square_size - new_w) // 2
    paste_y = square_size - new_h - 12 # Keep baseline gap ~12px
    
    final_img.paste(img_resized, (paste_x, paste_y), img_resized)
    
    out_path_256 = os.path.join(out_dir, "msw_topdown_stall_c_256.png")
    final_img.save(out_path_256)
    print(f"Saved {out_path_256}")
    
    # Save 128x128 version
    final_128 = final_img.resize((128, 128), Image.Resampling.NEAREST)
    out_path_128 = os.path.join(out_dir, "msw_topdown_stall_c_128.png")
    final_128.save(out_path_128)
    print(f"Saved {out_path_128}")

if __name__ == "__main__":
    process_image()
