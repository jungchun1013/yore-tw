# Cuts Codex's six 3x2 Tainan concept sheets into single trimmed transparent sprites.
# usage: python3 -I extract.py <sheet dir> <out dir> <preview png>
import sys, json
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

SRC, OUT, PREVIEW = sys.argv[1], sys.argv[2], sys.argv[3]
SCALE = 3  # output pixels per in-game logical pixel

SETS = [
    ('buildings-flat-v2.png', [('chihkan', 150), ('shennong', 130), ('hayashi', 170), ('confucius', 120), ('machiya', 130), ('noodleStall', 84)]),
    ('people-flat-v2.png', [('vendor', 50), ('snackGirl', 50), ('yukataGirl', 50), ('postman', 50), ('fisherBoy', 50), ('musician', 50)]),
    ('deities.png', [('mazu', 62), ('tudigong', 58), ('yuelao', 58), ('huye', 46), ('qiye', 68), ('baye', 62)]),
    ('spirits.png', [('swordLionSpirit', 50), ('banyanSpirit', 56), ('turtleSpirit', 46), ('kasa', 46), ('chochin', 40), ('nekomata', 38)]),
    ('decor.png', [('swordLionWall', 54), ('lanternString', 46), ('ridge', 44), ('tileWindow', 66), ('festivalGate', 84), ('altar', 54)]),
    ('food.png', [('danzai', 24), ('milkfish', 24), ('wagui', 24), ('coffinToast', 24), ('pengbing', 24), ('dango', 24)]),
]

def components(mask):
    h, w = mask.shape
    lab = np.zeros((h, w), np.int32)
    out = []
    n = 0
    ys, xs = np.nonzero(mask)
    for y0, x0 in zip(ys, xs):
        if lab[y0, x0]:
            continue
        n += 1
        q = deque([(y0, x0)]); lab[y0, x0] = n
        area = 0; t, b, l, r = y0, y0, x0, x0
        while q:
            y, x = q.popleft(); area += 1
            if y < t: t = y
            if y > b: b = y
            if x < l: l = x
            if x > r: r = x
            for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= yy < h and 0 <= xx < w and mask[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = n; q.append((yy, xx))
        out.append((n, area, t, b, l, r))
    return lab, out

report = {}
tiles = []
for fname, items in SETS:
    sheet = Image.open(f'{SRC}/{fname}').convert('RGBA')
    W, H = sheet.size
    cw, ch = W / 3, H / 2
    for i, (key, height) in enumerate(items):
        col, row = i % 3, i // 3
        cell = sheet.crop((round(col * cw), round(row * ch), round((col + 1) * cw), round((row + 1) * ch)))
        a = np.array(cell)
        alpha = a[:, :, 3]
        # work on a half-size mask for speed
        small = Image.fromarray(alpha).resize((alpha.shape[1] // 2, alpha.shape[0] // 2), Image.BILINEAR)
        mask = np.array(small) > 40
        lab, comps = components(mask)
        comps.sort(key=lambda c: -c[1])
        main = comps[0]
        _, marea, mt, mb, ml, mr = main
        keep = [main[0]]
        mh, mw = mb - mt, mr - ml
        for (lid, area, t, b, l, r) in comps[1:]:
            # keep real detached parts (steam, tassels) near the main body; drop speckle and stray fringe
            near = l > ml - mw * 0.15 and r < mr + mw * 0.15 and t > mt - mh * 0.45 and b < mb + mh * 0.1
            # pieces touching the cell border belong to a neighbouring cell's object
            edge = t <= 2 or l <= 2 or b >= mask.shape[0] - 3 or r >= mask.shape[1] - 3
            if area >= marea * 0.012 and near and not edge:
                keep.append(lid)
        keepmask = np.isin(lab, keep)
        keepmask = np.array(Image.fromarray((keepmask * 255).astype(np.uint8)).resize((alpha.shape[1], alpha.shape[0]), Image.NEAREST)) > 0
        # grow the kept region by 2px so we do not cut real edges, then clean the coloured fringe:
        grown = np.array(Image.fromarray((keepmask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
        alpha2 = np.where(grown, alpha, 0).astype(np.uint8)
        # erode the alpha by 1px and drop faint pixels: removes the halo the generator leaves around shapes
        eroded = np.array(Image.fromarray(alpha2).filter(ImageFilter.MinFilter(3)))
        eroded[eroded < 60] = 0
        a[:, :, 3] = eroded
        img = Image.fromarray(a)
        bbox = img.getbbox()
        img = img.crop(bbox)
        th = height * SCALE
        tw = max(1, round(img.width * th / img.height))
        img = img.resize((tw, th), Image.LANCZOS)
        img.save(f'{OUT}/{key}.png', optimize=True)
        report[key] = {'sheet': fname, 'height': height, 'px': [tw, th], 'parts': len(keep), 'dropped': len(comps) - len(keep)}
        tiles.append((key, img))

# preview: every sprite on a mid-tone paper background, to spot halos and missing pieces
cols = 8
cellw, cellh = 260, 300
rows = (len(tiles) + cols - 1) // cols
prev = Image.new('RGBA', (cols * cellw, rows * cellh), (226, 214, 190, 255))
for i, (key, img) in enumerate(tiles):
    s = min((cellw - 20) / img.width, (cellh - 40) / img.height, 1.0)
    im = img.resize((max(1, int(img.width * s)), max(1, int(img.height * s))), Image.LANCZOS)
    x = (i % cols) * cellw + (cellw - im.width) // 2
    y = (i // cols) * cellh + (cellh - 30 - im.height)
    prev.alpha_composite(im, (x, y))
prev.save(PREVIEW)
json.dump(report, open(f'{OUT}/sprites.json', 'w'), ensure_ascii=False, indent=1)
print(json.dumps(report, ensure_ascii=False)[:3000])
