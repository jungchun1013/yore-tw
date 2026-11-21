// ?puppet=<name> : review page for a detachable puppet: idle, walk, the parts pulled apart, and a
// button that saves one cycle of a motion as a frame strip (PNG) for making an animated image.
import { Puppet } from './puppet';

export async function puppetPreview(canvas: HTMLCanvasElement, name: string): Promise<void> {
  const p = await Puppet.load(name);
  const c = canvas.getContext('2d')!;
  const frozen = new URLSearchParams(location.search).get('t');
  const label = (s: string, x: number, y: number): void => { c.font = '700 15px system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#6a4632'; c.fillText(s, x, y); };

  const btn = document.createElement('button');
  btn.textContent = '下載走路影格（12 格）';
  btn.style.cssText = 'position:fixed;right:16px;bottom:16px;padding:10px 16px;font:700 15px system-ui;background:#fbf3e2;border:1px solid #b89a78;border-radius:8px;cursor:pointer';
  btn.onclick = () => {
    const n = 12, fw = 160, fh = 200, strip = document.createElement('canvas');
    strip.width = fw * n; strip.height = fh;
    const s = strip.getContext('2d')!;
    const len = p.clipLength('walk');
    for (let i = 0; i < n; i++) p.draw(s, fw * i + fw / 2, fh - 12, 3, 1, (i / n) * len, 'walk');
    const a = document.createElement('a'); a.download = `${name}-walk-${n}f.png`; a.href = strip.toDataURL(); a.click();
  };
  document.body.append(btn);

  const frame = (now: number): void => {
    const t = frozen !== null ? Number(frozen) : now / 1000;
    const dpr = Math.min(window.devicePixelRatio || 1, 2), w = window.innerWidth, h = window.innerHeight;
    if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = '#f1e6cf'; c.fillRect(0, 0, w, h);
    const y = h * 0.62;
    p.draw(c, w * 0.17, y, 5, 1, t, 'idle'); label('待機', w * 0.17, y + 28);
    p.draw(c, w * 0.42, y, 5, 1, t, 'walk'); label('走路', w * 0.42, y + 28);
    p.draw(c, w * 0.67, y, 5, 1, 0, 'idle', 1.2); label('零件分開', w * 0.67, y + 28);
    for (let i = 0; i < 4; i++) p.draw(c, w * 0.84 + i * 34, y, 1, i % 2 ? -1 : 1, t + i * 0.2, 'walk');
    label('遊戲大小', w * 0.84 + 51, y + 28);
    if (p.rig.parts.length) label(`${name}：${p.rig.parts.length} 個零件`, w / 2, 40);
    if (frozen === null) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
