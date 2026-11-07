import type { GameController } from '../core/controller';
import { SPECIES } from '../content/customers';
import { SPECIES_ZH } from '../content/zh';
import { t, lang } from '../i18n';
import { animalCanvas } from '../game/sprites/pixel';
import { diaryBook, type DiaryPage } from './diary';

const portraits: Record<string, string> = {};
function portrait(id: string): string {
  if (!portraits[id]) { const sp = SPECIES.find((s) => s.id === id)!; portraits[id] = animalCanvas(sp, sp.coats[0], 'happy').toDataURL(); }
  return portraits[id];
}

/** Customer book: same diary component as the staff journal. */
export function showCodex(ctrl: GameController, startId?: string): void {
  const pages: DiaryPage[] = SPECIES.map((sp) => {
    const seen = ctrl.state.customersSeen[sp.id] ?? 0, served = ctrl.state.customersServed[sp.id] ?? 0;
    const open = seen > 0;
    const text = lang() === 'zh' && SPECIES_ZH[sp.id] ? SPECIES_ZH[sp.id] : { name: sp.name, blurb: sp.blurb };
    return {
      id: sp.id, open, portrait: portrait(sp.id),
      name: open ? text.name : '???',
      title: open ? (sp.weight >= 20 ? t('often1') : sp.weight >= 10 ? t('often2') : t('often3')) : t('whoWasThat'),
      sticker: open ? t('visited', { a: seen, b: served }) : t('notMet'),
      story: [open ? text.blurb : t('keepCounter')],
      notes: open ? [{ tone: 'lemon', label: t('orders'), text: t('ordersOf', { n: sp.orderMult }) }] : [],
    };
  });
  diaryBook({ pages, startId: startId ?? SPECIES[0].id, closeId: 'codex-close', prefix: 'codex' });
}
