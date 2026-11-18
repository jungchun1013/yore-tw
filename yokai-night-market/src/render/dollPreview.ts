// ?doll : a review page for the jointed paper dolls, large, in several poses, plus an exploded view.
import { Doll } from './doll';
import { CHOCHIN, MIKO } from './dolls';
import { groundTile } from './sprites';

export function dollPreview(canvas: HTMLCanvasElement): void {
  const big = { miko: new Doll(MIKO, 7), chochin: new Doll(CHOCHIN, 7) };
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
    const tile = groundTile('stone');
    for (let x = 0; x < w; x += 256) for (let y = 0; y < h; y += 256) c.drawImage(tile, x, y, 256, 256);

    const S = 3.9, y1 = 320;
    big.miko.draw(c, 130, y1, S, 1, t, false); label('站立', 130, y1 + 30);
    for (let i = 0; i < 3; i++) big.miko.draw(c, 370 + i * 200, y1, S, 1, t + i * 0.11, true);
    label('走路（三個相位）', 570, y1 + 30);
    big.miko.draw(c, 1000, y1, S, -1, t, true); label('轉向', 1000, y1 + 30);

    const y2 = 660;
    big.miko.draw(c, 110, y2, S, 1, 0.6, false, 1.8); label('零件分解：每片都是獨立的紙', 230, y2 + 30);
    big.chochin.draw(c, 560, y2, S, 1, t, true); big.chochin.draw(c, 740, y2, S, 1, t + 0.3, true); label('提燈妖：一圈圈紙環疊起來', 650, y2 + 30);
    big.chochin.draw(c, 900, y2, S, 1, 0.3, true, 2); label('分解', 960, y2 + 30);
    for (let i = 0; i < 4; i++) big.miko.draw(c, 1080 + i * 44, y2 - 100, 1.25, i % 2 ? -1 : 1, t + i * 0.2, true);
    for (let i = 0; i < 4; i++) big.chochin.draw(c, 1080 + i * 44, y2 - 30, 1.25, 1, t + i * 0.2, true);
    label('遊戲中的實際大小', 1146, y2 + 30);
    if (frozen === null) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
