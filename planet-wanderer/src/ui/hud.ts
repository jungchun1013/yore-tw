export interface HudHandlers {
  toggleView(): void;
  cyclePixel(): string;
  toggleOutline(): boolean;
  toggleDither(): boolean;
  interact(): void;
}

/** Title, scene banner, interaction prompt and the look toggles. */
export class Hud {
  private viewBtn: HTMLButtonElement;
  private prompt: HTMLButtonElement;
  private banner: HTMLElement;
  private sub: HTMLElement;
  private bannerTimer = 0;

  constructor(el: HTMLElement, h: HudHandlers) {
    el.innerHTML = `
      <div class="title"><b>Planet Wanderer</b><span class="sub"></span></div>
      <div class="bar">
        <button data-act="view">生活視角</button>
        <button data-act="px">像素 ×3</button>
        <button data-act="outline" class="on">描邊 開</button>
        <button data-act="dither" class="on">抖色 開</button>
      </div>
      <div class="banner"></div>
      <button class="prompt" hidden></button>
      <div class="hint">WASD / 點地面 走路 · 拖曳 旋轉 · 滾輪 / 雙指 縮放 · E 互動</div>`;
    this.viewBtn = el.querySelector('[data-act="view"]')!;
    this.prompt = el.querySelector('.prompt')!;
    this.banner = el.querySelector('.banner')!;
    this.sub = el.querySelector('.sub')!;
    this.prompt.addEventListener('click', () => h.interact());
    el.querySelector('.bar')!.addEventListener('click', (ev) => {
      const b = (ev.target as HTMLElement).closest('button');
      if (!b) return;
      const act = b.dataset.act;
      if (act === 'view') h.toggleView();
      if (act === 'px') b.textContent = h.cyclePixel();
      if (act === 'outline') {
        const on = h.toggleOutline();
        b.classList.toggle('on', on);
        b.textContent = `描邊 ${on ? '開' : '關'}`;
      }
      if (act === 'dither') {
        const on = h.toggleDither();
        b.classList.toggle('on', on);
        b.textContent = `抖色 ${on ? '開' : '關'}`;
      }
    });
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
