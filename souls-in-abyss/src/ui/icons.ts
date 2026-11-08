/**
 * B-style redraw, authored directly on a 16×16 grid.
 * No source-image sampling, enlargement, bevel filter or generated colours.
 * One shared, deliberately small palette. Every mark is an integer pixel.
 */
export const PALETTE: Record<string, string> = {
  o: '#343842', k: '#343842', s: '#667681', h: '#bcc5bd', w: '#e3ddc9',
  G: '#53695e', g: '#82947b', l: '#a8b59a', b: '#839da5', B: '#526d79',
  P: '#625575', p: '#9586a4', L: '#c1b3c6', y: '#c1a775', Y: '#d9c49b',
  d: '#725e53', t: '#ac917b', T: '#cfb49a', r: '#b47f76', R: '#855c59',
};
export const ICON_SIZE = 16;
export interface Pixel { x: number; y: number; color: string }
/** Small drawing surface: only flat, palette-indexed marks at native resolution. */
class Grid {
  private cells = new Map<string, Pixel>();
  dot(x: number, y: number, c: string): this {
    if (!PALETTE[c]) throw new Error(`Unknown art colour: ${c}`);
    if (x >= 0 && x < 16 && y >= 0 && y < 16) this.cells.set(`${x},${y}`, { x, y, color: PALETTE[c] });
    return this;
  }
  rect(x: number, y: number, w: number, h: number, c: string): this {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.dot(xx, yy, c);
    return this;
  }
  line(x: number, y: number, tx: number, ty: number, c: string): this {
    const dx = Math.abs(tx - x), dy = -Math.abs(ty - y), sx = x < tx ? 1 : -1, sy = y < ty ? 1 : -1;
    let error = dx + dy;
    while (true) { this.dot(x, y, c); if (x === tx && y === ty) break;
      const e = error * 2; if (e >= dy) { error += dy; x += sx; } if (e <= dx) { error += dx; y += sy; }
    } return this;
  }
  poly(points: number[][], c: string): this {
    const min = Math.min(...points.map(p => p[1])), max = Math.max(...points.map(p => p[1]));
    for (let y = min; y <= max; y++) {
      const hits: number[] = [];
      points.forEach(([ax, ay], i) => { const [bx, by] = points[(i + 1) % points.length];
        if ((ay <= y && by > y) || (by <= y && ay > y)) hits.push(ax + (y - ay) * (bx - ax) / (by - ay));
      }); hits.sort((a, b) => a - b);
      for (let i = 0; i + 1 < hits.length; i += 2) this.rect(Math.ceil(hits[i]), y, Math.floor(hits[i + 1]) - Math.ceil(hits[i]) + 1, 1, c);
    } return this;
  }
  result(): Pixel[] { return [...this.cells.values()]; }
}
type Draw = (g: Grid) => void;
const art: Record<string, Pixel[]> = {};
const draw = (key: string, f: Draw) => { const g = new Grid(); f(g); art[key] = g.result(); };
// Equipment. Edges, rivets and seams are placed individually on the 16px grid.
const shield: Draw = g => {
  g.poly([[2,2],[7,3],[13,2],[13,9],[11,12],[7,15],[3,12],[2,9]],'o');
  g.poly([[3,3],[7,4],[12,3],[12,9],[10,12],[7,14],[4,11],[3,8]],'s');
  g.line(4,4,4,9,'h').line(5,11,7,13,'h').rect(6,5,3,6,'g').rect(5,7,5,2,'g').dot(7,7,'y');
};
const sword: Draw = g => {
  g.poly([[13,0],[15,0],[15,3],[6,12],[3,9]],'s');
  g.poly([[13,1],[14,1],[14,3],[6,11],[4,9]],'h');
  g.line(5,8,12,1,'w').line(6,9,14,1,'b');
  g.line(2,7,8,13,'d').line(2,6,9,13,'y').dot(2,6,'Y').dot(9,13,'Y');
  g.line(4,11,1,14,'d').line(5,12,2,15,'t').dot(1,15,'y');
};
draw('slot-weapon', sword);
draw('slot-head', g => {
  g.rect(5,2,6,1,'s').rect(3,3,10,3,'s').rect(2,6,12,5,'s');
  g.rect(4,4,8,3,'h').rect(3,7,10,2,'h').rect(3,9,3,5,'s').rect(10,9,3,5,'s');
  g.line(4,4,10,4,'w').rect(6,9,4,3,'o').rect(7,7,2,4,'s').dot(4,10,'y').dot(11,10,'y');
});
draw('slot-body', g => {
  g.poly([[4,2],[6,3],[9,3],[11,2],[15,5],[13,8],[11,7],[11,14],[4,14],[4,7],[2,8],[0,5]],'s');
  g.poly([[4,3],[6,5],[9,5],[11,3],[13,5],[11,6],[10,13],[5,13],[4,6],[2,5]],'h');
  g.rect(5,6,5,5,'b').line(5,6,5,10,'w').rect(4,12,8,2,'d').rect(7,12,2,2,'y');
  g.dot(2,5,'w').dot(12,5,'w');
});
draw('slot-legs', g => {
  g.rect(3,2,10,3,'s').rect(3,5,4,9,'b').rect(9,5,4,9,'b');
  g.rect(4,5,1,8,'h').rect(10,5,1,8,'h').rect(3,9,4,2,'s').rect(9,9,4,2,'s');
  g.rect(4,2,8,1,'d').dot(7,2,'y').rect(3,14,4,1,'s').rect(9,14,4,1,'s');
});
draw('slot-hands', g => {
  g.rect(2,3,4,3,'s').rect(10,3,4,3,'s').rect(2,6,4,7,'h').rect(10,6,4,7,'h');
  g.rect(1,8,2,3,'s').rect(13,8,2,3,'s').rect(3,7,1,4,'w').rect(11,7,1,4,'w');
  g.rect(2,12,4,2,'s').rect(10,12,4,2,'s').dot(3,4,'y').dot(11,4,'y');
});
draw('slot-feet', g => {
  g.rect(3,2,4,9,'s').rect(10,2,4,9,'s').rect(4,3,2,7,'h').rect(11,3,2,7,'h');
  g.rect(1,10,6,4,'s').rect(8,10,6,4,'s').rect(2,10,4,2,'h').rect(9,10,4,2,'h');
  g.rect(1,13,6,1,'d').rect(8,13,6,1,'d').dot(5,8,'y').dot(12,8,'y');
});
draw('slot-ring', g => {
  g.poly([[5,1],[9,1],[11,4],[9,6],[5,6],[3,4]],'y').rect(6,2,3,3,'b').dot(6,2,'w');
  g.line(4,6,2,9,'y').line(2,9,3,12,'y').line(3,12,6,14,'y').line(6,14,10,13,'y').line(10,13,12,10,'y').line(12,10,11,6,'y');
  g.line(3,9,4,12,'Y').line(4,12,7,13,'Y').dot(12,8,'d');
});
draw('slot-neck', g => {
  g.line(2,1,3,5,'y').line(3,5,7,8,'y').line(13,1,12,5,'y').line(12,5,8,8,'y');
  g.poly([[7,7],[12,11],[8,15],[3,11]],'P').poly([[7,8],[10,11],[8,13],[5,11]],'p');
  g.dot(7,9,'w').line(7,10,6,11,'L').dot(8,13,'y');
});
draw('equip', shield); draw('slot-off', shield); draw('slot-shield', shield);
art['slot-acc1'] = art['slot-ring']; art['slot-acc2'] = art['slot-neck'];
// Seven companions: new silhouettes and one-pixel facial features, kept deliberately calm.
draw('pet-pudding', g => {
  g.poly([[5,3],[10,3],[13,6],[14,11],[12,14],[3,14],[1,11],[2,7]],'y');
  g.poly([[4,3],[11,3],[12,5],[10,6],[5,5],[3,6]],'d');
  g.rect(5,2,5,1,'t').rect(4,7,2,1,'Y').dot(3,8,'w');
  g.rect(5,9,1,2,'o').rect(10,9,1,2,'o').dot(4,11,'r').dot(11,11,'r').rect(7,12,2,1,'d');
  g.rect(4,14,7,1,'d').dot(12,13,'Y');
});
draw('pet-potcat', g => {
  g.poly([[3,5],[5,7],[10,7],[12,5],[13,11],[11,14],[4,14],[2,11]],'t');
  g.rect(4,8,7,5,'T').dot(3,7,'r').dot(12,7,'r');
  g.rect(4,13,2,2,'t').rect(10,13,2,2,'t').line(12,12,14,10,'t').dot(14,9,'t');
  g.rect(4,3,8,4,'s').rect(5,2,6,1,'h').rect(2,6,12,1,'s').rect(5,3,6,1,'h').rect(7,1,2,1,'d');
  g.dot(5,9,'o').dot(10,9,'o').dot(8,11,'r').dot(7,12,'d').dot(9,12,'d');
});
draw('pet-mosskin', g => {
  g.poly([[4,5],[11,4],[14,8],[13,12],[10,14],[4,13],[1,10],[2,7]],'G');
  g.poly([[5,5],[10,5],[12,8],[11,12],[5,12],[3,9]],'g');
  g.rect(4,6,3,2,'l').dot(3,9,'l').dot(12,10,'l').line(7,4,8,1,'G');
  g.poly([[8,3],[10,0],[14,1],[11,4]],'g').dot(11,1,'l');
  g.dot(5,9,'o').dot(10,9,'o').dot(8,11,'d').rect(4,13,2,2,'d').rect(10,13,2,2,'d');
});
draw('pet-mimipup', g => {
  g.rect(3,6,10,7,'d').rect(4,7,8,5,'t').rect(3,4,10,4,'d').rect(4,4,8,2,'y');
  g.rect(3,2,2,4,'d').rect(11,2,2,4,'d').rect(4,3,1,2,'r').rect(11,3,1,2,'r');
  g.rect(3,6,10,1,'y').rect(7,5,2,3,'y').dot(7,6,'d').rect(5,8,6,3,'w');
  g.dot(5,8,'o').dot(10,8,'o').rect(7,10,2,1,'d').dot(8,11,'r');
  g.rect(3,13,3,2,'d').rect(10,13,3,2,'d').line(13,11,15,8,'d').dot(4,7,'Y');
});
draw('pet-ember', g => {
  g.poly([[4,4],[8,3],[11,6],[10,9],[11,12],[9,14],[4,13],[3,9],[1,8],[3,7]],'r');
  g.rect(5,8,4,5,'t').rect(6,9,2,3,'Y').dot(4,6,'w').dot(8,6,'w').dot(4,7,'o').dot(8,7,'o');
  g.line(10,12,13,11,'r').line(13,11,14,8,'r');
  g.poly([[13,8],[12,5],[14,6],[14,2],[15,5],[15,8]],'y').dot(14,7,'Y');
  g.rect(2,13,3,2,'R').rect(9,13,3,2,'R').dot(6,1,'r').dot(7,2,'r').dot(6,9,'d');
});
draw('pet-griffy', g => {
  g.poly([[5,4],[5,1],[7,3],[10,1],[11,5],[12,8],[11,13],[4,13],[3,9]],'y');
  g.rect(4,5,8,4,'Y').dot(5,6,'o').dot(10,6,'o').rect(7,8,2,2,'d');
  g.poly([[3,8],[0,6],[1,11],[5,12]],'h').line(1,8,4,11,'w');
  g.poly([[12,8],[15,6],[14,11],[10,12]],'h').line(14,8,11,11,'w');
  g.rect(6,10,3,3,'w').rect(4,13,2,2,'d').rect(10,13,2,2,'d').dot(8,11,'y');
});
draw('pet-nameless', g => {
  g.poly([[3,6],[3,2],[6,4],[10,4],[13,1],[13,7],[14,10],[12,13],[9,14],[4,13],[1,10]],'P');
  g.poly([[5,5],[10,5],[12,8],[11,12],[5,12],[3,9]],'p');
  g.rect(5,8,2,2,'w').rect(10,8,2,2,'w').dot(6,8,'b').dot(10,8,'b');
  g.dot(4,6,'L').rect(4,13,2,2,'P').rect(10,13,2,2,'P').dot(8,11,'P');
});
// Interface symbols: quiet flat fields with a single deliberately placed highlight.
draw('pets', g => { g.poly([[3,2],[6,5],[10,5],[13,2],[13,9],[11,13],[5,13],[2,9]],'w'); g.dot(4,4,'t').dot(12,4,'t').dot(5,8,'o').dot(10,8,'o').rect(7,10,2,1,'r').dot(8,12,'d'); });
draw('skills', g => { g.poly([[7,1],[10,5],[14,7],[10,10],[8,15],[5,10],[1,8],[5,5]],'P').poly([[7,3],[10,7],[8,12],[5,8]],'p').rect(7,6,2,3,'y').dot(7,6,'w'); });
draw('map', g => { g.poly([[1,3],[5,1],[10,3],[14,1],[14,13],[10,15],[5,13],[1,15]],'d').poly([[2,4],[5,2],[10,4],[13,2],[13,12],[10,14],[5,12],[2,14]],'w'); g.line(5,3,5,11,'h').line(10,5,10,13,'h').line(3,10,8,6,'g').line(8,6,11,8,'g').dot(8,5,'r'); });
draw('smith', g => { g.rect(3,4,12,3,'s').rect(1,4,4,1,'h').rect(1,5,6,2,'h').rect(6,7,5,3,'s').rect(7,9,3,3,'s').rect(4,12,9,2,'s').rect(4,12,8,1,'h').dot(12,5,'w'); });
draw('titles', g => { g.poly([[3,2],[5,5],[8,2],[10,5],[13,2],[12,8],[10,10],[5,10],[3,8]],'y'); g.line(4,7,11,7,'Y').rect(7,10,2,2,'y').rect(4,12,8,2,'y').dot(7,5,'b'); });
draw('rebirth', g => { g.line(5,2,10,2,'p').line(10,2,13,5,'p').line(13,5,13,8,'p').line(2,7,2,10,'p').line(2,10,5,13,'p').line(5,13,10,13,'p'); g.line(4,3,2,5,'p').line(11,12,13,10,'p').poly([[10,6],[15,6],[13,10]],'p').poly([[0,7],[5,7],[2,3]],'p').dot(6,2,'L').dot(5,13,'L'); });
draw('settings', g => { g.rect(6,1,4,14,'s').rect(1,6,14,4,'s').rect(3,3,10,10,'s'); g.rect(5,4,6,8,'h').rect(4,5,8,6,'h').rect(6,6,4,4,'o').dot(5,5,'w').dot(10,11,'b'); });
draw('bag', g => { g.rect(5,1,6,1,'d').rect(4,2,1,3,'d').rect(11,2,1,3,'d').rect(3,5,10,9,'d').rect(4,6,8,7,'t').rect(4,6,8,3,'y').rect(7,8,2,3,'d').dot(7,8,'Y').line(4,11,4,12,'T'); });
draw('ap', g => { g.poly([[6,1],[10,1],[14,5],[14,10],[10,14],[5,14],[1,10],[1,5]],'P').poly([[6,2],[10,2],[13,5],[13,10],[10,13],[5,13],[2,10],[2,5]],'p'); g.rect(4,4,3,1,'L').dot(3,5,'w').line(10,10,8,12,'P'); });
// Race portraits preserve B's readable faces and small costumes.
const face = (g: Grid, hair: string, tunic: string) => {
  g.rect(5,2,6,1,hair).rect(3,3,10,4,hair).rect(4,6,8,5,'T').rect(4,6,2,1,hair);
  g.dot(6,8,'o').dot(10,8,'o').rect(7,10,2,1,'t').rect(5,11,6,4,tunic).rect(7,13,2,1,'y');
};
draw('human', g => { face(g,'d','b'); g.rect(4,3,5,1,'t').dot(4,7,'t').dot(11,10,'t'); });
draw('elf', g => { face(g,'g','G'); g.line(2,6,4,8,'T').line(13,6,11,8,'T').rect(4,3,6,1,'l').dot(9,2,'y'); });
draw('dwarf', g => { face(g,'s','s'); g.rect(4,3,8,2,'h').rect(5,10,6,3,'d').rect(6,13,4,2,'d').dot(6,11,'t').dot(9,12,'t'); });
draw('giant', g => { face(g,'d','G'); g.rect(2,11,3,4,'G').rect(11,11,3,4,'G').rect(5,2,6,2,'d').dot(5,7,'t').dot(11,7,'t'); });
draw('undead', g => { g.rect(5,2,6,1,'h').rect(3,3,10,8,'w').rect(4,9,8,3,'h').rect(5,11,6,4,'P').rect(5,6,2,3,'o').rect(10,6,2,3,'o').dot(8,9,'s').dot(6,11,'w').dot(10,11,'w'); });
// Attributes.
draw('str', g => { g.poly([[4,3],[6,2],[12,3],[13,7],[11,9],[11,12],[6,14],[2,12],[2,8],[4,7]],'d').poly([[5,3],[11,4],[12,7],[9,9],[10,11],[6,13],[3,11],[3,8],[5,8]],'t'); g.line(6,4,6,7,'T').line(9,4,9,7,'d').rect(3,11,3,1,'T'); });
draw('dex', g => { g.line(4,2,8,4,'G').line(8,4,11,8,'G').line(11,8,8,12,'G').line(8,12,4,14,'G').line(4,2,4,14,'t'); g.line(1,10,14,5,'g').dot(12,5,'w').dot(14,4,'g').dot(14,6,'g'); });
draw('int', g => { g.rect(1,3,6,10,'s').rect(8,3,6,10,'s').rect(2,2,5,10,'w').rect(8,2,5,10,'w').rect(7,3,1,10,'d').line(3,5,5,5,'t').line(3,7,5,7,'t').line(9,5,11,5,'g').line(9,7,11,7,'g').dot(10,9,'g'); });
draw('will', g => { g.poly([[7,1],[13,7],[8,13],[2,7]],'P').poly([[7,2],[11,7],[8,11],[4,7]],'p'); g.line(7,3,5,6,'L').dot(5,6,'w').rect(7,12,2,2,'y').rect(5,14,6,1,'d'); });
draw('luk', g => { g.rect(3,2,4,4,'g').rect(9,2,4,4,'g').rect(2,7,5,4,'g').rect(9,7,5,4,'g').rect(6,5,4,5,'G'); g.dot(4,3,'l').dot(10,3,'l').dot(3,8,'l').dot(10,8,'l').line(8,9,7,14,'G').line(7,14,5,15,'G'); });
// Skills share materials with equipment, with distinct silhouettes and a few controlled accents.
draw('sk-smash', g => { sword(g); g.line(1,3,4,5,'r').line(10,11,13,13,'r').line(1,6,2,6,'y').dot(12,10,'y'); });
draw('sk-defense', shield);
draw('sk-counter', g => { g.line(3,3,12,12,'s').line(4,3,12,11,'h').line(10,1,13,4,'r').line(13,4,13,8,'r').line(13,8,9,8,'r').dot(9,7,'r').dot(9,9,'r').line(2,10,6,14,'y').line(3,12,1,14,'d'); });
draw('sk-firebolt', g => { g.poly([[8,0],[8,5],[11,3],[11,7],[14,9],[13,13],[10,15],[5,15],[2,12],[2,9],[5,5],[5,8]],'r').poly([[8,5],[9,9],[11,8],[12,12],[9,14],[5,13],[4,10],[6,8],[6,11]],'y'); g.poly([[8,9],[10,12],[8,14],[6,12]],'Y').dot(8,12,'w'); });
draw('sk-icebolt', g => { g.line(7,1,7,14,'b').line(1,7,14,7,'b').line(2,2,12,12,'b').line(2,12,12,2,'b').line(6,3,7,4,'h').line(8,3,7,4,'h').dot(12,6,'h').dot(12,8,'h').dot(3,10,'h').dot(4,11,'h').dot(7,7,'w'); });
draw('sk-lightning', g => { g.poly([[9,1],[13,1],[8,7],[13,7],[4,15],[6,9],[2,9]],'y'); g.line(9,2,6,7,'Y').dot(6,7,'w').line(8,10,5,13,'d'); });
draw('sk-mastery', g => { sword(g); g.dot(2,1,'y').dot(1,2,'y').dot(3,2,'y').dot(2,3,'y').dot(13,12,'y').dot(12,13,'y').dot(14,13,'y').dot(13,14,'y'); });
draw('sk-lightArms', g => { g.line(6,1,2,8,'h').line(7,1,3,8,'w').line(1,8,5,10,'y').line(3,10,1,14,'d').line(14,2,10,9,'h').line(15,2,11,9,'w').line(9,9,13,11,'y').line(11,11,9,15,'d'); });
draw('sk-mediumArms', sword);
draw('sk-heavyArms', g => { g.rect(4,2,10,7,'s').rect(5,2,8,5,'h').rect(5,3,1,3,'w').rect(10,7,3,2,'b').rect(8,9,2,6,'d').dot(8,11,'t').dot(8,14,'y'); });
draw('sk-tough', g => { shield(g); g.rect(6,7,3,2,'y').rect(7,6,1,4,'y'); });
draw('sk-meditation', g => { g.rect(6,2,4,4,'p').dot(6,2,'L').rect(5,7,6,4,'p').line(5,8,2,11,'p').line(10,8,13,11,'p').line(3,12,7,13,'p').line(12,12,8,13,'p').rect(3,14,10,1,'P').dot(7,8,'y'); });
draw('sk-fortune', g => { g.poly([[5,2],[11,2],[14,5],[14,10],[11,13],[5,13],[2,10],[2,5]],'d').poly([[5,3],[11,3],[13,5],[13,10],[11,12],[5,12],[3,10],[3,5]],'y'); g.line(4,5,4,8,'Y').rect(7,4,2,7,'d').rect(5,6,6,1,'d').dot(6,10,'Y'); });
draw('sk-insight', g => { g.poly([[1,8],[4,4],[8,3],[12,4],[15,8],[12,11],[8,12],[4,11]],'P').poly([[2,8],[5,5],[10,5],[13,8],[10,10],[5,10]],'w'); g.rect(6,5,4,6,'b').rect(7,6,2,4,'o').dot(6,6,'w'); });
// Map emblems are tiny vignettes rather than resampled scenery.
draw('area-meadow', g => { g.rect(1,12,14,3,'G').rect(2,11,12,2,'g').line(4,7,5,12,'g').line(5,9,2,7,'g').line(9,9,10,12,'g').line(11,8,10,10,'g').dot(12,3,'y').dot(11,2,'Y').dot(13,2,'Y'); });
draw('area-forest', g => { g.rect(7,10,2,5,'d').poly([[7,0],[12,6],[10,6],[15,12],[1,12],[5,7],[3,7]],'G'); g.line(7,2,5,5,'g').line(5,8,3,10,'g').line(7,7,10,7,'g').dot(8,12,'t'); });
draw('area-labyrinth', g => { g.rect(1,1,14,14,'s').rect(2,2,12,12,'h').line(4,2,4,10,'s').line(4,10,9,10,'s').line(6,5,12,5,'s').line(10,5,10,12,'s').line(2,12,7,12,'s').dot(12,11,'y'); });
draw('area-mine', g => { g.poly([[4,2],[11,1],[15,8],[14,14],[1,14],[1,7]],'s').poly([[6,5],[10,5],[12,9],[12,14],[4,14],[4,9]],'o'); g.line(3,8,3,12,'h').rect(6,10,2,4,'p').rect(8,8,2,6,'L').dot(8,8,'w'); });
draw('area-fen', g => { g.rect(1,10,14,4,'b').rect(3,12,9,1,'h').line(4,3,5,11,'G').line(10,1,10,10,'G').rect(3,3,2,3,'y').rect(9,2,2,4,'d').rect(7,10,4,2,'g').dot(12,13,'G'); });
draw('area-ruins', g => { g.rect(2,3,4,11,'s').rect(10,6,4,8,'s').rect(3,4,1,8,'h').rect(11,7,1,5,'h').rect(1,2,6,2,'h').rect(9,5,6,2,'h').rect(1,13,14,2,'s').line(6,2,11,2,'h').dot(7,1,'w'); });
draw('area-nest', g => { g.line(1,11,5,14,'d').line(5,14,12,14,'d').line(12,14,15,10,'d').line(2,10,12,13,'t').line(3,13,13,11,'t'); g.rect(6,8,3,5,'Y').dot(7,7,'Y').rect(10,6,3,6,'h').dot(11,5,'h').dot(11,9,'s').line(3,9,1,7,'d'); });
draw('area-abyss', g => { g.poly([[5,1],[11,1],[14,5],[14,11],[10,15],[5,14],[1,10],[1,5]],'P').poly([[6,3],[10,3],[12,6],[12,10],[9,13],[5,11],[3,8]],'p').poly([[6,5],[10,6],[10,10],[7,11],[5,8]],'o'); g.dot(6,7,'w').dot(9,7,'w').dot(3,5,'L'); });
draw('arrow', g => { g.rect(6,2,3,7,'s').poly([[2,8],[13,8],[7,14]],'s').rect(6,3,1,6,'h'); });
draw('star', g => { g.poly([[7,0],[10,5],[15,6],[11,10],[12,15],[7,12],[2,15],[3,10],[0,6],[5,5]],'y'); g.line(7,2,6,6,'Y').line(3,7,6,7,'Y'); });
draw('heart', g => { g.poly([[3,2],[5,2],[8,5],[11,2],[13,2],[15,4],[15,7],[13,10],[8,15],[2,10],[0,7],[0,4]],'r'); g.line(2,4,4,3,'T').dot(2,5,'w').line(11,10,8,13,'R'); });
draw('hazard', g => { g.poly([[7,1],[15,14],[0,14]],'y').rect(7,5,1,5,'o').dot(7,12,'o').line(4,7,2,12,'Y'); });
draw('unknown', g => { g.rect(5,2,6,1,'p').rect(3,3,2,3,'p').rect(10,3,2,4,'p').line(10,7,7,9,'p').rect(7,9,2,2,'p').rect(7,13,2,2,'p').dot(5,2,'L'); });
export const ICON_NAMES = Object.keys(art);
export function pixels(name: string): Pixel[] { return art[name] || art.unknown; }
export function pixelMarkup(name: string): string {
  return pixels(name).map(p => `<rect x="${p.x}" y="${p.y}" width="1" height="1" fill="${p.color}"/>`).join('');
}
export function icon(name: string, cls = 'gi'): string {
  return `<svg class="${cls}" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true" data-icon="${name}">${pixelMarkup(name)}</svg>`;
}
