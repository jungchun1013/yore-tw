# Writes public/art/tainan/index.json: the sprite keys that have a picture. Run after cutting.
# usage (from yokai-night-market/): python3 -I art-source/tainan/write_index.py
import json, os
d = 'public/art/tainan'
keys = sorted(f[:-4] for f in os.listdir(d) if f.endswith('.png'))
json.dump(keys, open(f'{d}/index.json', 'w'))
print(len(keys), 'pictures:', ' '.join(keys))
