/**
 * Cubic 11 draws every glyph on a 12px grid. At sizes that are not whole multiples of that
 * grid in *device* pixels, round strokes (o, 0, O) fall between pixels and look thin or broken.
 * So font sizes are tokens (--fs-*) snapped to the nearest multiple of 12 device pixels,
 * recomputed when the screen density or width changes (zoom, rotation, moving windows).
 */
const DESKTOP = { xs: 13, m: 17, l: 21, xl: 25, xxl: 30, num: 22, title: 84, 'title-s': 52 };
const PHONE = { xs: 12, m: 15, l: 18, xl: 22, xxl: 26, num: 18, title: 46, 'title-s': 34 };

export function snapFonts(): void {
  const dpr = window.devicePixelRatio || 1;
  const unit = Math.min(6, 12 / dpr);            // css px per whole 12px glyph step
  const targets = window.innerWidth <= 900 ? PHONE : DESKTOP;
  const root = document.documentElement.style;
  for (const [k, v] of Object.entries(targets)) {
    const px = Math.max(unit * 2, Math.round(v / unit) * unit);
    root.setProperty(k === 'num' ? '--num' : `--fs-${k}`, `${+px.toFixed(3)}px`);
  }
}

export function installFontSnapping(): void {
  snapFonts();
  let last = window.devicePixelRatio;
  window.addEventListener('resize', () => { snapFonts(); last = window.devicePixelRatio; });
  // zoom changes devicePixelRatio without always firing resize in every browser
  setInterval(() => { if (window.devicePixelRatio !== last) { last = window.devicePixelRatio; snapFonts(); } }, 1000);
}
