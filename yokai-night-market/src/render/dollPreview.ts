// ?doll : review page for the paper-doll art. A small paper-theatre scene, an exploded view of
// how the pieces stack, and the dolls at the size they would have in play.
import { Doll } from './doll';
import { CHOCHIN, HILLS, HOUSE, MIKO, TREE } from './dolls';
import { paperFill } from './kit';

export function dollPreview(canvas: HTMLCanvasElement): void {
  const d = {
    miko: new Doll(MIKO, 6), chochin: new Doll(CHOCHIN, 6), tree: new Doll(TREE, 4), house: new Doll(HOUSE, 4), hills: new Doll(HILLS, 2),
  };
  const c = canvas.getContext('2d')!;
  const frozen = new URLSearchParams(location.search).get('t');
  const label = (text: string, x: number, y: number): void => {
    c.font = '700 15px system-ui, sans-serif'; c.fillStyle = '#6a4632'; c.textAlign = 'center'; c.fillText(text, x, y);
  };
  function frame(now: number): void {
    const t = frozen !== null ? Number(frozen) : now / 1000;
    const dpr = Math.min(window.devicePixelRatio || 1, 2), w = window.innerWidth, h = window.innerHeight;
    if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    c.setTransform(dpr, 0, 0, dpr, 0, 0);

    // paper theatre: sky, hills, a strip of ground, scenery and the dolls in front
    paperFill(c, 0, 0, w, 470, '#efe0c2');
    d.hills.draw(c, w / 2, 400, 2.2, 1, t, false);
    paperFill(c, 0, 400, w, 70, '#cdbb8e');
    d.tree.draw(c, 120, 440, 3.2, 1, t, false);
    d.house.draw(c, 400, 440, 3.3, 1, t, false);
    d.tree.draw(c, 640, 436, 2.5, -1, t + 1, false);
    d.miko.draw(c, 820, 450, 3.4, 1, t, true);
    d.chochin.draw(c, 990, 452, 3, 1, t, true);
    d.tree.draw(c, 1180, 440, 3, 1, t + 2, false);

    paperFill(c, 0, 470, w, h - 470, '#f1e4c8');
    const y2 = 735;
    d.miko.draw(c, 120, y2, 3.2, 1, 0.6, false, 2.2); label('零件分解', 190, y2 + 18);
    d.house.draw(c, 470, y2, 2.4, 1, 0.6, false, 2.4); label('房子也是一層層紙', 480, y2 + 18);
    for (let i = 0; i < 5; i++) d.miko.draw(c, 820 + i * 44, y2 - 70, 1.25, i % 2 ? -1 : 1, t + i * 0.2, true);
    for (let i = 0; i < 5; i++) d.chochin.draw(c, 820 + i * 44, y2 - 6, 1.25, 1, t + i * 0.2, true);
    label('遊戲中的實際大小', 908, y2 + 18);
    if (frozen === null) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
