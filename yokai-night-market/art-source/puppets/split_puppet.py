# Splits a one-piece character picture (already cut out, transparent) into puppet parts.
#
# Each pixel goes to the first part, in list order, whose outline contains it and whose colour
# rule (if any) accepts it; the last part takes whatever is left. Then every part is extended,
# using its own edge colours, into the area covered by the parts stacked above it (never past
# the character's outline), so a part that turns never opens a hole. All parts keep the full
# canvas size, so a joint is the same (x, y) in every file.
#
# usage (from yokai-night-market/): python3 -I art-source/puppets/split_puppet.py <miko|fox> <raw png>
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw

name, raw = sys.argv[1], sys.argv[2]
im = Image.open(raw).convert('RGBA'); A = np.array(im).astype(np.float32)
H, W = A.shape[:2]

def poly(points):
    m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).polygon([tuple(p) for p in points], fill=255)
    return np.array(m) > 0

r, g, b = A[:, :, 0], A[:, :, 1], A[:, :, 2]
RED = (r > 150) & (g < 130) & (r - b > 60)
NAVY = (b > r + 10) & (r < 140)
NOT_NAVY = ~NAVY

# part: id, outline (None = everything left), colour rule or None, z, parent, joint (pivot in this image), motions
if name == 'miko':
    PARTS = [
        ('legL', [(64, 274), (100, 274), (100, 293), (64, 293)], None, 1, 'body', (84, 278)),
        ('legR', [(104, 274), (140, 274), (140, 293), (104, 293)], None, 1.2, 'body', (121, 278)),
        ('flower', [(140, 52), (200, 50), (219, 80), (212, 142), (168, 142), (150, 112), (140, 80)], NOT_NAVY, 6, 'head', (168, 70)),
        ('bow', [(55, 0), (200, 0), (200, 50), (150, 47), (120, 40), (90, 42), (55, 52)], RED, 4, 'head', (120, 28)),
        ('bowL', [(10, 50), (62, 44), (70, 70), (62, 92), (12, 86)], RED, 4.1, 'head', (62, 60)),
        ('sleeveL', [(0, 186), (60, 172), (80, 180), (78, 200), (62, 214), (60, 272), (0, 272)], None, 3, 'body', (72, 182)),
        ('sleeveR', [(146, 178), (166, 174), (219, 186), (219, 272), (160, 272), (158, 214), (144, 200)], None, 3.1, 'body', (150, 182)),
        ('head', [(0, 0), (219, 0), (219, 186), (166, 182), (140, 168), (80, 168), (56, 182), (0, 184)], None, 5, 'body', (108, 168)),
        ('body', None, None, 2, None, (108, 293)),
    ]
    MOTIONS = {
        'idle': [['body', 'y', 3, 0.5, 0], ['head', 'r', 0.05, 0.5, 0.5], ['bow', 'r', 0.06, 0.5, 1.1], ['bowL', 'r', 0.08, 0.5, 1.3],
                 ['flower', 'r', 0.12, 0.5, 1.5], ['sleeveL', 'r', 0.05, 0.5, 0], ['sleeveR', 'r', -0.05, 0.5, 0]],
        'walk': [['body', 'y', -7, 3.2, 0], ['body', 'r', 0.04, 1.6, 1.57], ['head', 'r', 0.06, 1.6, 3.14],
                 ['sleeveL', 'r', 0.16, 1.6, 0], ['sleeveR', 'r', 0.16, 1.6, 0], ['legL', 'y', -9, 1.6, 0], ['legR', 'y', -9, 1.6, 3.14],
                 ['bow', 'r', 0.1, 1.6, 1.0], ['bowL', 'r', 0.14, 1.6, 1.2], ['flower', 'r', 0.22, 1.6, 1.6]],
    }
else:
    PARTS = [
        ('legL', [(58, 286), (96, 286), (96, 307), (58, 307)], None, 1, 'body', (80, 290)),
        ('legR', [(104, 286), (145, 286), (145, 307), (104, 307)], None, 1.2, 'body', (124, 290)),
        ('flower', [(140, 58), (192, 58), (194, 92), (190, 152), (162, 152), (152, 110), (140, 92)], None, 6, 'head', (168, 80)),
        ('earL', [(28, 0), (75, 0), (84, 30), (78, 58), (40, 72), (30, 40)], None, 2, 'head', (62, 62)),
        ('earR', [(140, 0), (190, 0), (192, 40), (180, 52), (148, 52), (140, 40)], None, 2.1, 'head', (162, 50)),
        ('tail', [(140, 168), (176, 152), (245, 186), (245, 307), (150, 300), (160, 272), (180, 228), (150, 192)], None, 0, 'body', (156, 250)),
        ('sleeveL', [(10, 222), (62, 190), (80, 200), (82, 278), (10, 278)], None, 4, 'body', (70, 196)),
        ('sleeveR', [(134, 192), (150, 186), (182, 224), (178, 272), (140, 276), (136, 214)], None, 4.1, 'body', (140, 194)),
        ('head', [(0, 0), (245, 0), (245, 150), (190, 172), (138, 178), (100, 172), (60, 178), (0, 170)], None, 5, 'body', (100, 176)),
        ('body', None, None, 3, None, (100, 307)),
    ]
    MOTIONS = {
        'idle': [['body', 'y', 3, 0.5, 0], ['head', 'r', 0.05, 0.5, 0.5], ['earL', 'r', -0.08, 0.7, 0], ['earR', 'r', 0.08, 0.7, 0.8],
                 ['tail', 'r', 0.14, 0.6, 0], ['flower', 'r', 0.1, 0.5, 1.4], ['sleeveL', 'r', 0.05, 0.5, 0], ['sleeveR', 'r', -0.05, 0.5, 0]],
        'walk': [['body', 'y', -7, 3.2, 0], ['body', 'r', 0.04, 1.6, 1.57], ['head', 'r', 0.06, 1.6, 3.14],
                 ['sleeveL', 'r', 0.15, 1.6, 0], ['sleeveR', 'r', 0.15, 1.6, 0], ['legL', 'y', -9, 1.6, 0], ['legR', 'y', -9, 1.6, 3.14],
                 ['tail', 'r', 0.22, 1.6, 1.0], ['earL', 'r', -0.1, 1.6, 1.2], ['earR', 'r', 0.1, 1.6, 1.4], ['flower', 'r', 0.18, 1.6, 1.6]],
    }

# drop stray specks left by the background removal (anything not connected to the main body)
alpha = A[:, :, 3] > 40
from collections import deque
lab = np.zeros((H, W), np.int32); best, bestn = 0, 0; nid = 0
for y0, x0 in zip(*np.nonzero(alpha)):
    if lab[y0, x0]: continue
    nid += 1; q = deque([(y0, x0)]); lab[y0, x0] = nid; n = 0
    while q:
        y, x = q.popleft(); n += 1
        for yy, xx in ((y-1, x), (y+1, x), (y, x-1), (y, x+1)):
            if 0 <= yy < H and 0 <= xx < W and alpha[yy, xx] and not lab[yy, xx]: lab[yy, xx] = nid; q.append((yy, xx))
    if n > bestn: best, bestn = nid, n
keep = lab == best
A[:, :, 3] = np.where(keep | ((A[:, :, 3] <= 40) & np.roll(keep, 1, 0)), A[:, :, 3], 0)
sil = A[:, :, 3] > 8

owner = np.full((H, W), -1, np.int32)
for i, (pid, pts, rule, z, parent, joint) in enumerate(PARTS):
    m = sil & (owner < 0)
    if pts is not None: m &= poly(pts)
    if rule is not None: m &= rule
    owner[m] = i

def extend(rgba, region, target, steps=6):
    # grow `region` into `target` one pixel ring at a time, copying the mean colour of filled neighbours
    out = rgba.copy(); filled = region.copy()
    for _ in range(steps):
        acc = np.zeros((H, W, 4), np.float32); cnt = np.zeros((H, W), np.float32)
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, 1), (-1, 1), (1, -1)):
            f = np.roll(np.roll(filled, dy, 0), dx, 1); c = np.roll(np.roll(out, dy, 0), dx, 1)
            acc += c * f[:, :, None]; cnt += f
        grow = target & ~filled & (cnt > 0)
        if not grow.any(): break
        out[grow] = acc[grow] / cnt[grow][:, None]
        out[grow, 3] = 255
        filled |= grow
    return out, filled

outdir = f'public/art/puppets/{name}'
os.makedirs(outdir, exist_ok=True)
for f in os.listdir(outdir): os.remove(os.path.join(outdir, f))
# clips live in the shared skeleton (public/art/puppets/_skeletons/chibi.json); MOTIONS above is kept only as a record
ROLE = {'bow': 'acc1', 'bowL': 'acc2', 'flower': 'acc3'}
rig = {'version': 2, 'skeleton': 'chibi', 'scale': round(50 / H, 4), 'source': 'cut from the approved ink-print sheet by art-source/puppets/split_puppet.py', 'parts': []}
for i, (pid, pts, rule, z, parent, joint) in enumerate(PARTS):
    region = owner == i
    above = np.zeros((H, W), bool)
    for j, other in enumerate(PARTS):
        if other[3] > z: above |= owner == j
    rgba = np.where(region[:, :, None], A, 0).astype(np.float32)
    rgba, filled = extend(rgba, region, above & sil)
    rgba[~filled] = 0
    Image.fromarray(rgba.clip(0, 255).astype(np.uint8)).save(f'{outdir}/{pid}.png', optimize=True)
    entry = {'id': pid, 'role': ROLE.get(pid, pid), 'file': f'{pid}.png', 'pivot': list(joint), 'z': z}
    if parent: entry['parent'] = parent; entry['at'] = list(joint)
    else: entry['at'] = [0, 0]; entry['pivot'] = [W / 2, H]
    rig['parts'].append(entry)
    print(pid, int(region.sum()), 'px')
json.dump(rig, open(f'{outdir}/rig.json', 'w'), indent=1)
