// 3D-looking sphere sprites. One offscreen canvas per (colour, radius, dpr), built once; per frame only drawImage.
// Light comes from the upper-left (same as the SVG art). Colours: medium particle #1c7ed6, steel #868e96, tracked #e03131, rope bead #1971c2.
export const ballDpr = () => DPR;
export const BALL = {blue: '#1c7ed6', orange: '#e8590c', pale: '#74c0fc', steel: '#868e96', red: '#e03131', bead: '#1971c2'};

const cache = new Map();
let DPR = 1;
export function setBallDpr(d) { if (d !== DPR) { DPR = d; cache.clear(); } }
export function clearBalls() { cache.clear(); }

const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const mix = (a, b, t) => 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',') + ')';

// sprite = {c: canvas, h: half size in CSS px (centre of the ball is at the canvas centre)}
export function ball(color, r) {
  const key = color + '|' + r.toFixed(2) + '|' + DPR;
  let sp = cache.get(key);
  if (sp) return sp;
  const pad = Math.ceil(r * 0.55) + 1, h = r + pad, px = Math.ceil(h * 2 * DPR);
  const c = document.createElement('canvas'); c.width = c.height = px;
  const g = c.getContext('2d'), s = px / (h * 2), cx = px / 2, cy = px / 2, R = r * s;
  const base = hex(color);
  // baked soft contact shadow, below-right
  const sh = g.createRadialGradient(cx + R * 0.28, cy + R * 0.42, R * 0.35, cx + R * 0.28, cy + R * 0.42, R * 1.35);
  sh.addColorStop(0, 'rgba(40,30,10,.26)'); sh.addColorStop(1, 'rgba(40,30,10,0)');
  g.fillStyle = sh; g.fillRect(0, 0, px, px);
  // body: lighter tint (upper-left) → base → darker rim
  const body = g.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.08, cx - R * 0.1, cy - R * 0.12, R * 1.05);
  body.addColorStop(0, mix(base, [255, 255, 255], 0.62));
  body.addColorStop(0.45, color);
  body.addColorStop(1, mix(base, [0, 0, 0], 0.42));
  g.beginPath(); g.arc(cx, cy, R, 0, 6.2832); g.fillStyle = body; g.fill();
  // thin darker rim for contrast on a projector
  g.lineWidth = Math.max(1, 0.7 * s); g.strokeStyle = mix(base, [0, 0, 0], 0.55); g.stroke();
  // specular dot
  if (r >= 2.4) {
    g.beginPath(); g.arc(cx - R * 0.36, cy - R * 0.4, Math.max(0.7 * s, R * 0.2), 0, 6.2832);
    g.fillStyle = 'rgba(255,255,255,.85)'; g.fill();
  }
  sp = {c, h};
  cache.set(key, sp);
  return sp;
}
export function drawBall(ctx, sp, x, y) { ctx.drawImage(sp.c, x - sp.h, y - sp.h, sp.h * 2, sp.h * 2); }
