import math
import os
import numpy as np
from PIL import Image


def create_natural_water_flow():
  src_128_path = (
      r"c:\minho\메이플월드\scratch\artwork_rework\msw_topdown_fountain_128.png"
  )
  src_256_path = (
      r"c:\minho\메이플월드\scratch\artwork_rework\msw_topdown_fountain_256.png"
  )
  out_dir = r"c:\minho\메이플월드\scratch\artwork_rework"
  os.makedirs(out_dir, exist_ok=True)

  def build_flow_frames(src_path, size_name, num_frames=6):
    img = Image.open(src_path).convert("RGBA")
    arr = np.array(img, dtype=np.float32)
    h, w, c = arr.shape

    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]

    # Water Mask
    is_water = (
        (a > 100) & (b > r + 35) & (b > 110) & (r < 170) & (g.astype(int) > 100)
    )

    frames = []

    for f in range(num_frames):
      phase = (2.0 * math.pi * f) / num_frames
      frame_arr = arr.copy()

      for y in range(h):
        for x in range(w):
          if not is_water[y, x]:
            continue

          # Vertical Spout / Falling Water Stream (Top 60% of fountain)
          if y < int(h * 0.60):
            # Downward fluid panning: pixel offset moves down smoothly
            shift_y = int(f * 2.5) % 10
            sample_y = max(0, min(h - 1, y - shift_y))

            if is_water[sample_y, x]:
              pixel = arr[sample_y, x].copy()
            else:
              pixel = arr[y, x].copy()

            # Subtle water glisten
            shine = 1.0 + 0.08 * math.sin(phase * 2.0 + y * 0.3)
            pixel[:3] = np.clip(pixel[:3] * shine, 0, 255)
            frame_arr[y, x] = pixel

          else:
            # Pool Surface Water: Concentric gentle radial ripples
            center_x, center_y = w / 2.0, h * 0.65
            dist = math.sqrt((x - center_x) ** 2 + ((y - center_y) * 2.2) ** 2)

            # Expanding subtle ripple wave
            wave = math.sin(dist * 0.18 - phase * 2.0)
            bright = 1.0 + 0.04 * wave

            pixel = arr[y, x].copy()
            pixel[:3] = np.clip(pixel[:3] * bright, 0, 255)
            frame_arr[y, x] = pixel

      frames.append(Image.fromarray(frame_arr.astype(np.uint8), "RGBA"))

    # Save individual frame PNGs
    for idx, frame in enumerate(frames):
      frame.save(
          os.path.join(out_dir, f"msw_fountain_flow_frame_{idx}_{size_name}.png")
      )

    # Save Sprite Sheet
    sheet = Image.new(
        "RGBA", (w * num_frames, h), (0, 0, 0, 0)
    )
    for idx, frame in enumerate(frames):
      sheet.paste(frame, (idx * w, 0))

    sheet_path = os.path.join(
        out_dir, f"msw_fountain_flow_spritesheet_{size_name}.png"
    )
    sheet.save(sheet_path)
    print(f"Saved {sheet_path}")

    # Save GIF Animation
    gif_path = os.path.join(out_dir, f"msw_fountain_flow_anim_{size_name}.gif")
    frames[0].save(
        gif_path,
        save_all=True,
        append_images=frames[1:],
        duration=100,  # 100ms per frame
        loop=0,
        disposal=2,
    )
    print(f"Saved {gif_path}")

  build_flow_frames(src_128_path, "128", num_frames=6)
  build_flow_frames(src_256_path, "256", num_frames=6)


if __name__ == "__main__":
  create_natural_water_flow()
