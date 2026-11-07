import type { GameController } from '../core/controller';
import { CAT_BY_ID } from '../content/cats';
import { JOURNAL } from '../content/journal';
import { JOURNAL_ZH, PET_TEXT_ZH } from '../content/zh';
import { t, lang, nameOf, heroName } from '../i18n';
import { genProduction, globalMultiplier } from '../core/economy';
import { fmt } from '../core/format';
import { catCanvas } from '../game/sprites/pixel';
import { diaryBook, type DiaryPage } from './diary';

const PET_TEXT = { happy: 'Hops around, very pleased (> <)', purr: 'Squeezes its eyes shut and wiggles with purring (> <)', lie: 'Flops over for a nap, zzz, then gets up (> <)', sparkle: 'Glows and sparkles. Does not explain (> <)', flat: 'Goes flat as a pancake and boings back up three times (> <)' } as const;

const portraits: Record<string, string> = {};
function portrait(id: string): string {
  if (!portraits[id]) {
    const def = CAT_BY_ID[id];
    portraits[id] = def ? catCanvas(def.coat, def.accessory, 'happy').toDataURL() : catCanvas('cream', 'none', 'happy').toDataURL();
  }
  return portraits[id];
}

function unlocked(ctrl: GameController, id: string): boolean {
  if (id === 'shopcat') return true;
  const def = CAT_BY_ID[id];
  return !!def && ((ctrl.state.gens[id] ?? 0) > 0 || ctrl.state.allTimeEarned >= def.baseCost * 0.4);
}

/** Staff journal: grid of polaroids, tap one for its page. Same book as the customer codex. */
export function showJournal(ctrl: GameController, startId?: string): void {
  const pages: DiaryPage[] = JOURNAL.map((entry) => {
    const open = unlocked(ctrl, entry.id);
    const def = CAT_BY_ID[entry.id];
    const owned = def ? ctrl.state.gens[def.id] ?? 0 : 0;
    const prod = def ? genProduction(ctrl.state, def) * globalMultiplier(ctrl.state) : 0;
    const name = entry.id === 'shopcat' ? heroName(ctrl.state.heroName) : nameOf(def!);
    const zh = lang() === 'zh' ? JOURNAL_ZH[entry.id] : undefined;
    const text = zh ? { ...zh, pet: PET_TEXT_ZH[entry.pet] } : { title: entry.title, story: entry.story, likes: entry.likes, flavour: entry.flavour, pet: PET_TEXT[entry.pet] };
    return {
      id: entry.id,
      open,
      portrait: portrait(entry.id),
      name: open ? name : '???',
      title: open ? text.title : t('journalBlank'),
      sticker: open
        ? (def ? t('hiredStat', { n: owned, p: fmt(prod) }) : t('pattedStat', { n: fmt(ctrl.state.clicks) }))
        : (def ? t('meetAfter', { n: fmt(def.baseCost * 0.4) }) : ''),
      story: open ? text.story : [t('keepBaking')],
      notes: open ? [
        { tone: 'pink', label: t('likes'), text: text.likes },
        { tone: 'lemon', label: t('favourite'), text: text.flavour },
        { tone: 'mint', label: t('whenPetted'), text: text.pet },
      ] : [],
    };
  });
  diaryBook({ pages, startId: startId ?? 'shopcat', closeId: 'journal-close', prefix: 'journal' });
}
