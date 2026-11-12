"""Assemble the requested sources without generating or repainting creatures.

Left column: exact first clouded version. Fast/armor: unedited first version.
Boss: exact first clouded sprite, with its sprout's existing recessed core
copied into the marked chest plate. Its existing stone shading takes the
boss's lilac material; only the inner core glow shifts blue.
Resource: the separately requested irregular pink mineral design, cell 5.
"""
import colorsys
from hashlib import sha256
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
CELL = 512
ORIGINAL = ROOT / 'art-reference/previous-enemies.png'
CLOUDED = ROOT / 'art-reference/enemies-clouded-v4.png'
PINK = ROOT / 'art-reference/enemies-gem-edits-v8.png'
OUTPUT = ROOT / 'public/art/enemies-original-local-v10.png'

def box(index):
    x, y = index % 3 * CELL, index // 3 * CELL
    return x, y, x + CELL, y + CELL

original = Image.open(ORIGINAL).convert('RGBA')
clouded = Image.open(CLOUDED).convert('RGBA')
pink = Image.open(PINK).convert('RGBA')
assert original.size == clouded.size == pink.size == (1536, 1024)
result = clouded.copy()
for index in [1, 2]:
    result.paste(original.crop(box(index)), box(index)[:2])
result.paste(pink.crop(box(5)), box(5)[:2])

# Copy only the existing recessed socket: no ivory body or decorative bezel.
sprout = clouded.crop(box(3))
socket_box = (199, 247, 289, 322)
socket = sprout.crop(socket_box)
mask = Image.new('1', socket.size)
points = [(204, 278), (211, 266), (228, 253), (246, 248),
          (264, 251), (280, 264), (286, 280), (281, 296),
          (267, 309), (247, 317), (228, 319), (211, 313), (202, 300)]
ImageDraw.Draw(mask).polygon([(x - socket_box[0], y - socket_box[1]) for x, y in points], fill=1)
for y in range(socket.height):
    for x in range(socket.width):
        if not mask.getpixel((x, y)):
            continue
        r, g, b, a = socket.getpixel((x, y))
        h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        light = .2126 * r + .7152 * g + .0722 * b
        in_core = ((x + socket_box[0] - 240) / 22) ** 2 + ((y + socket_box[1] - 286) / 21) ** 2 <= 1
        if h < .18 and s > .15 and r > g and g > b:
            # The cut stone wall takes the boss's lilac material, not a gold bezel.
            # Its existing recess shading is preserved; only the inner glow is blue.
            if in_core and light > 150:
                colour = [round(.64 * light + 8), round(.84 * light + 9), round(.95 * light + 20)]
            else:
                colour = [round(.95 * light), round(.86 * light), round(1.04 * light)]
            socket.putpixel((x, y), (*[min(255, v) for v in colour], a))

# This is an inset copied from the small sprout, not a new raised jewel mount.
size, target = (80, 66), (151, 188)
assert (target[0] + size[0] / 2, target[1] + size[1] / 2) == (191, 221)
socket = socket.resize(size, Image.NEAREST)
mask = mask.resize(size, Image.NEAREST)
boss_before = clouded.crop(box(4))
boss = boss_before.copy()
boss.paste(socket, target, mask)
result.paste(boss, box(4)[:2])

# Verify the four other creatures are literal source pixels, not AI redraws.
checks = {}
for index, source, name in [(0, clouded, 'top_left_clouded_restored'),
                            (3, clouded, 'bottom_left_clouded_restored'),
                            (1, original, 'fast_original_restored'),
                            (2, original, 'armor_original_restored')]:
    checks[name] = result.crop(box(index)).tobytes() == source.crop(box(index)).tobytes()
allowed = Image.new('1', boss.size)
allowed.paste(mask, target)
changed = 0
for y in range(CELL):
    for x in range(CELL):
        if boss.getpixel((x, y)) != boss_before.getpixel((x, y)):
            assert allowed.getpixel((x, y)), 'Boss body changed outside the small chest inlay'
            changed += 1
checks['boss_body_unchanged_outside_inlay'] = True
checks['three_cloudy_blue_head_crystals_unchanged'] = boss.crop((0, 0, CELL, 180)).tobytes() == boss_before.crop((0, 0, CELL, 180)).tobytes()
checks['pink_resource_exact_selected_design'] = result.crop(box(5)).tobytes() == pink.crop(box(5)).tobytes()
assert changed > 0 and all(checks.values())
result.save(OUTPUT)
boss.save(ROOT / 'art-reference/boss-recessed-core-v10.png')
metadata = {
    'method': 'Direct source-pixel composition. No whole-creature regeneration.',
    'sources': {str(p.relative_to(ROOT)): sha256(p.read_bytes()).hexdigest() for p in [ORIGINAL, CLOUDED, PINK]},
    'atlas': OUTPUT.name,
    'grid': [3, 2],
    'cell_px': CELL,
    'socket_source_cell': 3,
    'socket_source_box': socket_box,
    'socket_target_in_boss_cell': {'position': target, 'size': size},
    'socket_resize_from_v9': {'previous_size': [66, 54], 'width_factor': size[0] / 66, 'height_factor': size[1] / 54, 'unchanged_center': [191, 221]},
    'socket_material': 'Existing sprout recess shading; lilac stone wall with a muted blue inner core, no added raised bezel.',
    'changed_boss_pixels': changed,
    'verification': checks,
    'fast_enemy': 'Ground path follower. No flying mechanic; original feet/leaves retained.',
}
(ROOT / 'public/art/enemies-original-local-v10.recipe.json').write_text(json.dumps(metadata, indent=2) + '\n')
print(json.dumps(metadata, indent=2))
