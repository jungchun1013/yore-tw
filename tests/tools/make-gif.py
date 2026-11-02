"""Assemble timestamped PNG frames (from gif.spec.ts) into an optimised GIF with Pillow.
usage: python3 tests/tools/make-gif.py <frames_dir> <out.gif> [max_width]
"""
import sys, os, re
from PIL import Image

frames_dir, out = sys.argv[1], sys.argv[2]
max_w = int(sys.argv[3]) if len(sys.argv) > 3 else 720
files = sorted(f for f in os.listdir(frames_dir) if f.endswith('.png'))
stamps = [int(re.search(r'_(\d+)\.png$', f).group(1)) for f in files]
# drop leading frames before the game canvas appeared (nearly blank: very few colours)
imgs, durs = [], []
for i, f in enumerate(files):
    im = Image.open(os.path.join(frames_dir, f)).convert('RGB')
    if im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    nxt = stamps[i + 1] if i + 1 < len(stamps) else stamps[i] + 120
    imgs.append(im); durs.append(max(40, nxt - stamps[i]))
# skip initial frames until content has more than a handful of colours
start = 0
for i, im in enumerate(imgs):
    if len(im.getcolors(maxcolors=64) or [0] * 65) > 40:
        start = i; break
imgs, durs = imgs[start:], durs[start:]
pal = imgs[0].quantize(colors=128, method=Image.MEDIANCUT)
q = [im.quantize(colors=128, palette=pal, dither=Image.FLOYDSTEINBERG) for im in imgs]
q[0].save(out, save_all=True, append_images=q[1:], duration=durs, loop=0, optimize=True, disposal=1)
print(f'{out}: {len(q)} frames, {sum(durs)/1000:.1f}s, {os.path.getsize(out)/1024:.0f} KB')
