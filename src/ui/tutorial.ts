import type { GameController } from '../core/controller';
import { t } from '../i18n';
import { el } from './dom';

/**
 * Onboarding coach: four one-time prompts, each a single bubble next to the thing to tap, dismissed by doing it.
 *   pat   → the owner on the stage                     (done after 3 more pats)
 *   hire  → the first "Hire" button                    (shown once a kitten is affordable, done when one more is owned)
 *   wake  → a kitten that dozed off on the floor       (shown when one is napping, done when it is tapped awake)
 *   pet   → any cat walking about                      (done when a cat is petted)
 * Progress is saved in state.tutorial so nothing repeats; Settings can reset it.
 */
type Pt = { x: number; y: number };
interface Step {
  id: string;
  text: string;
  /** where the bubble points: a DOM selector, or a point on the canvas */
  anchor: (c: GameController) => string | Pt | null;
  when: (c: GameController) => boolean;
  /** called when the step is shown; returns the predicate that finishes it */
  start: (c: GameController) => (c: GameController) => boolean;
}

export function initTutorial(ctrl: GameController): void {
  const root = document.getElementById('coach-root');
  if (!root) return;
  let woke = 0, petted = 0;
  ctrl.on((e) => { if (e.type === 'wake') woke++; if (e.type === 'pet') petted++; });
  const dbg = () => window.__mc?.debug;
  const steps: Step[] = [
    { id: 'pat', text: t('tutPat'), anchor: () => window.__mc?.hero?.() ?? null, when: () => true,
      start: (c) => { const n = c.state.clicks + 3; return (c2) => c2.state.clicks >= n; } },
    { id: 'hire', text: t('tutHire'), anchor: () => '[data-buy="kitten"]', when: (c) => c.state.macarons >= 15,
      start: (c) => { const n = (c.state.gens.kitten ?? 0) + 1; return (c2) => (c2.state.gens.kitten ?? 0) >= n; } },
    { id: 'wake', text: t('tutWake'), anchor: () => dbg()?.napper() ?? null, when: (c) => (c.state.gens.kitten ?? 0) > 0 && !!dbg()?.napper(),
      start: () => { const n = woke + 1; return () => woke >= n; } },
    { id: 'pet', text: t('tutPet'), anchor: () => dbg()?.roamer() ?? null, when: (c) => (c.state.gens.kitten ?? 0) > 0 && !!dbg()?.roamer(),
      start: () => { const n = petted + 1; return () => petted >= n; } },
  ];
  let active: Step | null = null;
  let isDone: ((c: GameController) => boolean) | null = null;
  let node: HTMLElement | null = null;
  let scrolled = false;

  const show = (step: Step) => {
    active = step; scrolled = false; isDone = step.start(ctrl);
    node = el('div', { class: 'coach', 'data-step': step.id }, [
      el('div', { class: 'coach-bubble' }, [el('span', {}, [step.text]), el('button', { class: 'coach-ok', 'aria-label': t('gotIt') }, ['✓'])]),
    ]);
    node.querySelector<HTMLButtonElement>('.coach-ok')!.onclick = (e) => { e.stopPropagation(); finish(); };
    root.replaceChildren(node);
  };
  const finish = () => { if (active) ctrl.completeTutorial(active.id); active = null; isDone = null; node = null; root.replaceChildren(); };

  /** The box the bubble points at: a DOM element, or a spot on the canvas. */
  const anchorRect = (step: Step): DOMRect | null => {
    const a = step.anchor(ctrl);
    if (!a) return null;
    if (typeof a === 'string') {
      const e = document.querySelector<HTMLElement>(a);
      if (!e) return null;
      if (!scrolled) { scrolled = true; e.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      return e.getBoundingClientRect();
    }
    const canvas = document.querySelector('#game canvas');
    if (!canvas) return null;
    const r = canvas.getBoundingClientRect();
    const size = Math.min(r.width, r.height) * 0.16;
    return new DOMRect(r.left + a.x - size / 2, r.top + a.y - size * 0.75, size, size);
  };

  const place = () => {
    if (!active || !node) return;
    const a = anchorRect(active);
    if (!a) { node.style.display = 'none'; return; }
    node.style.display = '';
    const bubble = node.querySelector<HTMLElement>('.coach-bubble')!;
    const bw = bubble.offsetWidth, bh = bubble.offsetHeight;
    let x = a.left + a.width / 2 - bw / 2;
    x = Math.max(8, Math.min(window.innerWidth - bw - 8, x));
    let y = a.top - bh - 14;                 // above the target…
    if (y < 8) y = a.bottom + 14;            // …or below when there is no room
    if (y + bh > window.innerHeight - 8) y = Math.max(8, a.top - bh - 14);
    bubble.style.left = `${x}px`; bubble.style.top = `${y}px`;
    bubble.classList.toggle('below', y > a.top);
  };

  const tick = () => {
    if (active) {
      if (isDone && isDone(ctrl)) finish();
      else place();
    } else {
      const next = steps.find((s) => !ctrl.state.tutorial.includes(s.id)); // strictly in order: the next step waits until its moment comes
      if (next && next.when(ctrl) && document.getElementById('modal-root')?.childElementCount === 0) { show(next); place(); }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
