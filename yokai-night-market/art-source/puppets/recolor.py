# Recolours the miko art into a second girl: the reds of the clothes become blue-violet and the
# navy hair becomes light brown. Face, eyes and mouth are protected. Positions are given as
# fractions of the picture, so the same call works on the full-canvas puppet parts and on the
# smaller one-piece sprite.
# usage: python3 -I recolor.py <in.png> <out.png> [more pairs ...]
import sys
import numpy as np
from PIL import Image

def ellipse(h, w, cx, cy, rx, ry):
    y, x = np.mgrid[0:h, 0:w]
    return ((x - cx * w) / (rx * w)) ** 2 + ((y - cy * h) / (ry * h)) ** 2 <= 1

def recolor(path_in, path_out):
    im = Image.open(path_in).convert('RGBA')
    a = np.array(im)
    rgb = Image.fromarray(a[:, :, :3]).convert('HSV')
    hsv = np.array(rgb).astype(np.float32)
    h, w = a.shape[:2]
    H, S, V = hsv[:, :, 0] * 360 / 255, hsv[:, :, 1] / 255, hsv[:, :, 2] / 255
    # measured on the 219 x 293 source: face oval and the two eyes
    face = ellipse(h, w, 108 / 219, 133 / 293, 60 / 219, 34 / 293)
    eyes = ellipse(h, w, 69 / 219, 128 / 293, 18 / 219, 21 / 293) | ellipse(h, w, 135 / 219, 128 / 293, 18 / 219, 21 / 293)
    visible = a[:, :, 3] > 0

    red = visible & ~face & ((H < 22) | (H > 335)) & (S > 0.3) & (V > 0.3)
    hair = visible & ~eyes & (H > 190) & (H < 280) & (V < 0.85) & (S > 0.05)

    out = hsv.copy()
    # clothes: blue-violet, same shading
    out[:, :, 0] = np.where(red, 250 / 360 * 255, out[:, :, 0])
    out[:, :, 1] = np.where(red, np.clip(S * 0.5, 0, 1) * 255, out[:, :, 1])
    out[:, :, 2] = np.where(red, np.clip(V * 0.8, 0, 1) * 255, out[:, :, 2])
    # hair: light brown, keeping the fibre texture through the value channel
    vh = V[hair]
    if vh.size:
        lo, hi = np.percentile(vh, 5), np.percentile(vh, 95)
        t = np.clip((V - lo) / max(1e-3, hi - lo), 0, 1)
        out[:, :, 0] = np.where(hair, 28 / 360 * 255, out[:, :, 0])
        out[:, :, 1] = np.where(hair, (0.46 - 0.06 * t) * 255, out[:, :, 1])
        out[:, :, 2] = np.where(hair, (0.64 + 0.2 * t) * 255, out[:, :, 2])
    rgb2 = np.array(Image.fromarray(out.clip(0, 255).astype(np.uint8), 'HSV').convert('RGB'))
    a[:, :, :3] = rgb2
    Image.fromarray(a).save(path_out, optimize=True)

args = sys.argv[1:]
for i in range(0, len(args), 2):
    recolor(args[i], args[i + 1])
    print(args[i + 1])
