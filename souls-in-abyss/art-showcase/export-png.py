"""Rasterise newly authored native pixel coordinates; no source image is read."""
from pathlib import Path
import json,struct,zlib,sys,zipfile
out=Path(sys.argv[1]);data=json.loads((out/'assets/art-source.json').read_text())
icons=out/'assets/icons';icons.mkdir(exist_ok=True)
def png(path,w,h,pixels):
 image=bytearray(w*h*4)
 for p in pixels:
  x,y=p['x'],p['y']
  if 0<=x<w and 0<=y<h:
   i=(y*w+x)*4;image[i:i+4]=bytes.fromhex(p['color'][1:])+b'\xff'
 def chunk(t,d):return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
 raw=b''.join(b'\0'+image[y*w*4:(y+1)*w*4] for y in range(h))
 path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(raw))+chunk(b'IEND',b''))
sheet=[];atlas={}
for i,(key,pixels) in enumerate(data['icons'].items()):
 png(icons/(key+'.png'),16,16,pixels)
 marks=''.join(f'<rect x="{p["x"]}" y="{p["y"]}" width="1" height="1" fill="{p["color"]}"/>' for p in pixels)
 (icons/(key+'.svg')).write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">'+marks+'</svg>')
 x=(i%8)*24+4;y=(i//8)*24+4
 atlas[key]={'x':x,'y':y,'width':16,'height':16}
 sheet.extend(dict(p,x=p['x']+x,y=p['y']+y) for p in pixels)
png(out/'assets/spritesheet.png',192,((len(atlas)+7)//8)*24,sheet)
(out/'assets/atlas.json').write_text(json.dumps(atlas,indent=2)+'\n')
with zipfile.ZipFile(out/'assets/b-redraw-native-assets.zip','w',zipfile.ZIP_DEFLATED) as archive:
 for p in sorted(icons.iterdir()):archive.write(p,'icons/'+p.name)
 for name in ['art-source.json','spritesheet.png','atlas.json','icons.ts','avatar.ts','landscape.ts']:
  archive.write(out/'assets'/name,name)
print(f'Exported {len(atlas)} native 16×16 PNG/SVG assets and atlas; no resampling.')
