import type { OutlineMode, RenderStyle } from '../render/pipeline';

export interface HudHandlers {
  toggleView(): void;
  setStyle(s: RenderStyle): void;
  setOutline(o: OutlineMode): void;
  cyclePixel(): string;
  /** 2 = jagged, 1 = dither dots, 0 = hard; returns the new mode. */
  cycleEdges(): number;
  interact(): void;
}

const STYLE_LABEL: Record<RenderStyle, string> = { soft: '畫風 薩爾達', sky: '畫風 光遇', pixel: '畫風 像素' };
const STYLES: RenderStyle[] = ['soft', 'sky', 'pixel'];
const OUTLINE_LABEL: Record<OutlineMode, string> = { none: '描邊 無', tint: '描邊 同色加深', dark: '描邊 深色' };
const OUTLINES: OutlineMode[] = ['tint', 'none', 'dark'];

/** Title, scene banner, interaction prompt and the look toggles. */
export class Hud {
  private viewBtn: HTMLButtonElement;
  private styleBtn: HTMLButtonElement;
  private outlineBtn: HTMLButtonElement;
  private pixelOnly: HTMLElement[];
  private prompt: HTMLButtonElement;
  private banner: HTMLElement;
  private sub: HTMLElement;
  private bannerTimer = 0;
  private style: RenderStyle = 'soft';
  private outline: OutlineMode = 'tint';

  constructor(el: HTMLElement, private readonly h: HudHandlers) {
    el.innerHTML = `
      <div class="title"><b>Planet Wanderer <i class="demo">DEMO</i></b><span class="sub"></span></div>
      <div class="bar">
        <button data-act="view">生活視角</button>
        <button data-act="style" class="on"></button>
        <button data-act="outline"></button>
        <button data-act="px" class="pixel-only">像素 ×3</button>
        <button data-act="dither" class="on pixel-only">色塊邊 鋸齒</button>
      </div>
      <div class="banner"></div>
      <button class="prompt" hidden></button>
      <div class="hint">WASD / 點地面 走路 · 拖曳 旋轉 · 滾輪 / 雙指 縮放 · E 互動</div>`;
    this.viewBtn = el.querySelector('[data-act="view"]')!;
    this.styleBtn = el.querySelector('[data-act="style"]')!;
    this.outlineBtn = el.querySelector('[data-act="outline"]')!;
    this.pixelOnly = [...el.querySelectorAll<HTMLElement>('.pixel-only')];
    this.prompt = el.querySelector('.prompt')!;
    this.banner = el.querySelector('.banner')!;
    this.sub = el.querySelector('.sub')!;
    this.prompt.addEventListener('click', () => h.interact());
    el.querySelector('.bar')!.addEventListener('click', (ev) => {
      const b = (ev.target as HTMLElement).closest('button');
      if (!b) return;
      const act = b.dataset.act;
      if (act === 'view') h.toggleView();
      if (act === 'style') this.setLook(STYLES[(STYLES.indexOf(this.style) + 1) % STYLES.length], this.outline);
      if (act === 'outline') this.setLook(this.style, OUTLINES[(OUTLINES.indexOf(this.outline) + 1) % OUTLINES.length]);
      if (act === 'px') b.textContent = h.cyclePixel();
      if (act === 'dither') b.textContent = `色塊邊 ${['硬邊', '抖色', '鋸齒'][h.cycleEdges()]}`;
    });
    this.setLook(this.style, this.outline);
  }

  /** Apply a style + outline pair and keep the buttons in step. */
  setLook(style: RenderStyle, outline: OutlineMode) {
    this.style = style;
    this.outline = outline;
    this.h.setStyle(style);
    this.h.setOutline(outline);
    this.styleBtn.textContent = STYLE_LABEL[style];
    this.outlineBtn.textContent = OUTLINE_LABEL[outline];
    for (const e of this.pixelOnly) e.hidden = style !== 'pixel';
  }

  setView(life: boolean) {
    this.viewBtn.textContent = life ? '星球視角' : '生活視角';
  }

  setPrompt(text: string | null) {
    this.prompt.hidden = !text;
    if (text && this.prompt.textContent !== text) this.prompt.textContent = text;
  }

  arrive(name: string) {
    this.sub.textContent = name;
    this.banner.textContent = name;
    this.banner.classList.add('show');
    clearTimeout(this.bannerTimer);
    this.bannerTimer = window.setTimeout(() => this.banner.classList.remove('show'), 2600);
  }
}
