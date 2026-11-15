"""Shadow lift for the cut hero sprites (user 2026-11-15: contrast is the problem, lift only the darks).
HSL: saturation x S_MUL everywhere; lightness L' = L + K * (1 - L)^2, so black rises by K, mid grey by K/4, white not at all.
    python3 -I shadowlift.py <in dir> <out dir> [K]"""
import sys, os, colorsys
import numpy as np
from PIL import Image
S_MUL = 0.95  # final (user 2026-11-15), with K = 0.14
def lift(im, K):
    a = np.asarray(im.convert('RGBA')).astype(float) / 255; out = a.copy()
    h, w, _ = a.shape
    for y in range(h):
        for x in range(w):
            r, g, b, al = a[y, x]
            if al == 0: continue
            hh, ll, ss = colorsys.rgb_to_hls(r, g, b)
            ll = min(1, ll + K * (1 - ll) ** 2); ss = min(1, ss * S_MUL)
            out[y, x, :3] = colorsys.hls_to_rgb(hh, ll, ss)
    return Image.fromarray((out * 255).round().astype('uint8'), 'RGBA')
if __name__ == '__main__':
    src, dst = sys.argv[1:3]; K = float(sys.argv[3]) if len(sys.argv) > 3 else 0.10
    os.makedirs(dst, exist_ok=True)
    for f in sorted(os.listdir(src)):
        if f.endswith('.png'): lift(Image.open(f'{src}/{f}'), K).save(f'{dst}/{f}', optimize=True)
