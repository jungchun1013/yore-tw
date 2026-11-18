import { atlasSprite } from './paperAtlas';
import { legacySprite } from './sprites';
import { hash, paperFill, setPaperStyle } from './kit';

export function atelier(canvas: HTMLCanvasElement): void {
  document.title = '百鬼夜市 · 紙上逢魔';
  document.body.classList.add('atelier');
  const ui = document.createElement('section'); ui.className = 'atelier-ui';
  ui.innerHTML = `<header><div><small>YOKAI NIGHT MARKET · ART STUDY 01</small><h1>紙上逢魔<span>百鬼夜市</span></h1></div><a href="./">進入新版遊戲 ↗</a></header>
  <footer><div class="atelier-caption"><small>KIRIE / WASHI / PAPER THEATER</small><p>剪出一條，妖怪出沒的小街。</p><span>紙纖維 · 疊層切邊 · 暖色接觸陰影</span></div><div class="atelier-controls"><div role="group" aria-label="美術版本"><button data-mode="paper" aria-pressed="true">Codex 紙藝版</button><button data-mode="split" aria-pressed="false">同景對照</button><button data-mode="claude" aria-pressed="false">Claude 素材</button></div><label hidden>對照分界 <input aria-label="對照分界" type="range" min="5" max="95" value="50"></label><a href="./?art=claude">原版遊戲素材 ↗</a></div></footer>`;
  document.body.append(ui);
  let mode = 'paper', boundary = .5;
  ui.querySelectorAll<HTMLButtonElement>('button').forEach(b => b.onclick = () => {
    mode = b.dataset.mode!; ui.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    ui.querySelector('label')!.hidden = mode !== 'split';
  });
  ui.querySelector('input')!.oninput = e => boundary = Number((e.target as HTMLInputElement).value) / 100;
  const c = canvas.getContext('2d')!;
  const drawObject = (key: string, old: string, x: number, y: number, height: number, paper: boolean, flip = 1) => {
    const s = paper ? atlasSprite(key) : legacySprite(old); if (!s) return;
    const k = height / s.h;
    c.save(); c.translate(x, y); c.scale(flip, 1);
    c.drawImage(s.c, -s.ox * k, -s.oy * k, s.w * k, s.h * k); c.restore();
  };
  function scene(paper: boolean, t: number): void {
    setPaperStyle('craft'); paperFill(c, 0, 0, 1400, 760, '#f1e7d2');
    // Real stacked silhouettes, with independent contact shadows; the ground stays quiet.
    const cut = (pts: number[], color: string, depth: number) => {
      c.save(); c.shadowColor = '#74503835'; c.shadowBlur = depth * 2; c.shadowOffsetX = depth; c.shadowOffsetY = depth * 2;
      c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); c.fillStyle = color; c.fill(); c.restore();
    };
    c.fillStyle = '#e4bb68'; c.beginPath(); c.arc(1025, 135, 63, 0, Math.PI * 2); c.fill();
    cut([0,300,110,220,240,230,365,160,510,255,680,200,820,266,1010,195,1160,250,1400,184,1400,550,0,550], '#c4cdb0', 2);
    cut([0,365,200,295,350,350,540,280,690,352,875,298,1110,355,1260,270,1400,315,1400,560,0,560], '#a7b997', 3);
    cut([0,445,180,420,400,445,590,423,810,450,1050,420,1400,442,1400,760,0,760], '#e7d6b3', 3);
    cut([180,760,390,560,690,475,835,475,600,595,500,760], '#f7edd9', 1);
    // Architecture occupies the back of the street; distinct foot anchors make its depth readable.
    drawObject('sakura','phoenix',165,510,315,paper);
    drawObject('torii','torii',1125,490,240,paper);
    drawObject('maple','phoenix',1280,540,325,paper,-1);
    drawObject('stall','stall',430,540,280,paper);
    drawObject('shrine','redgate',825,500,255,paper);
    drawObject('stoneLantern','andon',980,565,125,paper);
    drawObject('stoneLantern','andon',590,565,105,paper);
    // Foreground cut-paper petals, not full-screen noise.
    for (let i = 0; i < 30; i++) {
      const x = 70 + hash(i,2) * 1260, y = 525 + hash(i,3) * 190;
      c.save(); c.translate(x,y); c.rotate(hash(i,4)*6.28); c.fillStyle = i % 3 ? '#c4b27b' : '#d98275';
      c.beginPath(); c.ellipse(0,0,3.5,1.7,0,0,Math.PI*2); c.fill(); c.restore();
    }
    drawObject('fox','hero:unpei:0',710,624 + Math.sin(t*2)*2,141,paper);
    drawObject('miko','hero:miko:0',520,660 + Math.sin(t*2+1)*2,148,paper);
    drawObject('chochin','chochin',906,645 + Math.sin(t*2+2)*4,104,paper);
    drawObject('sakura','phoenix',-60,820,310,paper);
    drawObject('maple','phoenix',1425,800,290,paper);
  }
  const freeze = new URLSearchParams(location.search).get('t');
  function frame(now: number): void {
    const w = innerWidth, h = innerHeight, dpr = Math.min(devicePixelRatio,2);
    if (canvas.width !== Math.round(w*dpr) || canvas.height !== Math.round(h*dpr)) { canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr); }
    c.setTransform(dpr,0,0,dpr,0,0); c.fillStyle = '#f1e7d2'; c.fillRect(0,0,w,h);
    const top = w < 700 ? 120 : 100, bottom = w < 700 ? 210 : 145;
    const scale = Math.min(w/1400, Math.max(150,h-top-bottom)/760);
    const x = (w-1400*scale)/2, y = top + (h-top-bottom-760*scale)/2;
    const time = freeze === null ? now/1000 : Number(freeze);
    c.save(); c.translate(x,y); c.scale(scale,scale);
    c.beginPath(); c.rect(0,0,1400,760); c.clip();
    scene(mode !== 'claude',time);
    if (mode === 'split') {
      c.save(); c.beginPath(); c.rect(0,0,1400*boundary,760); c.clip(); scene(false,time); c.restore();
      c.strokeStyle = '#9e513d'; c.lineWidth = 2/scale; c.beginPath(); c.moveTo(1400*boundary,0); c.lineTo(1400*boundary,760); c.stroke();
      c.fillStyle = '#543d34'; c.font = '20px system-ui'; c.textAlign = 'left'; c.fillText('CLAUDE',25,35); c.textAlign = 'right'; c.fillText('CODEX',1375,35);
    }
    c.restore(); requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
