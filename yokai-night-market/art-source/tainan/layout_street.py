# Writes src/data/street.json: buildings in order with their real widths, joined by walls,
# hedges and fences; trees behind the temple wall.  python3 -I layout_street.py
import json, os, re
from PIL import Image
man = open('src/data/manifest.ts').read()
def height(key):
    m = re.search(r"a\('%s', '\w+', (\d+)," % re.escape(key), man); return int(m.group(1)) if m else 100
def width(key):
    f = f'public/art/tainan/{key}.png'
    if os.path.exists(f): w, h = Image.open(f).size; return w / h * height(key)
    return height(key) * 0.86
items = []; x = 70.0
def put(key, lane='build', gap=0, **kw):
    global x
    x += gap; w = width(key); cx = round(x + w / 2); x += w
    items.append({'key': key, 'x': cx, 'lane': lane, **kw}); return cx, w
def at(key, cx, lane='decor', **kw): items.append({'key': key, 'x': round(cx), 'lane': lane, **kw})

# the gate to the flower lane spans the road at the left end
# the Confucius Temple: gate, then its red wall running right to the literature museum
g, gw = put('confucius')
w1, ww = put('confuciusWall', gap=-6)
w2, _ = put('confuciusWall', gap=-2)
at('banyan', g + 20, 'back'); at('norfolkPine', w1 - 20, 'back'); at('rainTree', w2 + 10, 'back')
at('plumeria', g + gw / 2 + 26, 'decor')
# a stone path from the temple gate into the yard, and a signpost to the flower lane beside it
paths = [{'x': g, 'w': 3, 'rows': 5}]
at('signLane', g - 60, 'near', action='gate:lane')
at('stoneLantern', w1 + 40, 'decor')
# the literature museum unfolded: side wing, front with its corner towers, side wing
sl, slw = put('literatureSide', gap=0)
lit, lw = put('literature', gap=-4)
sr, srw = put('literatureSide', gap=-4, flip=True)
start = lit
for cx in (sl - 44, sl + 44, sr - 44, sr + 44): at('royalPalm', cx, 'decor')
at('literatureWall', sl, 'decor'); at('literatureWall', sr, 'decor')
at('flameTree', sr + srw / 2 + 30, 'back')
b, bw = put('butokuden', gap=60)
at('woodFence', b + bw / 2 + 24, 'decor')
h, hw = put('hayashi', gap=36)
at('lantern', h + hw / 2 + 16, 'decor')
k, kw_ = put('bank', gap=34)
at('brickLowWall', k + kw_ / 2 + 22, 'decor')
f, fw = put('firehall', gap=40)
at('greenHedge', f + fw / 2 + 20, 'decor')
p, pw = put('police', gap=36)
at('sakura', p + pw / 2 + 22, 'decor')
wt, wtw = put('weather', gap=40)
at('ixoraHedge', wt + wtw / 2 + 50, 'decor')
end = round(x + 110)
# animals in the yard
at('malayanNightHeron', lit - 60, 'fauna', y=380)
at('spottedDove', b + 20, 'fauna', y=356); at('spottedDove', b + 52, 'fauna', y=372, flip=True)
at('malayanNightHeron', p, 'fauna', y=400)
d = {'width': end, 'start': start, 'paths': paths,
     'note': "The main street, left to right: the Confucius Temple gate with a stone path in front and a signpost to the flower lane (src/data/lane.json), its red wall, the literature museum, then the Wude Hall and on to the roundabout buildings. lane: back = behind the buildings (trees over the wall), build = the buildings, decor = in front of them, across = spanning the road, near = near side, front = between camera and walkers, fauna = animals. start = where the heroine first stands. Written by layout_street.py, then edited with ?editor.",
     'items': items}
open('src/data/street.json', 'w').write(json.dumps(d, ensure_ascii=False, indent=2) + '\n')
print(end, [(i['key'], i['x']) for i in items if i['lane'] == 'build'])

# lane: drop the foreground tree, keep the rest
l = json.load(open('src/data/lane.json'))
l['items'] = [i for i in l['items'] if i['lane'] != 'front']
for i in l['items']:
    if i['lane'] == 'fauna': i['y'] = 380
open('src/data/lane.json', 'w').write(json.dumps(l, ensure_ascii=False, indent=2) + '\n')
