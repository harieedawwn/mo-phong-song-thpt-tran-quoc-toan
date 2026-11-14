// Tiny store + event bus (ported from legacy, trimmed for the 2D app).
const listeners = new Map();
export const bus = {
  on(evt, fn) { let s = listeners.get(evt); if (!s) { s = new Set(); listeners.set(evt, s); } s.add(fn); return () => s.delete(fn); },
  emit(evt, payload) {
    const s = listeners.get(evt); if (!s) return;
    for (const fn of Array.from(s)) { try { fn(payload); } catch (e) { console.warn('bus handler error', evt, e); } }
  }
};
export const state = {
  mode: 'longitudinal',
  playing: true,
  slow: 0.005,      // slow-motion factor: simulated seconds per real second
  t: 0,             // simulated physical time since the wave started (s)
  muted: false,
  labels: true, ruler: true, track: true,
  // sóng dọc – sóng âm
  f: 440,           // Hz (real)
  level: 70,        // dB (độ to) → drawn amplitude + audio gain
  medium: 'air',    // air | water | steel
  source: 'speaker',// speaker | talker
  sound: 'tone'     // tone (âm đơn) | voice (giọng nói)
};
export function set(key, value) { state[key] = value; bus.emit('change', {key, value}); }
