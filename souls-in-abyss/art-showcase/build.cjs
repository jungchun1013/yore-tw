const fs=require('fs');const path=require('path');const esbuild=require('esbuild');
const dir=__dirname, root=path.resolve(dir,'../..'), out=path.join(dir,'dist');
fs.mkdirSync(path.join(out,'assets'),{recursive:true});
for(const file of ['index.html','style.css'])fs.copyFileSync(path.join(dir,file),path.join(out,file));
fs.copyFileSync(path.join(dir,'../src/assets/Cubic_11.woff2'),path.join(out,'assets/Cubic_11.woff2'));
fs.copyFileSync(path.join(dir,'../public/favicon.svg'),path.join(out,'assets/favicon.svg'));
esbuild.buildSync({entryPoints:[path.join(dir,'main.ts')],outfile:path.join(out,'app.js'),bundle:true,minify:true,target:'es2020',platform:'browser'});
const artModule=esbuild.buildSync({stdin:{contents:`export {ICON_NAMES,PALETTE,pixels} from ${JSON.stringify(path.join(dir,'../src/ui/icons.ts'))}`,resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;
const sourceModule={exports:{}};new Function('module','exports',artModule)(sourceModule,sourceModule.exports);
const {ICON_NAMES,PALETTE,pixels}=sourceModule.exports;
const source={version:'B-redraw-16-native',size:16,palette:PALETTE,icons:Object.fromEntries(ICON_NAMES.map(key=>[key,pixels(key)]))};
fs.writeFileSync(path.join(out,'assets/art-source.json'),JSON.stringify(source));
fs.copyFileSync(path.join(root,'docs/art-preview/reference/pixel-8x8.json'),path.join(out,'assets/b-icons.json'));
for(const f of fs.readdirSync(path.join(dir,'../art-reference/b-original'))){if(/\.(png|ts)$/.test(f))fs.copyFileSync(path.join(dir,'../art-reference/b-original',f),path.join(out,'assets',f));}
for(const f of ['icons.ts','avatar.ts','landscape.ts','motion.ts','scene.ts','world-map.ts'])fs.copyFileSync(path.join(dir,'../src/ui',f),path.join(out,'assets',f));
console.log(`Built ${ICON_NAMES.length} native-grid drawings → ${out}`);

require('child_process').execFileSync('python3',[path.join(dir,'export-png.py'),out],{stdio:'inherit'});

for(const f of ['abyss-world-map.png','abyss-world-map.prompt.json'])fs.copyFileSync(path.join(dir,'../public/sprites',f),path.join(out,'assets',f));

fs.cpSync(path.join(dir,'../public/sprites/battle'),path.join(out,'sprites/battle'),{recursive:true});
require('child_process').execFileSync('python3',['-c',"from pathlib import Path;import sys,zipfile;p=Path(sys.argv[1]);z=zipfile.ZipFile(p/'assets/battle-backgrounds.zip','w',zipfile.ZIP_DEFLATED);[z.write(f,'battle/'+f.name) for f in sorted((p/'sprites/battle').iterdir()) if f.is_file()];z.close()",out]);
