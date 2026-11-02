import type { AchievementDef } from '../core/types';
import { CATS } from './cats';
import { fmt } from '../core/format';
import { ACH_ZH } from './zh';

/** Chinese number text for achievement names (the live fmt() follows the current language, but these are fixed at load). */
const zn = (n: number): string => n >= 1e12 ? `${n / 1e12}兆` : n >= 1e8 ? `${n / 1e8}億` : n >= 1e4 ? `${n / 1e4}萬` : String(n);

const list: AchievementDef[] = [];

([[100, 'Warm-up'], [1000, 'Dedicated'], [10000, 'Carpal paw']] as const).forEach(([n, label], i) => {
  list.push({ id: `clicks_${n}`, name: label, desc: `Pat the cat ${fmt(n)} times.`, zh: { name: ACH_ZH.clicks[i], desc: ACH_ZH.clicksDesc(zn(n)) }, check: (s) => s.clicks >= n });
});
for (const cat of CATS) {
  for (const n of [1, 10, 50]) {
    list.push({ id: `${cat.id}_${n}`, name: `${cat.name} ×${n}`, desc: `Own ${n} ${cat.name}${n > 1 ? 's' : ''}.`, zh: { name: ACH_ZH.own(cat.zh?.name ?? cat.name, n), desc: ACH_ZH.ownDesc(cat.zh?.name ?? cat.name, n) }, check: (s) => (s.gens[cat.id] ?? 0) >= n });
  }
}
for (const e of [1e3, 1e5, 1e7, 1e9, 1e11, 1e13, 1e15]) {
  list.push({ id: `earned_${e}`, name: `${fmt(e)} macarons`, desc: `Bake ${fmt(e)} macarons in total.`, zh: { name: ACH_ZH.earned(zn(e)), desc: ACH_ZH.earnedDesc(zn(e)) }, check: (s) => s.allTimeEarned >= e });
}
for (const c of [10, 100, 1000, 10000, 1e5, 1e6]) {
  list.push({ id: `cps_${c}`, name: `${fmt(c)}/s`, desc: `Reach ${fmt(c)} macarons per second.`, zh: { name: ACH_ZH.cps(zn(c)), desc: ACH_ZH.cpsDesc(zn(c)) }, check: (_s, ctx) => ctx.cps >= c });
}
list.push({ id: 'rainbow', name: 'Nya nya nya', desc: 'Find the rainbow cat.', zh: ACH_ZH.rainbow, check: (s) => s.achievements.includes('rainbow') });
list.push({ id: 'prestige_1', name: 'New shop', desc: 'Open your second shop.', zh: ACH_ZH.prestige1, check: (s) => s.prestigeCount >= 1 });
list.push({ id: 'prestige_5', name: 'Franchise', desc: 'Open six shops.', zh: ACH_ZH.prestige5, check: (s) => s.prestigeCount >= 5 });

export const ACHIEVEMENTS = list;
