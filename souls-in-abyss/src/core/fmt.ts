import { lang } from './i18n';

/** Short numbers: zh uses 萬/億/兆, en uses K/M/B/T. */
export function num(n: number): string {
  const a = Math.abs(n);
  if (a < 10000) return String(Math.floor(n));
  if (lang === 'zh') {
    const u: [number, string][] = [[1e16, '京'], [1e12, '兆'], [1e8, '億'], [1e4, '萬']];
    for (const [v, s] of u) if (a >= v) return (n / v).toFixed(n / v < 100 ? 2 : 0).replace(/\.?0+$/, '') + s;
  }
  const u: [number, string][] = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
  for (const [v, s] of u) if (a >= v) return (n / v).toFixed(n / v < 100 ? 2 : 0).replace(/\.?0+$/, '') + s;
  return String(Math.floor(n));
}
/** Gold is always shown as the plain full number, never as 萬/K. */
export const gold = (n: number): string => String(Math.floor(n));
export const pct = (x: number, d = 0): string => (x * 100).toFixed(d) + '%';
export function clock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60), r = s % 60;
  return m + ':' + String(r).padStart(2, '0');
}
