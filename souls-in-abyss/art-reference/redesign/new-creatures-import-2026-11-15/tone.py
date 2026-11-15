"""Mechanical tone pass for the 2026-11-15 creatures: pull far-off colours toward the palette, the same shadow lift as the rest of the game, a lighter pass for the star swarm series."""
import sys, json, glob, os, colorsys
import numpy as np
from PIL import Image
D, O = sys.argv[1], sys.argv[2]
pal = json.load(open(D + '/palette.json')); hexes = sorted({h for g in pal for h in g['hex']})
def rgb2lab(a):
    a = a / 255.0; a = np.where(a > 0.04045, ((a + 0.055) / 1.055) ** 2.4, a / 12.92)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = a @ M.T / np.array([0.95047, 1, 1.08883]); f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[:, 1] - 16, 500 * (f[:, 0] - f[:, 1]), 200 * (f[:, 1] - f[:, 2])], 1)
def lab2rgb(L):
    fy = (L[:, 0] + 16) / 116; fx = fy + L[:, 1] / 500; fz = fy - L[:, 2] / 200
    f = np.stack([fx, fy, fz], 1); xyz = np.where(f ** 3 > 0.008856, f ** 3, (f - 16 / 116) / 7.787) * np.array([0.95047, 1, 1.08883])
    M = np.linalg.inv(np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]]))
    a = xyz @ M.T; a = np.where(a > 0.0031308, 1.055 * np.clip(a, 0, None) ** (1 / 2.4) - 0.055, 12.92 * a)
    return np.clip(a * 255, 0, 255)
P = rgb2lab(np.array([[int(h[i:i + 2], 16) for i in (1, 3, 5)] for h in hexes], float))
K, S_MUL, PULL_FROM, PULL = 0.14, 0.95, 14.0, 0.5
STAR = {'20-star-whale', '24-star-deer', '25-star-fox'}
EXTRA_DESAT = {'19-scales': 0.8}
def process(path, out, name=None):
    name = name or os.path.basename(path)[:-4]
    im = Image.open(path).convert('RGBA'); a = np.array(im); rgb = a[:, :, :3].reshape(-1, 3).astype(float); al = a[:, :, 3].reshape(-1)
    idx = np.where(al > 0)[0]; lab = rgb2lab(rgb[idx])
    # 1. colours far from every palette colour move halfway toward the nearest one
    d = np.sqrt(((lab[:, None, :] - P[None, :, :]) ** 2).sum(2)); j = d.argmin(1); dm = d.min(1)
    far = dm > PULL_FROM; lab[far] = lab[far] + (P[j[far]] - lab[far]) * PULL
    rgb[idx] = lab2rgb(lab)
    # 2. HLS (vectorised): shadow lift and saturation, exactly as the old creatures and heroes
    c = rgb[idx] / 255; mx = c.max(1); mn = c.min(1); l = (mx + mn) / 2; dl = mx - mn
    s = np.where(dl == 0, 0, np.where(l <= .5, dl / np.maximum(mx + mn, 1e-9), dl / np.maximum(2 - mx - mn, 1e-9)))
    r, g, b = c[:, 0], c[:, 1], c[:, 2]
    h = np.where(dl == 0, 0, np.where(mx == r, ((g - b) / np.maximum(dl, 1e-9)) % 6, np.where(mx == g, (b - r) / np.maximum(dl, 1e-9) + 2, (r - g) / np.maximum(dl, 1e-9) + 4))) / 6
    l = np.minimum(1, l + K * (1 - l) ** 2); s = np.minimum(1, s * S_MUL * EXTRA_DESAT.get(name, 1.0))
    if name in STAR: l = np.minimum(1, l + 0.22 * (1 - l)); s = s * 0.8
    def hue(p, q, t):
        t = t % 1
        return np.where(t < 1/6, p + (q - p) * 6 * t, np.where(t < .5, q, np.where(t < 2/3, p + (q - p) * (2/3 - t) * 6, p)))
    q = np.where(l < .5, l * (1 + s), l + s - l * s); pp = 2 * l - q
    out3 = np.stack([hue(pp, q, h + 1/3), hue(pp, q, h), hue(pp, q, h - 1/3)], 1)
    rgb[idx] = np.where((s == 0)[:, None], np.stack([l, l, l], 1), out3) * 255
    a[:, :, :3] = np.clip(np.round(rgb), 0, 255).astype(np.uint8).reshape(a.shape[0], a.shape[1], 3)
    Image.fromarray(a, 'RGBA').save(out)
if __name__ == '__main__':
    files = sys.argv[3:] or sorted(glob.glob(D + '/originals/*.png'))
    for f in files:
        process(f, os.path.join(O, os.path.basename(f))); print('done', os.path.basename(f))
