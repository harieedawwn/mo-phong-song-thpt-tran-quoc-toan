// Shared flat drawing helpers: palette, fonts, pills (labels), arrows, rulers. No gradients, no shadows.
export const C = {
  ink: '#15181d', ink2: '#2b2f36', muted: '#5d6470', line: '#ddd8cc', paper: '#fbfaf6',
  comp: '#e8590c', rare: '#1c7ed6', neutral: '#495057', track: '#d7191f', red: '#d7191f'
};
export const UI = '"Be Vietnam Pro",system-ui,sans-serif', MONO = '"JetBrains Mono",ui-monospace,monospace';
export const font = (size, weight = 700, mono = false) => weight + ' ' + size + 'px ' + (mono ? MONO : UI);

const widths = new Map();
export function textW(ctx, text) {
  const k = ctx.font + '|' + text;
  let w = widths.get(k);
  if (w === undefined) { w = ctx.measureText(text).width; if (widths.size > 500) widths.clear(); widths.set(k, w); }
  return w;
}
export function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
// Label pill centred at (x, y). Returns its width.
export function pill(ctx, text, x, y, {size = 12, fill = '#fff', stroke = C.ink, color = C.ink, mono = false, weight = 700, pad = 7} = {}) {
  ctx.font = font(size, weight, mono);
  const w = textW(ctx, text) + pad * 2, h = size + 9;
  ctx.beginPath(); roundRect(ctx, x - w / 2, y - h / 2, w, h, 6);
  ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.lineWidth = 1.5; ctx.strokeStyle = stroke; ctx.stroke(); }
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 0.5);
  return w;
}
export function text(ctx, s, x, y, {size = 12, weight = 600, color = C.ink, align = 'center', base = 'middle', mono = false} = {}) {
  ctx.font = font(size, weight, mono); ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base;
  ctx.fillText(s, x, y);
}
// Filled triangular arrow head at (x, y) pointing along angle a.
export function head(ctx, x, y, a, s = 8) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - s * Math.cos(a - 0.45), y - s * Math.sin(a - 0.45));
  ctx.lineTo(x - s * Math.cos(a + 0.45), y - s * Math.sin(a + 0.45));
  ctx.closePath(); ctx.fill();
}
// Straight arrow from (x1,y1) to (x2,y2); `both` puts a head on each end.
export function arrow(ctx, x1, y1, x2, y2, {color = C.ink, width = 2, size = 8, both = false} = {}) {
  const a = Math.atan2(y2 - y1, x2 - x1), inset = size * 0.7;
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1 + (both ? inset * Math.cos(a) : 0), y1 + (both ? inset * Math.sin(a) : 0));
  ctx.lineTo(x2 - inset * Math.cos(a), y2 - inset * Math.sin(a)); ctx.stroke();
  head(ctx, x2, y2, a, size);
  if (both) head(ctx, x1, y1, a + Math.PI, size);
}
// Horizontal dimension bracket |<—— label ——>| between x1 and x2 at height y.
export function ruler(ctx, x1, x2, y, label, {color = C.ink, size = 12} = {}) {
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.5; ctx.lineCap = 'butt';
  ctx.beginPath(); ctx.moveTo(x1, y - 7); ctx.lineTo(x1, y + 7); ctx.moveTo(x2, y - 7); ctx.lineTo(x2, y + 7); ctx.stroke();
  ctx.font = font(size, 700, true);
  const tw = textW(ctx, label) + 14, inside = x2 - x1 > tw + 26;
  const mid = (x1 + x2) / 2;
  ctx.beginPath();
  if (inside) { ctx.moveTo(x1 + 1, y); ctx.lineTo(mid - tw / 2, y); ctx.moveTo(mid + tw / 2, y); ctx.lineTo(x2 - 1, y); }
  else { ctx.moveTo(x1 + 1, y); ctx.lineTo(x2 - 1, y); }
  ctx.stroke();
  head(ctx, x1, y, Math.PI, 7); head(ctx, x2, y, 0, 7);
  if (inside) pill(ctx, label, mid, y, {size, mono: true, stroke: null, fill: C.paper, color});
  else pill(ctx, label, x2 + 10 + tw / 2, y, {size, mono: true, stroke: color, color});
}
