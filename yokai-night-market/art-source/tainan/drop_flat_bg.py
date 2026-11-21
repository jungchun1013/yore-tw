# Removes an opaque, blurred backdrop the generator painted behind an object: the backdrop has no
# fine detail, the paper object does, so everything smooth that is connected to the picture's
# border becomes transparent. usage: python3 -I drop_flat_bg.py <in.png> <out.png> [threshold=3.0]
import sys
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

src, out = sys.argv[1], sys.argv[2]
thr = float(sys.argv[3]) if len(sys.argv) > 3 else 3.0
im = Image.open(src).convert('RGB')
a = np.asarray(im).astype(np.float32)
detail = np.abs(a - np.asarray(im.filter(ImageFilter.GaussianBlur(2))).astype(np.float32)).sum(2)
detail = np.asarray(Image.fromarray(np.clip(detail * 8, 0, 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))).astype(np.float32) / 8
smooth = detail < thr
h, w = smooth.shape
bg = np.zeros((h, w), bool); q = deque()
for x in range(w):
    for y in (0, h - 1):
        if smooth[y, x] and not bg[y, x]: bg[y, x] = True; q.append((y, x))
for y in range(h):
    for x in (0, w - 1):
        if smooth[y, x] and not bg[y, x]: bg[y, x] = True; q.append((y, x))
while q:
    y, x = q.popleft()
    for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
        if 0 <= yy < h and 0 <= xx < w and smooth[yy, xx] and not bg[yy, xx]: bg[yy, xx] = True; q.append((yy, xx))
# the detail mask is dilated, so the backdrop stops a few pixels short of the object: grow it back
grown = np.asarray(Image.fromarray((bg * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))) > 0
rgba = np.dstack([np.asarray(im), np.where(grown, 0, 255).astype(np.uint8)])
Image.fromarray(rgba).save(out)
print('backdrop removed:', round(grown.mean() * 100, 1), '%')
