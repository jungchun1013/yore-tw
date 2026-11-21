// ?editor : arrange the street. Drag a building, tree or stall along the road; change its lane,
// size and facing; add or remove pieces; export the result as street.json.
// ?editor=<puppet> : move a puppet's joints and stacking order; export its rig.json.
// Work is kept in this browser (and shown in the game) until it is exported and committed.
import { SPRITE_ASSETS } from '../data/manifest';
import { Puppet } from './puppet';
import { type Lane, currentScene, enterScene, drawStreet, hasLocalStreet, itemAtPoint, panStreet, revertStreet, saveStreetLocal, setupStreet, street, toStreet, updateStreet } from './street';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> = {}, ...kids: (Node | string)[]): HTMLElementTagNameMap[K] {
  const e = Object.assign(document.createElement(tag), props); e.append(...kids); return e;
}
function download(name: string, text: string): void {
  const a = el('a', { download: name, href: URL.createObjectURL(new Blob([text], { type: 'application/json' })) }); a.click();
  void navigator.clipboard?.writeText(text).catch(() => undefined);
}
const PANEL = 'position:fixed;left:10px;top:10px;z-index:9;width:min(300px,calc(100vw - 20px));background:#fbf3e2;border:2px solid #4a2f28;border-radius:12px;padding:10px;font:500 14px "jf open huninn",system-ui,sans-serif;color:#4a2f28;display:flex;flex-direction:column;gap:8px';
const ROW = 'display:flex;gap:6px;align-items:center;flex-wrap:wrap';
const BTN = 'font:700 14px inherit;padding:5px 10px;border:1.5px solid #4a2f28;border-radius:8px;background:#fffaf0;color:#4a2f28;cursor:pointer';

export function streetEditor(canvas: HTMLCanvasElement, scene = 'street'): void {
  const c = canvas.getContext('2d')!;
  setupStreet('miko');
  if (scene !== 'street') enterScene(scene);
  let sel = -1, held = false, moved = false, dragItem = false, lastX = 0, grabDx = 0;
  const panel = el('div'); panel.style.cssText = PANEL; document.body.append(panel);

  const keys = SPRITE_ASSETS.filter((a) => ['building', 'decor', 'tree', 'fauna'].includes(a.layer)).map((a) => a.key);
  function refresh(): void {
    const it = street.items[sel];
    const add = el('select'); add.style.cssText = BTN;
    add.append(el('option', { value: '', textContent: '＋ 加入…' }), ...keys.map((k) => el('option', { value: k, textContent: `${SPRITE_ASSETS.find((a) => a.key === k)?.name ?? k}` })));
    add.onchange = () => { if (!add.value) return; street.items.push({ key: add.value, x: Math.round(toStreet(window.innerWidth / 2, 0)[0] / 10) * 10, lane: SPRITE_ASSETS.find((a) => a.key === add.value)?.layer === 'fauna' ? 'fauna' : 'build' }); sel = street.items.length - 1; changed(); };
    const btn = (label: string, on: () => void): HTMLButtonElement => { const b = el('button', { textContent: label, type: 'button' }); b.style.cssText = BTN; b.onclick = on; return b; };
    const row = (...k: (Node | string)[]): HTMLDivElement => { const r = el('div', {}, ...k); r.style.cssText = ROW; return r; };
    panel.replaceChildren(
      row(el('b', { textContent: currentScene() === 'street' ? '大街編輯器' : `場景編輯器：${currentScene()}` }), el('span', { textContent: hasLocalStreet() ? '（有未匯出的修改）' : '' })),
      row(add, btn(`匯出 ${currentScene()}.json`, () => download(`${currentScene()}.json`, JSON.stringify(street, null, 2) + '\n')), btn('還原', () => { revertStreet(); sel = -1; refresh(); })),
    );
    if (it) {
      const lane = el('select'); lane.style.cssText = BTN;
      for (const [v, name] of [['build', '建築'], ['decor', '裝飾'], ['across', '橫跨道路'], ['near', '路的近側'], ['front', '前景'], ['fauna', '動物']] as [Lane, string][]) lane.append(el('option', { value: v, textContent: name, selected: it.lane === v }));
      lane.onchange = () => { it.lane = lane.value as Lane; changed(); };
      panel.append(
        row(el('b', { textContent: SPRITE_ASSETS.find((a) => a.key === it.key)?.name ?? it.key }), el('span', { textContent: `x ${it.x}` })),
        row('圖層', lane, btn('翻面', () => { it.flip = !it.flip; changed(); })),
        row('大小', btn('－', () => { it.scale = Math.max(0.4, Math.round(((it.scale ?? 1) - 0.1) * 10) / 10); changed(); }), el('span', { textContent: String(it.scale ?? 1) }), btn('＋', () => { it.scale = Math.round(((it.scale ?? 1) + 0.1) * 10) / 10; changed(); }),
          btn('← 10', () => { it.x -= 10; changed(); }), btn('10 →', () => { it.x += 10; changed(); })),
        row(btn('移到最上層', () => { street.items.push(...street.items.splice(sel, 1)); sel = street.items.length - 1; changed(); }), btn('刪除', () => { street.items.splice(sel, 1); sel = -1; changed(); })),
      );
    } else panel.append(el('div', { textContent: '點選街上的物件；拖曳可左右移動，拖空白處捲動。' }));
  }
  function changed(): void { saveStreetLocal(); refresh(); }
  refresh();

  canvas.addEventListener('pointerdown', (e) => {
    held = true; moved = false; lastX = e.clientX;
    const [x, y] = toStreet(e.clientX, e.clientY), hit = itemAtPoint(x, y);
    dragItem = hit >= 0 && hit === sel;
    if (dragItem) grabDx = street.items[sel].x - x;
  });
  window.addEventListener('pointermove', (e) => {
    if (!held) return;
    if (Math.abs(e.clientX - lastX) > 3) moved = true;
    if (dragItem) { street.items[sel].x = Math.round((toStreet(e.clientX, e.clientY)[0] + grabDx) / 10) * 10; }
    else if (moved) { panStreet(e.clientX - lastX); lastX = e.clientX; }
  });
  window.addEventListener('pointerup', (e) => {
    if (!held) return; held = false;
    if (dragItem && moved) { changed(); return; }
    if (!moved) { const [x, y] = toStreet(e.clientX, e.clientY); sel = itemAtPoint(x, y); refresh(); }
  });

  let last = performance.now();
  const frame = (now: number): void => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), w = window.innerWidth, h = window.innerHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    updateStreet(Math.min(0.1, (now - last) / 1000)); last = now;
    panStreet(0);
    drawStreet(c, { w, h, dpr }, { select: sel >= 0 ? sel : undefined });
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

export async function puppetEditor(canvas: HTMLCanvasElement, name: string): Promise<void> {
  const p = await Puppet.load(name);
  const c = canvas.getContext('2d')!;
  let sel = 0, clip = 'idle', held = false;
  const panel = el('div'); panel.style.cssText = PANEL; document.body.append(panel);
  const SIZE = 6;
  const origin = (): [number, number] => [window.innerWidth * 0.62, window.innerHeight * 0.82];
  function refresh(): void {
    const btn = (label: string, on: () => void): HTMLButtonElement => { const b = el('button', { textContent: label, type: 'button' }); b.style.cssText = BTN; b.onclick = on; return b; };
    const row = (...k: (Node | string)[]): HTMLDivElement => { const r = el('div', {}, ...k); r.style.cssText = ROW; return r; };
    const part = p.rig.parts[sel];
    const parts = el('select'); parts.style.cssText = BTN;
    p.rig.parts.forEach((q, i) => parts.append(el('option', { value: String(i), textContent: `${q.id}（z ${q.z}）`, selected: i === sel })));
    parts.onchange = () => { sel = Number(parts.value); refresh(); };
    const clips = el('select'); clips.style.cssText = BTN;
    for (const n of ['—', ...p.clipNames()]) clips.append(el('option', { value: n, textContent: n === '—' ? '靜止' : n, selected: n === clip }));
    clips.onchange = () => { clip = clips.value; };
    panel.replaceChildren(
      row(el('b', { textContent: `紙偶編輯器：${name}` })),
      row('零件', parts), row('動作', clips),
      row(el('span', { textContent: `關節 ${part.pivot[0]}, ${part.pivot[1]}` }), btn('上移一層', () => { part.z = Math.round((part.z + 0.5) * 10) / 10; p.resort(); refresh(); }), btn('下移一層', () => { part.z = Math.round((part.z - 0.5) * 10) / 10; p.resort(); refresh(); })),
      row(btn('匯出 rig.json', () => download('rig.json', JSON.stringify({ ...p.rig, clips: undefined }, null, 1) + '\n'))),
      el('div', { textContent: '在偶上按住拖曳，可移動選取零件的關節點（紅點）。' }),
    );
  }
  refresh();
  const setPivot = (e: PointerEvent): void => {
    const [ox, oy] = origin(), k = SIZE * p.rig.scale, part = p.rig.parts[sel], root = p.rig.parts.find((q) => !q.parent)!;
    // every part shares one canvas, so screen -> picture coordinates goes through the root pivot
    const px = Math.round((e.clientX - ox) / k + root.pivot[0]), py = Math.round((e.clientY - oy) / k + root.pivot[1]);
    part.pivot = [px, py]; if (part.parent) part.at = [px, py];
    refresh();
  };
  canvas.addEventListener('pointerdown', (e) => { held = true; setPivot(e); });
  window.addEventListener('pointermove', (e) => { if (held) setPivot(e); });
  window.addEventListener('pointerup', () => { held = false; });

  const frame = (now: number): void => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), w = window.innerWidth, h = window.innerHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = '#f1e6cf'; c.fillRect(0, 0, w, h);
    const [ox, oy] = origin();
    p.draw(c, ox, oy, SIZE, 1, clip === '—' ? 0 : now / 1000, clip === '—' ? '' : clip);
    const k = SIZE * p.rig.scale, part = p.rig.parts[sel], root = p.rig.parts.find((q) => !q.parent)!;
    if (clip === '—') {
      c.fillStyle = '#d8503a'; c.beginPath(); c.arc(ox + (part.pivot[0] - root.pivot[0]) * k, oy + (part.pivot[1] - root.pivot[1]) * k, 6, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
