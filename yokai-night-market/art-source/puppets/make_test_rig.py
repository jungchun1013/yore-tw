# Mechanical test only: cuts the approved one-piece miko at the neck into head + body so the
# puppet code can be checked before real, separately drawn parts exist.
# usage (from yokai-night-market/): python3 -I art-source/puppets/make_test_rig.py
import json, os
import numpy as np
from PIL import Image

im = Image.open('public/art/tainan/miko.png').convert('RGBA')
a = np.array(im); al = a[:, :, 3] > 40
h, w = al.shape
widths = al.sum(axis=1)
lo, hi = int(h * 0.45), int(h * 0.72)
neck = lo + int(np.argmin(widths[lo:hi]))
out = 'public/art/puppets/test-miko'
os.makedirs(out, exist_ok=True)
head = a.copy(); head[neck + 4:, :, 3] = 0
body = a.copy(); body[:neck - 2, :, 3] = 0
Image.fromarray(head).crop((0, 0, w, neck + 4)).save(f'{out}/head.png', optimize=True)
Image.fromarray(body).crop((0, neck - 2, w, h)).save(f'{out}/body.png', optimize=True)
cx = w / 2
rig = {
    'scale': round(50 / h, 4),
    'note': 'Mechanical test only: the approved miko cut in two at the neck. Real puppets need separately drawn parts.',
    'parts': [
        {'id': 'body', 'file': 'body.png', 'pivot': [cx, h - neck + 2], 'at': [0, 0], 'z': 1},
        {'id': 'head', 'file': 'head.png', 'parent': 'body', 'pivot': [cx, neck + 1], 'at': [cx, 3], 'z': 2},
    ],
    'motions': {
        'idle': [['head', 'r', 0.06, 0.5, 0], ['body', 'y', 1.5, 1.0, 0]],
        'walk': [['head', 'r', 0.08, 1.6, 0], ['body', 'r', 0.06, 1.6, 1.57], ['body', 'y', -3, 3.2, 0]],
    },
}
json.dump(rig, open(f'{out}/rig.json', 'w'), indent=1)
print(w, h, 'neck at', neck)
