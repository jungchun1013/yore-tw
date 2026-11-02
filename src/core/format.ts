import { lang } from '../i18n';

const SUFFIX = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
const ZH_UNITS = ['', '萬', '億', '兆', '京', '垓'];

/** Compact number formatting for idle-scale values. */
export function fmt(n: number, digits = 2): string {
  if (!isFinite(n)) return '∞';
  if (n < 0) return '-' + fmt(-n, digits);
  if (n < 1000) {
    if (Number.isInteger(n)) return n.toString();
    return n < 10 ? n.toFixed(1) : Math.floor(n).toString();
  }
  if (lang() === 'zh') {
    if (n < 1e4) return Math.floor(n).toString();
    const e = Math.floor(Math.log10(n) / 4);
    if (e < ZH_UNITS.length) {
      const v = n / 10 ** (4 * e);
      const str = v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : digits);
      return (str.includes('.') ? str.replace(/\.?0+$/, '') : str) + ZH_UNITS[e]; // 5.00萬 → 5萬, 4.92萬 stays
    }
    return n.toExponential(2).replace('+', '');
  }
  const e = Math.floor(Math.log10(n) / 3);
  if (e < SUFFIX.length) {
    const v = n / 10 ** (3 * e);
    return v.toFixed(v >= 100 ? 0 : digits) + SUFFIX[e];
  }
  return n.toExponential(2).replace('+', '');
}

/** Whole-number formatting: no decimals under 1000. */
export function fmtInt(n: number): string {
  return n < 1000 ? Math.floor(n).toString() : fmt(n);
}

export function fmtTime(sec: number): string {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (lang() === 'zh') {
    if (h > 0) return `${h} 小時 ${m} 分`;
    if (m > 0) return `${m} 分 ${s} 秒`;
    return `${s} 秒`;
  }
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
