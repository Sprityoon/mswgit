import os

from PIL import Image, ImageDraw


def create_fountain_animation():
  src_path = r"c:\minho\메이플월드\scratch\artwork_rework\msw_topdown_fountain_128.png"
  src_256_path = r"c:\minho\메이플월드\scratch\artwork_rework\msw_topdown_fountain_256.png"
  out_dir = r"c:\minho\메이플월드\scratch\artwork_rework"
  os.makedirs(out_dir, exist_ok=True)

  base_128 = Image.open(src_path).convert("RGBA")
  base_256 = Image.open(src_256_path).convert("RGBA")

  frames_128 = []
  frames_256 = []

  # Water colors for animated overlay
  c_deep = (30, 120, 200, 230)
  c_mid = (65, 170, 235, 240)
  c_bright = (150, 225, 250, 255)
  c_foam = (225, 250, 255, 255)

  # Generate 4 distinct animation frames
  num_frames = 4

  for f_idx in range(num_frames):
    # Process 128x128 frame
    img_128 = base_128.copy()
    draw_128 = ImageDraw.Draw(img_128)

    # Process 256x256 frame
    img_256 = base_256.copy()
    draw_256 = ImageDraw.Draw(img_256)

    # Frame 0: Base state with slight droplet offset
    # Frame 1: Peak spout water spray + inner ripple expand
    # Frame 2: Falling water stream + outer splash rings
    # Frame 3: Receding splash + fresh spout burst

    if f_idx == 0:
      # Frame 0: Standard base flow
      # Add subtle water glistening dots
      draw_128.rectangle([60, 24, 61, 25], fill=c_foam)
      draw_128.rectangle([66, 24, 67, 25], fill=c_foam)
      draw_128.rectangle([48, 70, 52, 71], fill=c_bright)
      draw_128.rectangle([76, 70, 80, 71], fill=c_bright)

      draw_256.rectangle([120, 48, 123, 51], fill=c_foam)
      draw_256.rectangle([132, 48, 135, 51], fill=c_foam)
      draw_256.rectangle([96, 140, 104, 143], fill=c_bright)
      draw_256.rectangle([152, 140, 160, 143], fill=c_bright)

    elif f_idx == 1:
      # Frame 1: Water spout erupts slightly higher + droplet particles
      # 128 Spout Top droplets
      draw_128.rectangle([62, 20, 65, 22], fill=c_foam)
      draw_128.rectangle([58, 23, 60, 25], fill=c_bright)
      draw_128.rectangle([67, 23, 69, 25], fill=c_bright)
      # Splash droplets near pool
      draw_128.rectangle([44, 66, 46, 68], fill=c_foam)
      draw_128.rectangle([82, 66, 84, 68], fill=c_foam)
      # Ripple ring expand
      draw_128.ellipse([42, 68, 86, 84], outline=c_bright, width=1)

      # 256 Spout
      draw_256.rectangle([124, 40, 130, 45], fill=c_foam)
      draw_256.rectangle([116, 46, 120, 50], fill=c_bright)
      draw_256.rectangle([134, 46, 138, 50], fill=c_bright)
      draw_256.rectangle([88, 132, 92, 136], fill=c_foam)
      draw_256.rectangle([164, 132, 168, 136], fill=c_foam)
      draw_256.ellipse([84, 136, 172, 168], outline=c_bright, width=2)

    elif f_idx == 2:
      # Frame 2: Water stream spreads outward + mid pool ripples
      draw_128.rectangle([61, 22, 66, 25], fill=c_mid)
      draw_128.rectangle([54, 30, 57, 34], fill=c_foam)
      draw_128.rectangle([70, 30, 73, 34], fill=c_foam)
      # Large pool ripple
      draw_128.ellipse([36, 64, 92, 90], outline=c_bright, width=1)

      draw_256.rectangle([122, 44, 132, 50], fill=c_mid)
      draw_256.rectangle([108, 60, 114, 68], fill=c_foam)
      draw_256.rectangle([140, 60, 146, 68], fill=c_foam)
      draw_256.ellipse([72, 128, 184, 180], outline=c_bright, width=2)

    elif f_idx == 3:
      # Frame 3: Splash dissipates into water sparkles
      draw_128.rectangle([63, 23, 64, 26], fill=c_foam)
      draw_128.rectangle([50, 74, 55, 75], fill=c_foam)
      draw_128.rectangle([73, 74, 78, 75], fill=c_foam)
      draw_128.rectangle([61, 80, 67, 81], fill=c_bright)

      draw_256.rectangle([126, 46, 128, 52], fill=c_foam)
      draw_256.rectangle([100, 148, 110, 150], fill=c_foam)
      draw_256.rectangle([146, 148, 156, 150], fill=c_foam)
      draw_256.rectangle([122, 160, 134, 162], fill=c_bright)

    frames_128.append(img_128)
    frames_256.append(img_256)

  # Save Individual Frame PNGs
  for idx, frame in enumerate(frames_128):
    frame.save(os.path.join(out_dir, f"msw_fountain_frame_{idx}_128.png"))

  for idx, frame in enumerate(frames_256):
    frame.save(os.path.join(out_dir, f"msw_fountain_frame_{idx}_256.png"))

  # Build Horizontal Sprite Sheets
  sheet_128 = Image.new("RGBA", (128 * num_frames, 128), (0, 0, 0, 0))
  for idx, frame in enumerate(frames_128):
    sheet_128.paste(frame, (idx * 128, 0))
  sheet_128_path = os.path.join(out_dir, "msw_fountain_spritesheet_128.png")
  sheet_128.save(sheet_128_path)
  print(f"Saved {sheet_128_path}")

  sheet_256 = Image.new("RGBA", (256 * num_frames, 256), (0, 0, 0, 0))
  for idx, frame in enumerate(frames_256):
    sheet_256.paste(frame, (idx * 256, 0))
  sheet_256_path = os.path.join(out_dir, "msw_fountain_spritesheet_256.png")
  sheet_256.save(sheet_256_path)
  print(f"Saved {sheet_256_path}")

  # Build Animated GIF Previews
  gif_128_path = os.path.join(out_dir, "msw_fountain_anim_128.gif")
  frames_128[0].save(
      gif_128_path,
      save_all=True,
      append_images=frames_128[1:],
      duration=150,  # 150ms per frame
      loop=0,
      disposal=2,
  )
  print(f"Saved {gif_128_path}")

  gif_256_path = os.path.join(out_dir, "msw_fountain_anim_256.gif")
  frames_256[0].save(
      gif_256_path,
      save_all=True,
      append_images=frames_256[1:],
      duration=150,
      loop=0,
      disposal=2,
  )
  print(f"Saved {gif_256_path}")


if __name__ == "__main__":
  create_fountain_animation()
