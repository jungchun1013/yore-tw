/** Original grid-drawn artwork. Each cell is one pixel; no smoothing or gradients. */
export const PALETTE: Record<string, string> = {
  o: '#343842', s: '#667681', h: '#bcc5bd', w: '#e3ddc9', g: '#82947b',
  G: '#53695e', b: '#839da5', p: '#9586a4', P: '#625575', y: '#c1a775',
  r: '#b47f76', t: '#ac917b', d: '#725e53', k: '#343842', W: '#ffffff',
};
const patterns: Record<string, string> = {
  human: '..oooo../.otttto./.twwwwt./.twkwkw./..tw wt../..gggg../.ggyygg./..g..g..',
  elf: '..gggg../.gggggg./twwwwwt./.wkwkw../..www.../..GGG.../.GGyGG../..G.G...',
  dwarf: '..ssss../.shhhhs./ssyyyyss/.twkwkt./.tddddt./..dddd../.ssyyss./..s..s..',
  giant: '..oooo../.otttto./.twkwkt./..twwt../.GGGGGG./GGGyyGGG/.GGGGGG./.GG..GG.',
  undead: '..oooo../.owwwwo./.wkkwkw./.wwwwww./..wkw.../.PPPPP../..P.P.../.PP.PP..',
  str: '...ttt../..tttto./.ttwtto./.ttttto./tttttto./ttttto../.oooo.../........',
  dex: '......g./.....gg./.g..gg../.gggg.../..ggg.../...gg.../..gg..../.gg.....',
  int: '.oooooo./.wwohhwo/.wwowwwo/.wwowwwo/.wwowwwo/.wwowwwo/.oooooo./...oo...',
  will: '...pp.../..pwwp../.pwb bwp./.pwwwwp./..pwwp../...pp.../...yy.../..yyyy..',
  luk: '.gg..gg./gwwggwwg/gggggggg/.gggggg./..gggg../...gg.../...g..../..gg....',
  equip: '..ssss../.shhhhs./sshhh hss/sshhhhss/.shhhhs./..shhs../...ss.../........',
  pets: '.WW..WW./.WW..WW./..WWWW../.WWWWWW./.WkWkW../..WrW.../...W..../........', // white, so it shows on the cream tab
  skills: '...p..../...pp.../..pypp../.ppyypp./ppywyppp/.pyyyp../..ppp.../...p....',
  map: '.oo..oo./owwoowwo/owwggwwo/owgggwwo/owwgwwwo/owwwgwwo/.oowwoo./...oo...',
  smith: '...ss.../.ssssss./.hhhhhh./..ssss../...ss.../..ssss../.ssssss./........',
  titles: '.y....y./.yy..yy./.yyyyyy./..yyyy../...yy.../..yyyy../.yyyyyy./........',
  rebirth: '..pppp../.pp..pp./pp....p./p...pppp/p....pp./pp....../.pp..pp./..pppp..',
  settings: '...ss.../.s.sss.s/.ssssss./sssoosss/sssoosss/.ssssss./.s.sss.s/...ss...',
  'slot-head': '..ssss../.shhhhs./sshhh hss/sshhhhss/ssok koss/.s....s./........ /........',
  'slot-weapon': '......hh/.....hwh/....hwh./...hwh../y.hwh.../.yyh..../..yd..../.dd.....',
  'slot-body': '.ss..ss./shhss hhs/shhhhhhs/.shhhhs./.shyyhs./.shhhhs./.ssssss./........',
  'slot-hands': '.ss..ss./.hs..hs./.hs..hs./shhss hhs/shhss hhs/.ss..ss./........ /........',
  'slot-feet': '..ss.ss./..hs.hs./..hs.hs./..hs.hs./.hhss hhs/.hhss hhs/.ss..ss./........',
  'slot-acc1': '...yy.../..ywwy../.yyyyyy./yy....yy/yy....yy/.yy..yy./..yyyy../........',
  'slot-acc2': '..yyyy../..yppy../...pp.../..pwwp../.pwb bwp./..pwwp../...pp.../........',
  'sk-smash': '.....rr./.s..rr../shsrr.../.shs..../..shs.../.rrshs../rr..s.../r.......',
  'sk-counter': '..ss..../.shs..r./..shsrr./...ssr../..rrrr../...rrs../....shs./.....ss.',
  'sk-firebolt': '....r.../..r.rr../..rryr../.rryyr../rrywyrr./rywwwyr./.ryyyr../..rrr...',
  'sk-icebolt': '...b..../.b.b.b../..bb b.../bbbbbbbb/..bwb.../.bbbbb../b..b..b./...b....',
  'sk-lightning': '....yy../...yy.../..yy..../.yyyyyy./....yy../...yy.../..yy..../..y.....',
  'sk-mastery': '.y....y./..y..y../...ss.../..shhs../...ss.../..y..y../.y....y./........',
  'sk-lightArms': '...h...h/..hw..hw/.hw..hw./hw..hw../yy..yy../d...d.../........ /........',
  'sk-mediumArms': '......hh/.....hwh/....hwh./...hwh../..hwh.../.yyh..../..d...../.d......',
  'sk-heavyArms': '..ssss../.shhss../shhhss../.shhss../..dd..../..dd..../..dd..../..dd....',
  'sk-tough': '.ss..ss./shhss hhs/shhhhhhs/.shhhhs./.shhhhs./..shhs../...ss.../........',
  'sk-meditation': '...pp.../..pwwp../...pp.../..pppp../.pppppp./...pp.../.pppppp./pppppppp',
  'sk-fortune': '..yyyy../.ywwyyy./yywy yyy/yywyyyyy/yyyyyyyy/.yyyyyy./..yyyy../........',
  'sk-insight': '...pp.../.ppwwpp./ppwkkwpp/pwwkkwwp/.ppwwpp./...pp.../...p..../........',
  arrow: '...ss.../...ss.../...ss.../ss.s s.ss/.ssssss./..ssss../...ss.../........',
  'pet-pudding': '..dddd../.dyyyyd./.yyyyyy./yywyyyyy/yykyykyy/yyyyyyyy/.yyyyyy./..yyyy..',
  'pet-potcat': '..ssss../.shhhhs./ssssssss/.twttwt./.wkwkwt./..twwt../.tttttt./..t..t..',
  'pet-mosskin': '....g.../..ggg.../.GGggG../GGggggGG/GgwggwgG/.GkkkkG./..GggG../..g..g..',
  'pet-mimipup': '.d....d./.dddddd./dy yyyydd/dwwwwwwd/dwkwkwdd/dwwrrwwd/.dddddd./..d..d..',
  'pet-ember': '.....rr./....ryr./..rrrr../.rwrrwr./.rkrrkr./..rrrrrr/.rr..rrr/rrr...r.',
  'pet-griffy': '..y..y../.yyyyyy./.ywyywy./.ykyyky./..yyyy../whyyyyhw/.hhyyhh./..y..y..',
  'pet-nameless': '..P..P../.PPPPPP./PPppppPP/PpwppwpP/PppppppP/.PPppPP./..P..P../.P....P.',
  unknown: '..pppp../.pwwwpp./....wpp./...wpp../...pp.../......../...pp.../........',
  'area-meadow': '......y./.g....../.gg..g../..g..gg./g.g.g.g./.gggggg./GGGGGGGG/.GGGGGG.',
  'area-forest': '...g..../..ggg.../.ggggg../..GGG.../.GGGGG../GGGGGGG./...dd.../..dddd..',
  'area-labyrinth': 'ssssssss/swwwwwws/swssssws/swswwsws/swsswsws/swwwssws/sssswwws/ssssssss',
  'area-mine': '..ssss../.sskkss./sskkkkss/skkyykks/skkykkks/skkkkkks/ddkkkkdd/dddddddd',
  'area-fen': '.g....g./.gg...g./..g..gg./..g...g./bbbbbbbb/.bbGGbb./bbGGGGbb/.bbbbbb.',
  'area-ruins': '.ss..ss./.hh..hh./.hhsshh./.hhhhhh./.hh..hh./.hh..hh./sshhhhss/ssssssss',
  'area-nest': '......w./....www./.d..ww../..dddd../.dyyyy d./ddyyyydd/.dddddd./..dddd..',
  'area-abyss': '..PPPP../.PppppP./PppPPppP/PpPwwPpP/PpPwwPpP/PppPPppP/.PppppP./..PPPP..',
  star: '...yy.../...yy.../yyyyyyyy/.yyyyyy./..yyyy../.yyyyyy./.yy..yy./........',
  heart: '.rr..rr./rrrrrrrr/rwrrrrrr/rrrrrrrr/.rrrrrr./..rrrr../...rr.../........',
  hazard: '...yy.../..yyyy../..ykky../.yykkyy./.yykkyy./yyyyyyyy/yyykk yyy/........',
  'warn-soft': '...oo.../..owwo../..owwo../..owwo../...oo.../......../...oo.../...oo...',
  'warn-hard': '...rr.../..rrrr../..rrrr../..rrrr../...rr.../......../...rr.../...rr...',
};
// The 8-cell silhouettes are refined into a 16×16 grid with single-pixel
// edge lighting, contact shadows and bespoke facial/material accents.
export const ICON_SIZE = 16;
export interface Pixel { x: number; y: number; color: string }
const shade = (color: string, amount: number) => '#' + [1, 3, 5].map(i =>
  Math.max(0, Math.min(255, parseInt(color.slice(i, i + 2), 16) + amount)).toString(16).padStart(2, '0')).join('');
const refined = new Map<string, Pixel[]>();
/** The user chose the plain 8×8 look (2026-11-08): flat cells, no edge lighting, no 16×16 extras. Flip to get the refined look back. */
export const PLAIN_8X8 = true;
export function pixels(name: string): Pixel[] {
  if (refined.has(name)) return refined.get(name)!;
  const rows = (patterns[name] || patterns.unknown).split('/').map(row => row.replace(/ /g, '').padEnd(8, '.'));
  const cells = new Map<string, Pixel>();
  const put = (x: number, y: number, color: string) => {
    if (x >= 0 && x < 16 && y >= 0 && y < 16) cells.set(`${x},${y}`, { x, y, color });
  };
  if (PLAIN_8X8) {
    rows.forEach((row, y) => [...row].forEach((v, x) => {
      const color = PALETTE[v]; if (!color) return;
      put(x * 2, y * 2, color); put(x * 2 + 1, y * 2, color); put(x * 2, y * 2 + 1, color); put(x * 2 + 1, y * 2 + 1, color);
    }));
    const flat = [...cells.values()]; refined.set(name, flat); return flat;
  }
  rows.forEach((row, y) => [...row].forEach((v, x) => {
    const color = PALETTE[v]; if (!color) return;
    const top = rows[y - 1]?.[x] !== v, left = row[x - 1] !== v;
    const bottom = rows[y + 1]?.[x] !== v, right = row[x + 1] !== v;
    put(x * 2, y * 2, shade(color, top || left ? 17 : 0));
    put(x * 2 + 1, y * 2, shade(color, top ? 12 : 0));
    put(x * 2, y * 2 + 1, color);
    put(x * 2 + 1, y * 2 + 1, shade(color, bottom || right ? -19 : -5));
  }));
  if (name.startsWith('pet-')) {
    const eyes: Record<string, number[]> = {
      pudding: [4, 10, 8], potcat: [4, 8, 8], mosskin: [4, 10, 8],
      mimipup: [4, 8, 8], ember: [4, 8, 8], griffy: [4, 8, 6], nameless: [4, 10, 6],
    };
    const face = eyes[name.slice(4)];
    if (face) { const [l, r, y] = face;
      for (const x of [l, r]) { put(x, y, PALETTE.o); put(x, y + 1, PALETTE.o); put(x + 1, y, PALETTE.w); }
      put(l + 2, y + 3, PALETTE.r); put(l + 3, y + 3, PALETTE.d);
    }
    if (name === 'pet-pudding') { put(4, 5, PALETTE.w); put(5, 5, PALETTE.w); put(3, 6, PALETTE.w); }
    if (name === 'pet-mimipup') { put(7, 5, PALETTE.y); put(7, 6, PALETTE.o); put(7, 7, PALETTE.y); }
    if (name === 'pet-mosskin') { put(7, 2, PALETTE.y); put(8, 3, PALETTE.g); }
  }
  const result = [...cells.values()]; refined.set(name, result); return result;
}
export function pixelMarkup(name: string): string {
  return pixels(name).map(p => `<rect x="${p.x}" y="${p.y}" width="1" height="1" fill="${p.color}"/>`).join('');
}
export function icon(name: string, cls = 'gi'): string {
  return `<svg class="${cls}" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true" data-icon="${name}">${pixelMarkup(name)}</svg>`;
}
patterns['sk-defense'] = patterns.equip;
// slots that share a look: the off hand uses the shield, the charms keep the ring and amulet
patterns['slot-off'] = patterns.equip; patterns['slot-shield'] = patterns.equip;
patterns['slot-ring'] = patterns['slot-acc1']; patterns['slot-neck'] = patterns['slot-acc2'];
patterns['slot-legs'] = '.ssssss./.shhhhs./.shhhhs./.shsshs./.shsshs./.shsshs./.ss..ss./........';
patterns.bag = '...dd.../..d..d../.dddddd./.dttttd./.dtyytd./.dttttd./.dddddd./........';
patterns.ap = '..pppp../.pwwppp./pwwppppp/pwpppppp/ppppppPp/pppppPPp/.pppPPp./..pppp..';
