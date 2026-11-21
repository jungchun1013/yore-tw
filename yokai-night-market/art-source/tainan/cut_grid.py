# Cuts a transparent grid sheet from art-inbox into single sprites: one object per cell, read
# left to right, top to bottom. Drops the faint coloured fringe the generator leaves (low
# alpha), trims each object, scales to 3x the in-game height.
# usage (from yokai-night-market/):
#   python3 -I art-source/tainan/cut_grid.py <sheet.png> <cols> <rows> <alpha cutoff> <key>:<height> ...
import sys
import numpy as np
from PIL import Image, ImageFilter

src, cols, rows, cut = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
items = [a.split(':') for a in sys.argv[5:]]
assert len(items) == cols * rows, 'one key:height per cell'
a = np.array(Image.open(src).convert('RGBA'))
H, W = a.shape[:2]
for i, (key, height) in enumerate(items):
    r, c = divmod(i, cols)
    cell = a[r * H // rows:(r + 1) * H // rows, c * W // cols:(c + 1) * W // cols].copy()
    alpha = cell[:, :, 3]
    solid = alpha >= cut
    # keep only what belongs to the object: rows and columns with a real amount of solid pixels
    ys = np.nonzero(solid.sum(1) > 6)[0]; xs = np.nonzero(solid.sum(0) > 6)[0]
    edge = np.array(Image.fromarray((solid * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8)))
    cell[:, :, 3] = np.where(solid, np.minimum(alpha, edge.clip(120, 255)), 0)
    img = Image.fromarray(cell).crop((xs[0], ys[0], xs[-1] + 1, ys[-1] + 1))
    th = int(height) * 3
    img = img.resize((max(1, round(img.width * th / img.height)), th), Image.LANCZOS)
    img.save(f'public/art/tainan/{key}.png', optimize=True)
    print(key, img.size)
