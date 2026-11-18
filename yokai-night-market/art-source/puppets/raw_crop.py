# Crops one object from the ink-print sheet at its original resolution, with the cream ground
# removed, plus an enlarged preview with a coordinate grid for drawing part outlines.
# usage: python3 -I raw_crop.py <ink sheet> <x0> <y0> <x1> <y1> <out png> <grid png>
import sys
from collections import deque
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src, x0, y0, x1, y1, out, grid = sys.argv[1], *map(int, sys.argv[2:6]), sys.argv[6], sys.argv[7]
im = Image.open(src).convert('RGB').crop((x0, y0, x1, y1))
a = np.array(im).astype(np.int32); h, w, _ = a.shape
bg = np.median(np.concatenate([a[:3].reshape(-1, 3), a[-3:].reshape(-1, 3), a[:, :3].reshape(-1, 3), a[:, -3:].reshape(-1, 3)]), axis=0)
dist = np.sqrt(((a - bg) ** 2).sum(axis=2)); paper = dist < 22
seen = np.zeros((h, w), bool); q = deque()
for x in range(w):
    for y in (0, h - 1):
        if paper[y, x]: seen[y, x] = True; q.append((y, x))
for y in range(h):
    for x in (0, w - 1):
        if paper[y, x] and not seen[y, x]: seen[y, x] = True; q.append((y, x))
while q:
    y, x = q.popleft()
    for yy, xx in ((y-1, x), (y+1, x), (y, x-1), (y, x+1)):
        if 0 <= yy < h and 0 <= xx < w and paper[yy, xx] and not seen[yy, xx]: seen[yy, xx] = True; q.append((yy, xx))
fg = np.array(Image.fromarray((~seen * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))) > 0
inner = np.array(Image.fromarray((fg * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5))) > 0
alpha = np.where(fg, np.where(inner, 255, np.clip((dist - 10) / 26, 0, 1) * 255), 0).astype(np.uint8)
rgba = Image.fromarray(np.dstack([a.astype(np.uint8), alpha]))
rgba = rgba.crop(rgba.getbbox()); rgba.save(out)
k = 4
g = Image.new('RGB', (rgba.width * k, rgba.height * k), (120, 104, 88))
g.paste(rgba.resize(g.size, Image.NEAREST), (0, 0), rgba.resize(g.size, Image.NEAREST))
d = ImageDraw.Draw(g)
for x in range(0, rgba.width, 10):
    d.line([(x * k, 0), (x * k, g.height)], fill=(255, 255, 255) if x % 50 == 0 else (90, 200, 255), width=1)
    if x % 50 == 0: d.text((x * k + 2, 2), str(x), fill=(255, 255, 0))
for y in range(0, rgba.height, 10):
    d.line([(0, y * k), (g.width, y * k)], fill=(255, 255, 255) if y % 50 == 0 else (90, 200, 255), width=1)
    if y % 50 == 0: d.text((2, y * k + 2), str(y), fill=(255, 255, 0))
g.save(grid, quality=82)
print(rgba.size)
