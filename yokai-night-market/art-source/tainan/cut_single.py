# Cuts one object out of a transparent picture from art-inbox: drops the faint halo the
# generator leaves (low alpha), keeps the main body and near parts, trims, scales to 3x the
# in-game height.
# usage (from yokai-night-market/): python3 -I art-source/tainan/cut_single.py <in.png> <key> <in-game height> [alpha cutoff=150]
import sys
import numpy as np
from PIL import Image, ImageFilter

src, key, height = sys.argv[1], sys.argv[2], int(sys.argv[3])
cut = int(sys.argv[4]) if len(sys.argv) > 4 else 150
a = np.array(Image.open(src).convert('RGBA'))
alpha = a[:, :, 3]
solid = alpha >= cut
# soften the new edge by one pixel instead of leaving the glow
edge = np.array(Image.fromarray((solid * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8)))
a[:, :, 3] = np.where(solid, np.minimum(alpha, edge.clip(120, 255)), 0)
img = Image.fromarray(a)
img = img.crop(img.getbbox())
th = height * 3
img = img.resize((max(1, round(img.width * th / img.height)), th), Image.LANCZOS)
img.save(f'public/art/tainan/{key}.png', optimize=True)
print(key, img.size)
