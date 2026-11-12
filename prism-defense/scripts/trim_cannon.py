"""Inset only the marked old cannon belly contours, without generating artwork.

The user specified left 2px / right 1px at the 64px UI size. The source atlas
has 512px cells, so maximum displacement is left 16 / right 8 source pixels.
Nearest-neighbour sampling retains original colours; all other sprites and
the cannon's top, centre, ammunition bucket and feet remain unchanged.
"""
from hashlib import sha256
import json
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'art-reference/previous-towers.png'
OUTPUT = ROOT / 'public/art/towers-original-trim-l2-r1.png'
CELL, DISPLAY = 512, 64
INSETS = {'left': 2, 'right': 1}
SOURCE_INSETS = {side: inset * CELL // DISPLAY for side, inset in INSETS.items()}


def interpolate(points, value):
    for (a, b), (c, d) in zip(points, points[1:]):
        if a <= value <= c:
            return b + (d - b) * (value - a) / (c - a)
    return points[0][1] if value < points[0][0] else points[-1][1]


atlas = Image.open(SOURCE).convert('RGBA')
assert atlas.size == (CELL * 3, CELL * 2)
original = atlas.crop((CELL, 0, CELL * 2, CELL))
edited = original.copy()
allowed = Image.new('1', original.size)
protected = Image.new('1', original.size)
pen = ImageDraw.Draw(protected)
# Keep the old sprig, barrel pivot and central ornament at their exact pixels.
pen.rectangle((38, 190, 126, 275), fill=1)
pen.rectangle((257, 225, 329, 307), fill=1)
pen.rectangle((180, 306, 322, 413), fill=1)
# Protect the original ammunition bowl, cream pouch, sprout and ropes.
pen.polygon([(82, 283), (110, 274), (159, 275), (184, 288),
             (194, 311), (190, 332), (83, 339), (67, 323)], fill=1)
pen.polygon([(69, 315), (88, 331), (192, 330), (192, 406),
             (172, 429), (119, 435), (89, 421), (82, 353),
             (68, 337)], fill=1)
pen.polygon([(188, 318), (211, 312), (219, 325), (209, 343),
             (211, 419), (218, 431), (207, 447), (190, 443),
             (187, 427), (197, 415), (194, 345), (183, 334)], fill=1)

left = [(268, 87), (290, 68), (310, 62), (350, 63), (380, 72), (413, 96)]
right = [(268, 360), (290, 380), (310, 393), (335, 400),
         (360, 393), (385, 379), (413, 359)]
max_displacement = {'left': 0, 'right': 0}
for y in range(268, 414):
    for side, curve in [('left', left), ('right', right)]:
        delta = round(interpolate([(268, 0), (300, SOURCE_INSETS[side]),
                                   (372, SOURCE_INSETS[side]), (413, 0)], y))
        if not delta:
            continue
        edge = round(interpolate(curve, y))
        # A constant-shift strip moves the outer contour by exactly delta.
        # The inner edge stays fixed; compression tapers within the side band.
        if side == 'left':
            anchors = [(edge - 24, edge - 24),
                       (edge - 8 + delta, edge - 8),
                       (edge + 8 + delta, edge + 8),
                       (edge + 80, edge + 80)]
        else:
            anchors = [(edge - 80, edge - 80),
                       (edge - 8 - delta, edge - 8),
                       (edge + 8 - delta, edge + 8),
                       (edge + 24, edge + 24)]
        for x in range(anchors[0][0], anchors[-1][0] + 1):
            if protected.getpixel((x, y)):
                continue
            sx = round(interpolate(anchors, x))
            edited.putpixel((x, y), original.getpixel((sx, y)))
            allowed.putpixel((x, y), 1)
            max_displacement[side] = max(max_displacement[side], abs(sx - x))

assert max_displacement == SOURCE_INSETS
# Verify pixel identity outside the two permitted contour bands.
changed = []
for y in range(CELL):
    for x in range(CELL):
        if original.getpixel((x, y)) != edited.getpixel((x, y)):
            assert allowed.getpixel((x, y)) and not protected.getpixel((x, y))
            changed.append((x, y))
assert changed
result = atlas.copy()
result.paste(edited, (CELL, 0))
for index in [0, 2, 3, 4, 5]:
    x, y = index % 3 * CELL, index // 3 * CELL
    box = (x, y, x + CELL, y + CELL)
    assert result.crop(box).tobytes() == atlas.crop(box).tobytes()
assert edited.crop((0, 0, CELL, 268)).tobytes() == original.crop((0, 0, CELL, 268)).tobytes()
assert edited.crop((0, 414, CELL, CELL)).tobytes() == original.crop((0, 414, CELL, CELL)).tobytes()
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
result.save(OUTPUT)
edited.save(ROOT / 'art-reference/cannon-original-trim-L2-R1.png')

# A 4x nearest-neighbour comparison of the actual 64px icons.
comparison = Image.new('RGBA', (576, 292), '#28332f')
draw = ImageDraw.Draw(comparison)
draw.text((16, 10), 'ORIGINAL / 64px x4', fill='#eee9d9')
draw.text((304, 10), 'TRIM / LEFT 2px RIGHT 1px', fill='#eee9d9')
for sprite, x in [(original, 16), (edited, 304)]:
    icon = sprite.resize((64, 64), Image.NEAREST)
    comparison.alpha_composite(icon.resize((256, 256), Image.NEAREST), (x, 30))
comparison.convert('RGB').save(ROOT / 'screenshots/cannon-trim-L2-R1-comparison.png')

metadata = {
    'method': 'Direct nearest-neighbour editing of original pixels; no generated repaint.',
    'source': 'art-reference/previous-towers.png',
    'source_sha256': sha256(SOURCE.read_bytes()).hexdigest(),
    'atlas': OUTPUT.name,
    'cell': 1,
    'source_cell_px': CELL,
    'display_cell_px': DISPLAY,
    'inset_display_px_per_side': INSETS,
    'max_inset_source_px_per_side': max_displacement,
    'changed_source_pixels': len(changed),
    'affected_rows': [min(y for _, y in changed), max(y for _, y in changed)],
    'verification': {
        'other_five_source_sprites_identical': True,
        'upper_components_and_feet_identical': True,
        'protected_ammunition_bucket_identical': True,
        'barrel_mount_identical': edited.crop((257, 225, 330, 308)).tobytes() == original.crop((257, 225, 330, 308)).tobytes(),
        'original_sprig_identical': edited.crop((38, 190, 127, 276)).tobytes() == original.crop((38, 190, 127, 276)).tobytes(),
        'all_changes_inside_two_contour_bands': True,
        'central_body_pixels_identical': all(
            original.getpixel((x, y)) == edited.getpixel((x, y))
            for x in range(180, 323) for y in range(306, 414)
        ),
    },
}
assert all(metadata['verification'].values())
(ROOT / 'public/art/cannon-trim.json').write_text(json.dumps(metadata, indent=2) + '\n')
print(json.dumps(metadata, indent=2))
