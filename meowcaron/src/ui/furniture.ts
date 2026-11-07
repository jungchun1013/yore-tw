import type { GameController } from '../core/controller';
import { FURNITURE_ITEMS, FURNITURE_BY_ID, FURNITURE_SLOTS, FURNITURE_BONUS } from '../content/furniture';
import { furnitureCanvas } from '../game/sprites/pixel';
import { fmt, fmtInt } from '../core/format';
import { el, openModal, toast } from './dom';
import { FURNITURE_ZH } from '../content/zh';
import { t, lang } from '../i18n';

const text = (id: string, en: { name: string; desc: string }) => (lang() === 'zh' && FURNITURE_ZH[id] ? FURNITURE_ZH[id] : en);

const icons: Record<string, string> = {};
function icon(id: string): string { return (icons[id] ??= furnitureCanvas(FURNITURE_BY_ID[id].sprite, 4).toDataURL()); }

/** Furniture shop: buy pieces with macarons, keep up to four on the floor, store the rest. */
export function showFurniture(ctrl: GameController): void {
  const body = el('div', { class: 'furn' });
  const close = openModal(body);
  const render = () => {
    const s = ctrl.state;
    const placed = s.furnitureSlots.filter(Boolean).length;
    const slots = el('div', { class: 'furn-slots' }, s.furnitureSlots.map((id, i) => {
      const slot = el('button', { class: `furn-slot ${id ? 'filled' : ''}`, 'data-slot': String(i), title: id ? t('tapToPutAway') : t('emptySpot') }, id ? [el('img', { src: icon(id), alt: '' })] : [t('spot', { n: i + 1 }), el('br'), t('empty')]);
      slot.onclick = () => { if (id) { ctrl.placeFurniture(null, i); render(); } };
      return slot;
    }));
    const list = el('div', { class: 'furn-list' }, FURNITURE_ITEMS.map((f) => {
      const owned = s.furnitureOwned.includes(f.id);
      const onFloor = s.furnitureSlots.includes(f.id);
      const actions = el('div', { class: 'actions' });
      if (!owned) {
        const b = el('button', { class: 'btn buy', 'data-buy-furniture': f.id }, [`🍪 ${fmtInt(f.cost)}`]) as HTMLButtonElement;
        b.disabled = s.macarons < f.cost;
        b.onclick = () => { if (ctrl.buyFurniture(f.id)) { toast(`${text(f.id, f).name} ✓`); render(); } };
        actions.append(b);
      } else if (onFloor) {
        const b = el('button', { class: 'btn' }, [t('putAway')]);
        b.onclick = () => { ctrl.placeFurniture(null, s.furnitureSlots.indexOf(f.id)); render(); };
        actions.append(b);
      } else {
        const b = el('button', { class: 'btn primary', 'data-place-furniture': f.id }, [t('place')]) as HTMLButtonElement;
        const empty = s.furnitureSlots.indexOf(null);
        b.disabled = empty < 0;
        b.title = empty < 0 ? t('allSpotsFull') : '';
        b.onclick = () => { if (ctrl.placeFurniture(f.id, s.furnitureSlots.indexOf(null))) render(); };
        actions.append(b);
      }
      return el('div', { class: 'furn-row', 'data-furniture': f.id }, [
        el('img', { src: icon(f.id), alt: '' }),
        el('div', {}, [el('div', { class: 'name' }, [text(f.id, f).name]), el('div', { class: 'meta' }, [text(f.id, f).desc])]),
        actions,
      ]);
    }));
    body.replaceChildren(
      el('h2', {}, [t('furniture')]),
      el('p', { class: 'muted' }, [t('furnitureBody', { p: Math.round(FURNITURE_BONUS * 100), n: Math.round(placed * FURNITURE_BONUS * 100) })]),
      slots,
      list,
      el('div', { class: 'actions' }, [el('button', { class: 'btn primary', id: 'furniture-close' }, [t('close')])]),
    );
    body.querySelector<HTMLButtonElement>('#furniture-close')!.onclick = close;
    void fmt; void FURNITURE_SLOTS;
  };
  render();
}
