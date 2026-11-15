"""Tone pass + resize of the 2026-11-15 creatures into the game's sprite folders (height = units x 2, alpha halo removed)."""
import sys, json, os
from PIL import Image
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tone
D, OUT = sys.argv[1], sys.argv[2]
DYE = {1: 'sage', 2: 'blue', 3: 'lavender', 4: 'terracotta', 5: 'earth', 6: 'gold', 7: 'cream', 8: 'rose', 9: 'silver', 10: 'midnight'}
SLUG = {'beetle': 'ember-beetle'}
UNITS = {'wisp': 29, 'thunder-wolf': 45, 'faceless': 51, 'star-fallen': 32, 'jelly': 32, 'bear': 48, 'book': 34, 'shell-dweller': 42,
         'shadow-wolf': 45, 'beetle': 32, 'slag-snail': 32, 'moon-cat': 32, 'bell': 64, 'hand': 66, 'seat': 60, 'scales': 72,
         'star-whale': 44, 'gap': 64, 'bat': 38, 'pot-hermit': 36, 'star-deer': 60, 'star-fox': 40, 'fire-fox': 36}
def finish(src, dst, units):
    im = Image.open(src).convert('RGBA'); a = np.array(im); a[:, :, 3] = np.where(a[:, :, 3] < 24, 0, a[:, :, 3])
    im = Image.fromarray(a, 'RGBA'); im = im.crop(im.getbbox())
    h = units * 2; w = max(1, round(im.width / im.height * h))
    im.resize((w, h), Image.LANCZOS).save(dst)
    return w, h
man = json.load(open(D + '/manifest.json')); dyes = {}
tmp = os.path.join(OUT, '_tone'); os.makedirs(tmp, exist_ok=True)
for c in man['creatures']:
    slug = SLUG.get(c['slug'], c['slug']); folder = os.path.join(OUT, slug); os.makedirs(folder, exist_ok=True)
    files = [(DYE[v['color']], os.path.join(D, v['file'])) for v in c['variants']] or [('blue', os.path.join(D, c['original']))]
    dyes[slug] = []
    for dye, f in files:
        t = os.path.join(tmp, f'{slug}-{dye}.png'); tone.process(f, t, name=c['slug'])
        w, h = finish(t, os.path.join(folder, dye + '.png'), UNITS[c['slug']]); dyes[slug].append(dye)
    print(slug, len(dyes[slug]), 'dyes', f'{w}x{h}')
json.dump(dyes, open(os.path.join(OUT, 'dyes.json'), 'w'), indent=1)
