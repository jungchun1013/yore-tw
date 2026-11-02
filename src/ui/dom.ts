export const $ = <T extends HTMLElement = HTMLElement>(sel: string): T => {
  const el = document.querySelector<T>(sel);
  if (!el) throw new Error(`missing element ${sel}`);
  return el;
};

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, children: (Node | string)[] = []): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v; else e.setAttribute(k, v);
  }
  for (const c of children) e.append(c);
  return e;
}

export function toast(msg: string, cls = ''): void {
  const root = document.getElementById('toast-root');
  if (!root) return;
  const t = el('div', { class: `toast ${cls}` }, [msg]);
  root.append(t);
  while (root.children.length > 3) root.firstElementChild?.remove();
  setTimeout(() => t.remove(), 3000);
}

/** Lightweight tooltip for elements carrying data-tip (HTML). */
export function initTooltip(): void {
  const tip = $('#tooltip');
  let current: HTMLElement | null = null;
  const show = (target: HTMLElement) => {
    current = target;
    tip.innerHTML = target.dataset.tip ?? '';
    tip.hidden = false;
    const r = target.getBoundingClientRect();
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = r.left + r.width / 2 - tw / 2;
    x = Math.max(8, Math.min(window.innerWidth - tw - 8, x));
    let y = r.top - th - 8;
    if (y < 8) y = r.bottom + 8;
    tip.style.left = `${x}px`; tip.style.top = `${y}px`;
  };
  const hide = () => { tip.hidden = true; current = null; };
  document.addEventListener('pointerover', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-tip]');
    if (t) show(t); else if (current) hide();
  });
  document.addEventListener('pointerdown', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-tip]');
    if (!t) hide();
  });
  document.addEventListener('scroll', hide, true);
}

export function openModal(content: HTMLElement, opts: { dismissable?: boolean } = {}): () => void {
  const root = $('#modal-root');
  const modal = el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' }, [content]);
  root.replaceChildren(modal);
  const close = () => { if (modal.parentElement) modal.remove(); };
  if (opts.dismissable !== false) {
    root.onclick = (e) => { if (e.target === root) close(); };
  } else root.onclick = null;
  return close;
}
