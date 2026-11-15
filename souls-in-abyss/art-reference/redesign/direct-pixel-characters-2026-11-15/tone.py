"""Colour-only tone step for the cut hero sprites: lightness x1.06, saturation x0.94 (HSL, relative).
    python3 -I tone.py <in dir> <out dir>   (user request 2026-11-15: 「把人物提升 6% 明度 降低 6%飽和度」)"""
import sys, os, colorsys
import numpy as np
from PIL import Image
L_MUL, S_MUL = 1.0812, 0.893  # user steps 2026-11-15: L +6% then +2%, S -6% then -5%
def tone(im):
    a = np.asarray(im.convert('RGBA')).astype(float) / 255
    out = a.copy()
    h, w, _ = a.shape
    for y in range(h):
        for x in range(w):
            r, g, b, al = a[y, x]
            if al == 0: continue
            hh, ll, ss = colorsys.rgb_to_hls(r, g, b)
            ll = min(1, ll * L_MUL); ss = min(1, ss * S_MUL)
            out[y, x, :3] = colorsys.hls_to_rgb(hh, ll, ss)
    return Image.fromarray((out * 255).round().astype('uint8'), 'RGBA')
if __name__ == '__main__':
    src, dst = sys.argv[1:]
    os.makedirs(dst, exist_ok=True)
    for f in sorted(os.listdir(src)):
        if f.endswith('.png'): tone(Image.open(f'{src}/{f}')).save(f'{dst}/{f}', optimize=True); print(f)
