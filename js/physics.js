// Wave physics shared by the modes (Vật lí 11 KNTT, Bài 8–9). Real values for readouts, clamped values for drawing.
export const SPEED = {air: 343, water: 1482, steel: 5960};          // m/s
export const MEDIUM = {air: 'Không khí', water: 'Nước', steel: 'Thép'};
export const HEARING = {min: 20, max: 20000};                     // Hz
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const TAU = Math.PI * 2;

export function describePitch(f) {
  if (f < HEARING.min) return {label: 'Hạ âm', audible: false};
  if (f <= 250) return {label: 'Âm trầm', audible: true};
  if (f <= 2000) return {label: 'Âm trung', audible: true};
  if (f <= HEARING.max) return {label: 'Âm cao', audible: true};
  return {label: 'Siêu âm', audible: false};
}
// Sound level (dB) → linear gain for WebAudio (100 dB = 1).
export const levelToGain = db => Math.pow(10, (clamp(db, 20, 100) - 100) / 70);

// Nice slow-motion factor (1, 2, 5 ·10ⁿ) so the drawn oscillation runs at about `target` Hz.
export function niceSlow(f, target = 1.6) {
  const want = Math.max(1, f / target), e = Math.floor(Math.log10(want));
  let best = 1, bd = Infinity;
  for (const m of [1, 2, 5, 10]) { const n = m * 10 ** e, d = Math.abs(Math.log(n / want)); if (d < bd) { bd = d; best = n; } }
  return 1 / best;
}

/**
 * Progressive wave started at the source (x = 0) at t = 0:
 *   u(x,t) = A·sin(ωt − kx) for x ≤ v·t, u = 0 beyond the front (the source starts from rest, so u is continuous at the front).
 * Drawing uses an on-screen wavelength `lamPx` (real λ mapped by `pxPerM`, clamped to a readable range).
 * `t` is the physical time (s) – already slowed down by the main loop.
 */
export function makeWave() {
  const w = {f: 440, v: 343, lam: 0, T: 0, lamPx: 100, clamped: 0, A: 10, k: 0.06, w: TAU * 440, front: 0, t: 0};
  w.set = (f, v, pxPerM, minPx, maxPx, A) => {
    w.f = f; w.v = v; w.lam = v / f; w.T = 1 / f;
    const raw = w.lam * pxPerM;
    w.lamPx = clamp(raw, minPx, maxPx);
    w.clamped = raw < minPx ? -1 : raw > maxPx ? 1 : 0;
    w.k = TAU / w.lamPx; w.w = TAU * f; w.A = A;
    return w;
  };
  w.at = t => { w.t = t; w.front = w.lamPx * w.f * t; return w; };   // drawn speed = λpx·f, so front and phase agree
  // displacement (px) of the layer whose rest position is x px from the source
  w.u = x => (x < 0 || x > w.front) ? 0 : w.A * Math.sin(w.w * w.t - w.k * x);
  // relative compression −∂u/∂x / (kA) ∈ [−1, 1]: > 0 nén, < 0 giãn (same formula as the colours)
  w.s = x => (x < 0 || x > w.front) ? 0 : Math.cos(w.w * w.t - w.k * x);
  // phase count f·t − x/λ: compression centres where it is an integer, rarefaction centres at half-integers
  w.cycles = () => w.f * w.t;
  return w;
}
