import type { GameController } from '../core/controller';
import { availableUpgrades, hasInfluencer } from '../core/economy';
import { t } from '../i18n';
import { el } from './dom';

/**
 * Onboarding coach: four one-time prompts, each anchored to the thing to tap and dismissed by doing it.
 *   pat     → the owner on the stage               (done after 3 pats)
 *   hire    → the first "Hire" button              (shown once a kitten is affordable, done when one is owned)
 *   upgrade → the first upgrade tile                (shown when one is visible, done when any upgrade is bought)
 *   feed    → the 📸 button, when the Influencer Cat is hired (done when the feed is opened)
 * Progress is saved in state.tutorial so nothing repeats.
 */
interface Step {
  id: string;
  text: string;
  /** DOM target selector, or null for the owner cat on the canvas */
  target: string | null;
  when: (c: GameController) => boolean;
  done: (c: GameController) => boolean;
}

export function initTutorial(ctrl: GameController): void {
  const root = document.getElementById('coach-root');
  if (!root) return;
  let feedOpened = false;
  document.getElementById('btn-feed')?.addEventListener('click', () => { feedOpened = true; });
  const steps: Step[] = [
    { id: 'pat', text: t('tutPat'), target: null, when: () => true, done: (c) => c.state.clicks >= 3 },
    { id: 'hire', text: t('tutHire'), target: '[data-buy="kitten"]', when: (c) => c.state.macarons >= 15, done: (c) => (c.state.gens.kitten ?? 0) > 0 },
    { id: 'upgrade', text: t('tutUpgrade'), target: '[data-upgrade]', when: (c) => availableUpgrades(c.state).some((u) => u.cost <= c.state.macarons), done: (c) => c.state.upgrades.length > 0 },
    { id: 'feed', text: t('tutFeed'), target: '#btn-feed', when: (c) => hasInfluencer(c.state), done: (c) => feedOpened || c.state.posts > 0 },
  ];
  let active: Step | null = null;
  let node: HTMLElement | null = null;
  let scrolled = false;

  const show = (step: Step) => {
    active = step; scrolled = false;
    node = el('div', { class: 'coach', 'data-step': step.id }, [
      el('div', { class: 'coach-ring' }),
      el('div', { class: 'coach-bubble' }, [el('span', {}, [step.text]), el('button', { class: 'coach-ok', 'aria-label': t('gotIt') }, ['✓'])]),
    ]);
    node.querySelector<HTMLButtonElement>('.coach-ok')!.onclick = (e) => { e.stopPropagation(); finish(); };
    root.replaceChildren(node);
  };
  const finish = () => { if (active) ctrl.completeTutorial(active.id); active = null; node = null; root.replaceChildren(); };

  /** Where the ring goes: the target element's box, or the owner's spot on the canvas. */
  const anchor = (step: Step): DOMRect | null => {
    if (step.target) {
      const e = document.querySelector<HTMLElement>(step.target);
      if (!e) return null;
      if (!scrolled) { scrolled = true; e.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      return e.getBoundingClientRect();
    }
    const canvas = document.querySelector('#game canvas');
    const hero = window.__mc?.hero?.();
    if (!canvas || !hero) return null;
    const r = canvas.getBoundingClientRect();
    const size = Math.min(r.width, r.height) * 0.22;
    return new DOMRect(r.left + hero.x - size / 2, r.top + hero.y - size * 0.75, size, size);
  };

  const place = () => {
    if (!active || !node) return;
    const a = anchor(active);
    if (!a) { node.style.display = 'none'; return; }
    node.style.display = '';
    const ring = node.querySelector<HTMLElement>('.coach-ring')!, bubble = node.querySelector<HTMLElement>('.coach-bubble')!;
    const pad = 8;
    ring.style.cssText = `left:${a.left - pad}px;top:${a.top - pad}px;width:${a.width + pad * 2}px;height:${a.height + pad * 2}px`;
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
      if (active.done(ctrl)) finish();
      else place();
    } else {
      const next = steps.find((s) => !ctrl.state.tutorial.includes(s.id) && !s.done(ctrl) && s.when(ctrl));
      // steps already satisfied before they were ever shown are silently completed
      for (const s of steps) if (!ctrl.state.tutorial.includes(s.id) && s.done(ctrl)) ctrl.completeTutorial(s.id);
      if (next && document.getElementById('modal-root')?.childElementCount === 0) { show(next); place(); }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
