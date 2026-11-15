"""Cut a generated five-race sheet into game sprites.

    python3 -I prepare.py <sheet.png> <out dir>

Mechanical only: removes the flat ivory background, splits the five columns, scales every race so the
human is 58 game units tall at the strip's 2x density (the owl is 32), keeps the other races' relative
heights from the sheet, and writes <out>/<race>.png with the feet on the bottom row. Same background
removal as the creature cut (2026-11-13). Nothing is redrawn.
"""
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

RACES = ['human', 'elf', 'dwarf', 'giant', 'undead']
HUMAN_UNITS, SCALE = 58, 2


def cut(im):
    a = np.asarray(im.convert('RGB')).astype(int)
    bg = np.median(np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]]), axis=0)
    d = np.abs(a - bg).sum(2)
    lab, _ = ndimage.label(d <= 36)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    clear = np.isin(lab, list(border))
    lab2, n2 = ndimage.label((d <= 20) | (a.min(2) >= 246))  # enclosed gaps: between legs, under arms
    for i, s in enumerate(ndimage.sum(np.ones_like(d), lab2, range(1, n2 + 1)), 1):
        if s >= 60: clear |= lab2 == i
    solid = ~clear
    lab3, n3 = ndimage.label(solid)  # stray specks
    for i, s in enumerate(ndimage.sum(np.ones_like(d), lab3, range(1, n3 + 1)), 1):
        if s < 80: solid[lab3 == i] = False
    out = Image.fromarray(np.dstack([a, np.where(solid, 255, 0)]).astype('uint8'), 'RGBA')
    return out.crop(out.getbbox())


def main(sheet_path, out):
    src = Image.open(sheet_path)
    if src.mode == 'RGBA' and (np.asarray(src)[:, :, 3] == 0).any():
        # the generator already delivered transparency: keep its edges, drop the faint halo (alpha 1-15) around each figure
        arr = np.asarray(src).copy(); arr[:, :, 3] = np.where(arr[:, :, 3] < 16, 0, arr[:, :, 3])
        whole = Image.fromarray(arr, 'RGBA'); whole = whole.crop(whole.getbbox())
    else:
        whole = cut(src.convert('RGB'))
    alpha = np.asarray(whole)[:, :, 3] > 0
    cols = alpha.any(0)
    # split at empty column gaps
    runs, start = [], None
    for x, on in enumerate(list(cols) + [False]):
        if on and start is None: start = x
        if not on and start is not None: runs.append((start, x)); start = None
    runs = [r for r in runs if r[1] - r[0] > whole.width * 0.04]
    assert len(runs) == 5, f'expected 5 figures, found {len(runs)}: {runs}'
    figs = [whole.crop((x0, 0, x1, whole.height)) for x0, x1 in runs]
    figs = [f.crop(f.getbbox()) for f in figs]
    unit = figs[0].height / HUMAN_UNITS  # sheet px per game unit, from the human
    report = {}
    for race, f in zip(RACES, figs):
        h = max(1, round(f.height / unit * SCALE)); w = max(1, round(f.width * h / f.height))
        im = f.convert('RGBa').resize((w, h), Image.LANCZOS).convert('RGBA')
        im.save(f'{out}/{race}.png', optimize=True)
        report[race] = {'px': [w, h], 'units': round(h / SCALE, 1)}
    print(json.dumps(report))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
