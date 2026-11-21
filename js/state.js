// Tiny store + event bus.
const listeners = new Map();
export const bus = {
  on(evt, fn) { let s = listeners.get(evt); if (!s) { s = new Set(); listeners.set(evt, s); } s.add(fn); return () => s.delete(fn); },
  emit(evt, payload) {
    const s = listeners.get(evt); if (!s) return;
    for (const fn of Array.from(s)) { try { fn(payload); } catch (e) { console.warn('bus handler error', evt, e); } }
  }
};
export const state = {
  mode: 'waves',
  playing: true,
  slow: 0.005,      // slow-motion factor: simulated seconds per real second
  t: 0,             // simulated physical time since the wave started (s)
  muted: true,      // sound off on first open; the speaker button turns it on
  track: true,
  lane: 'both',     // waves: both | rope | spring
  // sóng dọc – sóng âm
  f: 440,           // Hz (real)
  level: 70,        // dB (độ to) → drawn amplitude + audio gain
  medium: 'air',    // air | water
  source: 'speaker',// speaker | talker
  // sóng ngang – dây
  tf: 1,            // Hz (real, 0,2–5)
  tA: 5,            // cm (real amplitude)
  tv: 2,            // m/s (real propagation speed)
  // sóng mặt
  sf: 1,            // Hz
  sA: 7,            // cm
  sv: 1.56,         // m/s
  deep: true,       // nước sâu | nước nông
  orbits: true,     // show orbit outlines of the tracked particles
  // sóng điện từ
  band: 6,          // index into the 7 bands of Bảng 11.1 (0 = gamma … 6 = vô tuyến, default)
  emE: true, emB: true, emArrows: true,
  // sóng dừng
  stN: 3,           // số bụng sóng (1–6)
  stEnd: 'fixed',   // fixed (hai đầu cố định) | free (một đầu tự do)
  stA: 4,           // cm, biên độ bụng
  stv: 6,           // m/s
  stInc: false,     // show incident + reflected waves
  beadsOnly: false  // Chỉ phần tử (waves + standing)
};
export function set(key, value) { state[key] = value; bus.emit('change', {key, value}); }
