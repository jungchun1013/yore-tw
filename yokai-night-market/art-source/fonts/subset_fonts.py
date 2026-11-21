# Cuts the two Chinese fonts down to the characters the game uses, as woff2.
#   GenRyuMin2TW-B.otf  (源樣明體 TW Bold, ButTaiwan, SIL OFL) -> src/assets/fonts/genryumin-b.woff2  titles, names
#   jf-openhuninn-2.1.ttf (jf open 粉圓, justfont, SIL OFL)     -> src/assets/fonts/huninn.woff2       interface, text
# Run again whenever new Chinese text is added, or a missing character falls back to the system font.
# usage (from yokai-night-market/): python3 -I art-source/fonts/subset_fonts.py <GenRyuMin otf> <Huninn ttf>
import os, re, subprocess, sys

genryu, huninn = sys.argv[1], sys.argv[2]
text = set()
for root in ['src', 'index.html']:
    paths = [root] if root.endswith('.html') else [os.path.join(d, f) for d, _, fs in os.walk(root) for f in fs if f.endswith('.ts')]
    for p in paths:
        text |= set(open(p, encoding='utf-8').read())
# every printable ASCII character, full-width punctuation and digits, so numbers and English always work
text |= set(chr(c) for c in range(0x20, 0x7f))
text |= set('　、。，．：；？！「」『』（）《》〈〉—…・～％＋－×÷０１２３４５６７８９')
chars = ''.join(sorted(c for c in text if c >= ' '))
os.makedirs('src/assets/fonts', exist_ok=True)
open('art-source/fonts/charset.txt', 'w', encoding='utf-8').write(chars)
for src, out in [(genryu, 'src/assets/fonts/genryumin-b.woff2'), (huninn, 'src/assets/fonts/huninn.woff2')]:
    subprocess.run([sys.executable, '-m', 'fontTools.subset', src, '--text-file=art-source/fonts/charset.txt',
                    '--flavor=woff2', f'--output-file={out}', '--layout-features=*', '--no-hinting'], check=True)
    print(out, os.path.getsize(out) // 1024, 'KB')
print(len(chars), 'characters')
