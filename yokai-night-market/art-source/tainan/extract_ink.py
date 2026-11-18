# Cuts the approved sheets into single transparent sprites.
#   buildings-redraw-v3.png  : transparent 3x2 sheet (Codex, redraw v3)
#   tainan-ink-print-assets.png : cream-paper sheet in loose rows (Codex, ink print)
# usage: python3 -I extract_ink.py <v3 sheet> <ink sheet> <out dir> <preview png>
import sys
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

V3, INK, OUT, PREVIEW = sys.argv[1:5]
SCALE = 3

def label(mask):
    h, w = mask.shape
    lab = np.zeros((h, w), np.int32); comps = []; n = 0
    for y0, x0 in zip(*np.nonzero(mask)):
        if lab[y0, x0]: continue
        n += 1; q = deque([(y0, x0)]); lab[y0, x0] = n
        area = 0; t = b = y0; l = r = x0
        while q:
            y, x = q.popleft(); area += 1
            t, b, l, r = min(t, y), max(b, y), min(l, x), max(r, x)
            for yy, xx in ((y-1, x), (y+1, x), (y, x-1), (y, x+1)):
                if 0 <= yy < h and 0 <= xx < w and mask[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = n; q.append((yy, xx))
        comps.append((n, area, t, b, l, r))
    return lab, comps

def finish(img, height, key, tiles):
    img = img.crop(img.getbbox())
    th = height * SCALE; tw = max(1, round(img.width * th / img.height))
    img = img.resize((tw, th), Image.LANCZOS)
    img.save(f'{OUT}/{key}.png', optimize=True)
    tiles.append((key, img))

tiles = []

# ---- v3 buildings: same method as extract.py ----
V3_ITEMS = [('chihkan', 150), ('shennong', 130), ('hayashi', 170), ('confucius', 120), ('machiya', 130), ('noodleStall', 84)]
sheet = Image.open(V3).convert('RGBA'); W, H = sheet.size
for i, (key, height) in enumerate(V3_ITEMS):
    cell = sheet.crop((round(i % 3 * W / 3), round(i // 3 * H / 2), round((i % 3 + 1) * W / 3), round((i // 3 + 1) * H / 2)))
    a = np.array(cell); alpha = a[:, :, 3]
    lab, comps = label(alpha > 40)
    comps.sort(key=lambda c: -c[1]); main = comps[0]
    _, ma, mt, mb, ml, mr = main; keep = [main[0]]
    for (lid, area, t, b, l, r) in comps[1:]:
        edge = t <= 2 or l <= 2 or b >= alpha.shape[0] - 3 or r >= alpha.shape[1] - 3
        near = l > ml - (mr - ml) * 0.15 and r < mr + (mr - ml) * 0.15 and t > mt - (mb - mt) * 0.45 and b < mb + (mb - mt) * 0.1
        if area >= ma * 0.012 and near and not edge: keep.append(lid)
    m = np.array(Image.fromarray((np.isin(lab, keep) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
    al = np.array(Image.fromarray(np.where(m, alpha, 0).astype(np.uint8)).filter(ImageFilter.MinFilter(3)))
    al[al < 60] = 0; a[:, :, 3] = al
    finish(Image.fromarray(a), height, key, tiles)

# ---- ink sheet: remove the cream paper connected to the border, then split into objects ----
ink = Image.open(INK).convert('RGB'); a = np.array(ink).astype(np.int32)
h, w, _ = a.shape
bg = np.median(np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3), a[:, :6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)]), axis=0)
dist = np.sqrt(((a - bg) ** 2).sum(axis=2))
paperlike = dist < 22                     # the sheet colour, its fibres and the faintest shadows
# background = paper-like pixels reachable from the border
seen = np.zeros((h, w), bool); q = deque()
for x in range(w):
    for y in (0, h - 1):
        if paperlike[y, x] and not seen[y, x]: seen[y, x] = True; q.append((y, x))
for y in range(h):
    for x in (0, w - 1):
        if paperlike[y, x] and not seen[y, x]: seen[y, x] = True; q.append((y, x))
while q:
    y, x = q.popleft()
    for yy, xx in ((y-1, x), (y+1, x), (y, x-1), (y, x+1)):
        if 0 <= yy < h and 0 <= xx < w and paperlike[yy, xx] and not seen[yy, xx]:
            seen[yy, xx] = True; q.append((yy, xx))
fg = ~seen
fg = np.array(Image.fromarray((fg * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))) > 0
# soft alpha at the rim: fade pixels whose colour is close to the paper
alpha = np.clip((dist - 10) / 26, 0, 1) * 255
alpha = np.where(fg, np.maximum(alpha, np.where(np.array(Image.fromarray((fg * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5))) > 0, 255, 0)), 0)
rgba = np.dstack([a.astype(np.uint8), alpha.astype(np.uint8)])

lab, comps = label(fg)
big = [c for c in comps if c[1] > 1500]
# objects in reading order: rows by centre y, then x
big.sort(key=lambda c: (c[2] + c[3]) / 2)
big = [c for k in range(0, len(big), 6) for c in sorted(big[k:k + 6], key=lambda c: (c[4] + c[5]) / 2)]  # three rows of six
INK_ITEMS = [('brickHouse', 120), ('woodHouse', 100), ('swordLionWall', 46), ('lantern', 40), ('tileFlower', 22), ('censer', 30),
             ('miko', 50), ('fox', 52), ('mazu', 60), ('tudigong', 56), ('yuelao', 58), ('huye', 42),
             ('danzai', 24), ('milkfish', 24), ('wagui', 24), ('coffinToast', 24), ('pengbing', 24), ('dango', 24)]
if len(big) != len(INK_ITEMS):
    print('found', len(big), 'objects:', [(c[1], c[2], c[4]) for c in big])
    raise SystemExit('object count mismatch')
# keep small detached bits (incense sticks, lantern tassel) with the object whose box contains them
small = [c for c in comps if 30 < c[1] <= 1500]
for (key, height), (lid, area, t, b, l, r) in zip(INK_ITEMS, big):
    ids = [lid] + [s[0] for s in small if s[2] >= t - 40 and s[3] <= b + 10 and s[4] >= l - 10 and s[5] <= r + 10]
    m = np.isin(lab, ids)
    m = np.array(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
    piece = rgba.copy(); piece[:, :, 3] = np.where(m, piece[:, :, 3], 0)
    finish(Image.fromarray(piece).crop((max(0, l - 4), max(0, t - 44), min(w, r + 5), min(h, b + 5))), height, key, tiles)

cols, cw, ch = 8, 240, 270
rows = (len(tiles) + cols - 1) // cols
prev = Image.new('RGBA', (cols * cw, rows * ch), (150, 128, 104, 255))
for i, (key, img) in enumerate(tiles):
    s = min((cw - 16) / img.width, (ch - 16) / img.height, 1.0)
    im = img.resize((max(1, int(img.width * s)), max(1, int(img.height * s))), Image.LANCZOS)
    prev.alpha_composite(im, ((i % cols) * cw + (cw - im.width) // 2, (i // cols) * ch + ch - 8 - im.height))
prev.convert('RGB').save(PREVIEW, quality=85)
print('ok', len(tiles))
