// Number formatting with Vietnamese decimal comma.
const group = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export function num(x, d = 3) {
  if (!isFinite(x)) return '–';
  const a = Math.abs(x);
  if (a >= 1000) return group(x);
  if (Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
  if (a >= 100) return String(Math.round(x));
  return x.toPrecision(d).replace('.', ',');
}
const SUP = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻'};
export const sci = (m, e) => num(m) + '·10' + String(e).replace(/./g, c => SUP[c]);
export const sciOf = x => {        // 3·10⁸ style (mantissa 1 → just 10⁸)
  const e = Math.floor(Math.log10(x) + 1e-9), m = x / 10 ** e;
  return (Math.abs(m - 1) < 1e-9 ? '10' : num(m) + '·10') + String(e).replace(/./g, c => SUP[c]);
};
export const freqParts = f => f >= 1e12 ? [sciOf(f), 'Hz'] : f >= 1e9 ? [num(f / 1e9), 'GHz'] : f >= 1e6 ? [num(f / 1e6), 'MHz'] : f >= 1e3 ? [num(f / 1e3), 'kHz'] : [num(f), 'Hz'];
export const timeParts = T => T >= 1 ? [num(T), 's'] : T >= 1e-3 ? [num(T * 1e3), 'ms'] : T >= 1e-6 ? [num(T * 1e6), 'µs'] : T >= 1e-9 ? [num(T * 1e9), 'ns'] : [sciOf(T), 's'];
export const lenParts = m => m >= 1e3 ? [num(m / 1e3), 'km'] : m >= 1 ? [num(m), 'm'] : m >= 1e-2 ? [num(m * 1e2), 'cm'] : m >= 1e-3 ? [num(m * 1e3), 'mm'] : m >= 1e-6 ? [num(m * 1e6), 'µm'] : m >= 1e-9 ? [num(m * 1e9), 'nm'] : [num(m * 1e12), 'pm'];
export const speedParts = v => v >= 1e6 ? [sci(v / 10 ** Math.floor(Math.log10(v)), Math.floor(Math.log10(v))), 'm/s'] : [num(v), 'm/s'];
export const slowText = s => s >= 1 ? '×1' : '×' + group(1 / s);
