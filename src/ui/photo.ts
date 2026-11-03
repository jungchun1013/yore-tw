import type { DiaryEntry } from '../core/types';
import { CAT_BY_ID } from '../content/cats';
import { SPECIES_BY_ID } from '../content/customers';
import { catCanvas, animalCanvas, emoteCanvas, propCanvas, starCanvas, furnitureCanvas } from '../game/sprites/pixel';
import { FURNITURE_BY_ID } from '../content/furniture';
import { UI } from '../content/palette';
import type { DiaryBg, DiaryKind } from '../core/types';

const px = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

/** Little pixel scenes: inside the shop, the counter, the shop front, a park, the roof at sunset, a back alley, the night sky. */
function paintBackground(ctx: CanvasRenderingContext2D, W: number, H: number, bg: DiaryBg, kind: DiaryKind): void {
  void kind;
  switch (bg) {
    case 'window':
      px(ctx, 0, 0, W, H, UI.wall); px(ctx, 0, 30, W, H - 30, UI.floor);
      px(ctx, 16, 4, 32, 22, '#6E5247'); px(ctx, 18, 6, 28, 18, '#C4DEF5'); px(ctx, 20, 8, 10, 6, '#FFFFFF'); px(ctx, 31, 6, 2, 18, '#6E5247'); // a window with sky and a cloud
      break;
    case 'kitchen':
    case 'oven':
    case 'cushion': case 'bed': case 'cathouse': case 'tent': case 'fish': case 'cattree': case 'scratcher': case 'hangball':
      px(ctx, 0, 0, W, H, UI.floor);
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      for (let y = 0; y < H; y += 8) for (let x = ((y / 8) % 2) * 8; x < W; x += 16) ctx.fillRect(x, y, 8, 8);
      px(ctx, 0, 0, W, 6, UI.wall); px(ctx, 0, 6, W, 2, '#E8C9B3');
      break;
    case 'counter':
      px(ctx, 0, 0, W, H, UI.floor);
      px(ctx, 0, 30, W, 9, '#F7E8DC'); px(ctx, 0, 39, W, 5, '#DCBDA3'); px(ctx, 0, 29, W, 1, '#5A4038');
      for (let i = 0; i < 5; i++) { px(ctx, 6 + i * 12, 32, 5, 4, ['#F9CBD6', '#BFE8D4', '#FBECA6', '#C4DEF5', '#DCCBF2'][i]); }
      break;
    case 'front':
      px(ctx, 0, 0, W, H, '#C4DEF5');                       // sky
      px(ctx, 0, 0, W, 10, '#D6E8F8');
      px(ctx, 0, 12, W, 20, '#FBEFE6');                      // shop wall
      for (let x = 0; x < W; x += 8) px(ctx, x, 12, 4, 5, (x / 8) % 2 ? '#F28CA3' : '#FFF7F0'); // awning stripes
      px(ctx, 0, 17, W, 1, '#5A4038');
      px(ctx, 40, 20, 12, 12, '#FAD6BC'); px(ctx, 44, 23, 4, 4, '#C4DEF5'); px(ctx, 39, 19, 14, 1, '#5A4038'); // door
      px(ctx, 6, 20, 16, 8, '#C4DEF5'); px(ctx, 5, 19, 18, 1, '#5A4038');                                         // window
      px(ctx, 0, 32, W, H - 32, '#D9CFC7'); for (let x = 0; x < W; x += 10) px(ctx, x, 36, 6, 1, '#C7BBB1');       // pavement
      break;
    case 'park':
      px(ctx, 0, 0, W, H, '#CFE7F7'); px(ctx, 6, 5, 14, 5, '#FFFFFF'); px(ctx, 40, 8, 12, 4, '#FFFFFF');       // sky + clouds
      px(ctx, 0, 22, W, H - 22, '#C9E3A5'); px(ctx, 0, 22, W, 2, '#AFD38A');                                  // grass
      px(ctx, 50, 14, 4, 12, '#8E5B4A'); px(ctx, 44, 6, 16, 11, '#7FBF6A'); px(ctx, 47, 3, 10, 5, '#8FCB78'); // tree
      for (let i = 0; i < 6; i++) px(ctx, (i * 11 + 3) % W, 30 + (i % 3) * 4, 2, 2, i % 2 ? '#F28CA3' : '#FBECA6'); // flowers
      break;
    case 'roof':
      px(ctx, 0, 0, W, H, '#F7B98A'); px(ctx, 0, 0, W, 8, '#E88AA0'); px(ctx, 0, 8, W, 8, '#F4A990');         // sunset
      px(ctx, 48, 10, 10, 10, '#FFE08A');                                                                       // sun
      px(ctx, 0, 24, W, H - 24, '#B9A9A0'); px(ctx, 0, 24, W, 2, '#9C8A82');                                   // roof
      for (let x = 2; x < W; x += 8) px(ctx, x, 18, 1, 6, '#6E5247'); px(ctx, 0, 18, W, 1, '#6E5247');        // railing
      break;
    case 'alley':
      px(ctx, 0, 0, W, H, '#C9B8AC');
      for (let y = 0; y < 26; y += 5) for (let x = ((y / 5) % 2) * 5; x < W; x += 10) px(ctx, x, y, 9, 4, '#D9C7B8'); // bricks
      px(ctx, 0, 26, W, H - 26, '#A89A91');                                                                     // ground
      px(ctx, 4, 14, 14, 12, '#DEBB93'); px(ctx, 4, 14, 14, 1, '#5A4038'); px(ctx, 4, 18, 14, 1, '#C9A27E');   // boxes
      px(ctx, 48, 18, 10, 8, '#DEBB93'); px(ctx, 48, 18, 10, 1, '#5A4038');
      break;
    case 'night':
      px(ctx, 0, 0, W, H, '#3E3A5E'); px(ctx, 0, 30, W, H - 30, '#2E2B47');
      ctx.fillStyle = '#FFF3B0'; for (let i = 0; i < 14; i++) ctx.fillRect((i * 37 + 5) % W, (i * 23) % 26, 1, 1);
      px(ctx, 50, 4, 7, 7, '#FFF3B0'); px(ctx, 52, 4, 5, 5, '#3E3A5E');                                         // crescent moon
      break;
  }
}

const cache: Record<string, string> = {};

function subject(id: string, happy = true, asleep = false): HTMLCanvasElement {
  const def = CAT_BY_ID[id];
  if (def) return catCanvas(def.coat, def.accessory, asleep ? 'sleep' : happy ? 'happy' : 'open');
  const sp = SPECIES_BY_ID[id];
  if (sp) return animalCanvas(sp, sp.coats[0], happy ? 'happy' : 'open');
  return catCanvas('cream', 'none', happy ? 'happy' : 'open');
}

/** A tiny "photo" (64×44, shown ×3) composed from the sprites involved in a diary entry. */
export function renderPhoto(e: DiaryEntry): string {
  const key = `${e.kind}:${e.bg ?? ''}:${e.cats.join(',')}`;
  if (cache[key]) return cache[key];
  const W = 64, H = 44;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  paintBackground(ctx, W, H, e.bg ?? (e.kind === 'star' ? 'night' : 'kitchen'), e.kind);
  if (e.kind === 'nap' && (e.bg ?? 'oven') === 'oven') ctx.drawImage(propCanvas('oven', 1), 44, 2, 18, 18);
  const cats = e.cats.length ? e.cats : ['shopcat'];
  const happy = e.kind !== 'nap';
  const furn = e.bg && FURNITURE_BY_ID[e.bg] ? FURNITURE_BY_ID[e.bg] : null;
  if (furn && cats.length) {
    // the exact piece the cat used, with the cat posed on / in / beside it
    const fimg = furnitureCanvas(furn.sprite);
    const fx = Math.round(W / 2 - fimg.width / 2), fy = H - 4 - fimg.height;
    const cat = subject(cats[0], e.kind !== 'nap', e.kind === 'nap');
    const drawCat = (x: number, y: number, lying: boolean) => { if (lying) { ctx.save(); ctx.translate(x + 12, y + 12); ctx.rotate(Math.PI / 2); ctx.drawImage(cat, -12, -12); ctx.restore(); } else ctx.drawImage(cat, x, y); };
    if (furn.inside) { drawCat(fx + fimg.width / 2 - 12, fy + fimg.height - 22, false); ctx.drawImage(fimg, fx, fy); }
    else if (furn.id === 'cattree') { ctx.drawImage(fimg, fx, fy); drawCat(fx + fimg.width / 2 - 12, fy - 14, false); }
    else if (furn.id === 'scratcher') { ctx.drawImage(fimg, fx, fy); drawCat(fx + fimg.width + 2, fy + fimg.height - 22, false); ctx.drawImage(emoteCanvas('scratch'), fx + 2, fy + 8); }
    else if (furn.id === 'fishbowl') { ctx.drawImage(fimg, fx, fy); const def = CAT_BY_ID[cats[0]]; ctx.drawImage(def ? catCanvas(def.coat, def.accessory, 'back') : cat, fx + fimg.width / 2 - 12, fy + fimg.height - 14); }
    else if (furn.id === 'hangball') { ctx.drawImage(fimg, fx, fy); ctx.drawImage(furnitureCanvas('hangball_ball'), fx + 7, fy + 2); drawCat(fx + 4, fy + fimg.height - 20, false); }
    else { ctx.drawImage(fimg, fx, fy); drawCat(fx + fimg.width / 2 - 12, fy - 10 + (furn.id === 'fish' ? 4 : 0), e.kind === 'nap' && furn.id !== 'fish'); }
    if (e.kind === 'nap') ctx.drawImage(emoteCanvas('zzz'), fx + fimg.width / 2 + 6, Math.max(2, fy - 18));
    return (cache[key] = c.toDataURL());
  }
  if (e.bg === 'window' && cats.length) { const def = CAT_BY_ID[cats[0]]; ctx.drawImage(def ? catCanvas(def.coat, def.accessory, 'back') : subject(cats[0], false), 20, 18); return (cache[key] = c.toDataURL()); }
  cats.slice(0, 2).forEach((id, i) => {
    const img = subject(id, happy, e.kind === 'nap');
    const x = cats.length === 1 ? 20 : i === 0 ? 8 : 32;
    const y = e.kind === 'rest' ? 10 : 16;
    if (e.kind === 'nap' && i === 0) { ctx.save(); ctx.translate(x + 12, y + 12); ctx.rotate(Math.PI / 2); ctx.drawImage(img, -12, -12); ctx.restore(); }
    else ctx.drawImage(img, x, y);
  });
  const emote = e.kind === 'cuddle' ? 'heart' : e.kind === 'fight' ? 'puff' : e.kind === 'nap' ? 'zzz' : e.kind === 'bless' ? 'sparkle' : e.kind === 'timeskip' ? 'sparkle' : null;
  if (emote) ctx.drawImage(emoteCanvas(emote), cats.length === 1 ? 30 : 28, 8);
  if (e.kind === 'star') ctx.drawImage(starCanvas(), 48, 6, 10, 10);
  if (e.kind === 'rainbow') { ['#ff5f6d', '#ffb347', '#fff36b', '#7ee787', '#6fb3ff', '#c38cff'].forEach((c, i) => px(ctx, 0, 14 + i * 4, 30, 4, c)); }
  if (e.kind === 'bless') { ctx.fillStyle = 'rgba(255,245,200,0.55)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(26, 0, 12, H); }
  if (e.kind === 'timeskip') { ctx.fillStyle = 'rgba(196,222,245,0.45)'; ctx.fillRect(0, 0, W, H); }
  return (cache[key] = c.toDataURL());
}
