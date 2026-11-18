// ?doll : review page for the paper-doll art, composed like the user's references: a cream
// paper stage with origami mountains, layered canopy trees, a shop front, and the dolls standing on it.
import { Doll } from './doll';
import { CHOCHIN, MAPLE, MIKO, MOUNTAINS, SAKURA, SHOP, STONE_LANTERN } from './dolls';
import { blossom, paperFill } from './kit';

export function dollPreview(canvas: HTMLCanvasElement): void {
  const d = {
    miko: new Doll(MIKO, 6), chochin: new Doll(CHOCHIN, 6), sakura: new Doll(SAKURA, 4), maple: new Doll(MAPLE, 4),
    shop: new Doll(SHOP, 4), stone: new Doll(STONE_LANTERN, 5), hills: new Doll(MOUNTAINS, 2),
  };
  const c = canvas.getContext('2d')!;
  const frozen = new URLSearchParams(location.search).get('t');
  const label = (text: string, x: number, y: number): void => {
    c.font = '700 15px system-ui, sans-serif'; c.fillStyle = '#7a4e36'; c.textAlign = 'center'; c.fillText(text, x, y);
  };
  function frame(now: number): void {
    const t = frozen !== null ? Number(frozen) : now / 1000;
    const dpr = Math.min(window.devicePixelRatio || 1, 2), w = window.innerWidth, h = window.innerHeight;
    if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    c.setTransform(dpr, 0, 0, dpr, 0, 0);

    paperFill(c, 0, 0, w, 300, '#f3e6c9');
    d.hills.draw(c, w / 2, 300, 1.6, 1, t, false);
    paperFill(c, 0, 300, w, 180, '#f7efdc');
    // a stone path across the stage
    c.fillStyle = '#ebdfc4';
    for (let x = 20; x < w; x += 56) { c.beginPath(); c.roundRect(x, 418 + ((x / 56) % 2) * 4, 46, 18, 6); c.fill(); }

    d.maple.draw(c, 110, 400, 2.6, 1, t, false);
    d.sakura.draw(c, 300, 392, 2.8, 1, t, false);
    d.shop.draw(c, 560, 402, 2.7, 1, t, false);
    d.stone.draw(c, 790, 412, 2.4, 1, t, false);
    d.sakura.draw(c, 1150, 398, 2.6, -1, t + 1, false);
    d.miko.draw(c, 900, 446, 3, 1, t, true);
    d.chochin.draw(c, 1030, 452, 2.6, 1, t, true);
    // falling petals, each a tiny cut blossom
    for (let i = 0; i < 18; i++) {
      const px = (i * 173 + t * 30) % w, py = (i * 97 + t * (24 + (i % 5) * 6)) % 420;
      c.save(); c.translate(px, py); c.rotate(t + i); c.scale(1.4, 1.4); blossom(c, 0, 0, 2.4, i % 3 ? '#f6c6cc' : '#eea3b0'); c.restore();
    }

    paperFill(c, 0, 480, w, h - 480, '#f1e4c8');
    const y2 = 735;
    d.miko.draw(c, 120, y2, 3.1, 1, 0.6, false, 2.2); label('零件分解', 190, y2 + 18);
    d.shop.draw(c, 500, y2, 2.1, 1, 0.6, false, 2.6); label('店面也是一層層紙', 500, y2 + 18);
    for (let i = 0; i < 5; i++) d.miko.draw(c, 840 + i * 44, y2 - 70, 1.25, i % 2 ? -1 : 1, t + i * 0.2, true);
    for (let i = 0; i < 5; i++) d.chochin.draw(c, 840 + i * 44, y2 - 6, 1.25, 1, t + i * 0.2, true);
    label('遊戲中的實際大小', 928, y2 + 18);
    if (frozen === null) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
