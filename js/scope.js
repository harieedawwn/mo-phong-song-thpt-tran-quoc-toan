// "Phần tử đỏ" mini-scope (left column). Each mode exposes
//   probe(tt, out)  – values (≈ −1…1) of the red element at simulated time tt, written into the preallocated array `out`
//   scope           – {kind:'t'|'xy', colors:[…], names:[…], T() → period in simulated seconds}
// The trace is re-evaluated from probe() over a sliding window (no history buffer, no allocation per frame); axis letters only
// while running, A / T ticks and names while paused.
import {C, font} from './draw/ink.js';
import {timeParts} from './fmt.js';

const N = 110, out = new Float32Array(4);
export function makeScope(cv) {
  const g = cv.getContext('2d');
  let W = 0, H = 0;
  const api = {
    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth, h = cv.clientHeight;
      if (!w || !h) { W = 0; return false; }
      W = w; H = h; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    },
    draw(mode, t, paused) {
      if (!W || !mode.probe || !mode.scope) return;
      const sc = mode.scope(), T = sc.T();
      g.clearRect(0, 0, W, H);
      g.lineJoin = g.lineCap = 'round';
      g.fillStyle = C.ink; g.strokeStyle = C.ink;
      const n = sc.colors.length;
      if (sc.kind === 'xy') xy(sc, T, t, paused); else series(sc, n, T, t, paused);
    }
  };
  function letter(s, x, y, color, align = 'center') { g.font = font(12, 700); g.fillStyle = color || C.ink; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, x, y); }
  function series(sc, n, T, t, paused) {
    const pad = 12, x0 = 22, x1 = W - 10, win = 2.4 * T, sh = (H - 2 * pad) / n;
    for (let c = 0; c < n; c++) {
      const top = pad + c * sh, cy = top + sh / 2, amp = sh / 2 - 9;
      g.lineWidth = 1; g.strokeStyle = '#9a9588'; g.beginPath(); g.moveTo(x0, cy); g.lineTo(x1, cy); g.moveTo(x0, top + 2); g.lineTo(x0, top + sh - 2); g.stroke();
      letter('u', x0 - 9, top + 8); letter('t', x1 - 4, cy + 10);
      if (paused) {                                                    // value ticks: A and one period T
        g.strokeStyle = '#9a9588'; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(x0, cy - amp); g.lineTo(x1, cy - amp); g.stroke(); g.setLineDash([]);
        letter('A', x0 + 10, cy - amp - 7, C.ink);
        if (sc.names && sc.names[c]) letter(sc.names[c], (x0 + x1) / 2, top + 4, sc.colors[c]);
      }
      g.strokeStyle = sc.colors[c]; g.lineWidth = 2.2; g.beginPath();
      let ly = cy;
      for (let i = 0; i <= N; i++) {
        mode_probe(t - win + win * i / N); const y = cy - out[c] * amp; ly = y;
        const x = x0 + (x1 - x0) * i / N; i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
      g.fillStyle = C.track; g.beginPath(); g.arc(x1, ly, 4, 0, 6.2832); g.fill();
      if (paused) {                                                    // bracket of one period T at the right end
        const px = (x1 - x0) / (win / T), xa = x1 - px, y = cy + amp + 5;
        g.strokeStyle = C.ink; g.lineWidth = 1.2; g.beginPath(); g.moveTo(xa, y - 3); g.lineTo(xa, y + 3); g.moveTo(x1, y - 3); g.lineTo(x1, y + 3); g.moveTo(xa, y); g.lineTo(x1, y); g.stroke();
        letter('T = ' + timeParts(T).join(' ').replace('.', ','), (xa + x1) / 2, y - 8, C.ink);
      }
    }
  }
  function xy(sc, T, t, paused) {
    const cx = W / 2 + 6, cy = H / 2, r = Math.min(W / 2 - 22, H / 2 - 16);
    g.strokeStyle = '#9a9588'; g.lineWidth = 1; g.beginPath(); g.moveTo(cx - r - 8, cy); g.lineTo(cx + r + 8, cy); g.moveTo(cx, cy - r - 8); g.lineTo(cx, cy + r + 8); g.stroke();
    letter('ξ', cx + r + 6, cy + 11); letter('ζ', cx + 10, cy - r - 6);
    if (paused) { letter('A', cx + r, cy - 9); letter('−A', cx - r, cy - 9); }
    g.strokeStyle = sc.colors[0]; g.lineWidth = 2; g.setLineDash([5, 4]); g.beginPath();
    for (let i = 0; i <= N; i++) { mode_probe(t - T + T * i / N); const x = cx + out[0] * r, y = cy - out[1] * r; i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke(); g.setLineDash([]);
    mode_probe(t); g.fillStyle = C.track; g.beginPath(); g.arc(cx + out[0] * r, cy - out[1] * r, 4.5, 0, 6.2832); g.fill();
  }
  let mode_probe = () => {};
  api.draw = (draw => (mode, t, paused) => { mode_probe = tt => mode.probe(tt, out); draw(mode, t, paused); })(api.draw);
  return api;
}
