// "Phần tử đỏ" mini-scope (left column, desktop only): live trace of the red particle from mode.probe().
// Ring buffer of preallocated Float32Arrays – no allocation per frame. While running only the axis letters (t, u) show;
// paused → value ticks (A, −A, T) appear.
import {state} from './state.js';
import {font} from './draw/ink.js';

const N = 480, T = new Float32Array(N), A = new Float32Array(N), B = new Float32Array(N);
let head = 0, cnt = 0, cv = null, g = null, W = 0, H = 0, dpr = 1;
const INK = '#343a40', MUTED = '#868e96', RED = '#d7191f';

export function scopeInit(canvas) { cv = canvas; g = canvas.getContext('2d'); }
export function scopeClear() { head = cnt = 0; }
export function scopeSize() {
  if (!cv) return;
  const w = cv.clientWidth, h = cv.clientHeight;
  if (!w || !h) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = w; H = h; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
}
export function scopePush(t, p) {
  if (cnt && t < T[(head + N - 1) % N]) scopeClear();      // restart: time went backwards
  T[head] = t; A[head] = p.a; B[head] = p.b; head = (head + 1) % N; if (cnt < N) cnt++;
}
const idx = i => (head - cnt + i + N) % N;

// col2/buf2 (optional) = a second trace on the same axis (overlay: two particles, e.g. antiphase beads of a standing wave)
function lane(y0, y1, win, t1, col, buf, f, col2, buf2) {
  const h = (y1 - y0) / 2, cy = (y0 + y1) / 2, x0 = 26, x1 = W - 8;
  g.strokeStyle = MUTED; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, cy); g.lineTo(x1, cy); g.stroke();   // time axis
  g.beginPath(); g.moveTo(x0, y0 + 2); g.lineTo(x0, y1 - 2); g.stroke();
  trace(x0, x1, cy, h, win, t1, col, buf);
  if (buf2) trace(x0, x1, cy, h, win, t1, col2, buf2);
  if (!state.playing) {                                             // value ticks only when paused
    g.fillStyle = INK; g.font = font(10.5, 700, true); g.textAlign = 'right'; g.textBaseline = 'middle';
    g.fillText('A', x0 - 4, cy - h + 6); g.fillText('−A', x0 - 4, cy + h - 6);
    g.strokeStyle = MUTED; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(x0, cy - h + 6); g.lineTo(x1, cy - h + 6); g.moveTo(x0, cy + h - 6); g.lineTo(x1, cy + h - 6); g.stroke(); g.setLineDash([]);
    const Tw = 1 / f;
    if (Tw < win) {
      g.strokeStyle = INK; g.lineWidth = 1.4; g.beginPath(); const xa = x1 - 6, xb = xa - Tw / win * (x1 - x0);
      g.moveTo(xa, cy + h - 3); g.lineTo(xb, cy + h - 3); g.moveTo(xa, cy + h - 7); g.lineTo(xa, cy + h + 1); g.moveTo(xb, cy + h - 7); g.lineTo(xb, cy + h + 1); g.stroke();
      g.textAlign = 'center'; g.fillText('T', (xa + xb) / 2, cy + h - 12);
    }
  }
  g.fillStyle = INK; g.font = font(12, 700, true); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('u', x0 + 4, y0 + 6);
}

function trace(x0, x1, cy, h, win, t1, col, buf) {
  g.strokeStyle = col; g.lineWidth = 2; g.lineJoin = 'round'; g.beginPath();
  let first = true;
  for (let i = 0; i < cnt; i++) {
    const k = idx(i), dt = t1 - T[k]; if (dt > win) continue;
    const x = x1 - dt / win * (x1 - x0), y = cy - buf[k] * (h - 6);
    first ? g.moveTo(x, y) : g.lineTo(x, y); first = false;
  }
  g.stroke();
}

// p = mode.probe() result, f = real frequency of the mode (Hz), draws 3 periods of simulated time
export function scopeDraw(p, f) {
  if (!g || !W) return;
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
  const t1 = cnt ? T[idx(cnt - 1)] : 0, win = 3 / f;
  if (p.xy) {                                                        // orbit trace ξ–ζ, last ~1,3 periods
    const cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - 14;
    g.strokeStyle = MUTED; g.lineWidth = 1; g.beginPath(); g.moveTo(cx - r - 6, cy); g.lineTo(cx + r + 6, cy); g.moveTo(cx, cy - r - 6); g.lineTo(cx, cy + r + 6); g.stroke();
    g.strokeStyle = RED; g.lineWidth = 2; g.lineJoin = 'round'; g.beginPath(); let first = true, lx = 0, ly = 0;
    for (let i = 0; i < cnt; i++) {
      const k = idx(i); if (t1 - T[k] > 1.3 / f) continue;
      lx = cx + A[k] * r; ly = cy - B[k] * r; first ? g.moveTo(lx, ly) : g.lineTo(lx, ly); first = false;
    }
    g.stroke();
    g.fillStyle = RED; g.beginPath(); g.arc(lx, ly, 4, 0, 6.283); g.fill();
    g.fillStyle = INK; g.font = font(12, 700, true); g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText('ξ', cx + r + 2, cy - 9); g.fillText('ζ', cx + 6, cy - r - 4);
    if (!state.playing) { g.font = font(10.5, 700, true); g.textAlign = 'right'; g.fillText('A', cx - 4, cy - r + 4); g.textAlign = 'left'; g.fillText('A', cx + r - 8, cy + 10); }
    return;
  }
  g.fillStyle = INK; g.font = font(12, 700, true); g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText('t', W - 4, H / 2 + 12);
  if (p.lane === 'overlay') lane(4, H - 4, win, t1, p.ca, A, f, p.cb, p.two ? B : null);
  else if (p.lane === 'both' || p.lane === 'two') { lane(4, H / 2 - 2, win, t1, p.ca, A, f); lane(H / 2 + 2, H - 4, win, t1, p.cb, B, f); }
  else lane(4, H - 4, win, t1, p.lane === 'spring' ? p.cb : p.ca, A, f);
}
