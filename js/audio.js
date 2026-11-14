// WebAudio tone for the sound-wave mode.
// The AudioContext is created on the first user tap (autoplay rules, Zalo in-app browser).
// Sounds only while: mode = longitudinal, playing, not muted, f inside 20 Hz – 20 kHz.
import {state, bus} from './state.js';
import {levelToGain, HEARING} from './physics.js';

let ctx = null, master = null, voice = null, voiceType = null, unlocked = false;

function init() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); return true; }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0;
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -6; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.003; lim.release.value = 0.1;
    master.connect(lim); lim.connect(ctx.destination);
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return true;
  } catch (e) { console.warn('Audio init failed', e); ctx = null; master = null; return false; }
}

// tone = pure sine (âm đơn); voice = sawtooth "glottal" source through vowel formant filters (giọng nói)
function makeVoice(type, f) {
  const c = ctx, out = c.createGain(), nodes = [];
  out.gain.value = 0; out.connect(master);
  const o = c.createOscillator(); nodes.push(o);
  if (type === 'voice') {
    o.type = 'sawtooth'; o.frequency.value = f;
    for (const [fc, g, q] of [[800, 1, 8], [1150, 0.7, 10], [2900, 0.4, 12], [3900, 0.2, 12]]) {
      const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = fc; b.Q.value = q;
      const gg = c.createGain(); gg.gain.value = g * 3;
      o.connect(b); b.connect(gg); gg.connect(out);
    }
  } else { o.type = 'sine'; o.frequency.value = f; o.connect(out); }
  o.start();
  out.gain.setTargetAtTime(type === 'voice' ? 0.55 : 0.6, c.currentTime, 0.013);
  return {
    setF: x => o.frequency.setTargetAtTime(x, c.currentTime, 0.01),
    stop() {
      try { out.gain.setTargetAtTime(0, c.currentTime, 0.013); } catch (e) { /* closed */ }
      setTimeout(() => { try { o.stop(); out.disconnect(); } catch (e) { /* already stopped */ } }, 160);
    }
  };
}
function stopVoice() { if (voice) { voice.stop(); voice = null; voiceType = null; } }

function sync() {
  const f = state.f;
  const want = unlocked && state.mode === 'longitudinal' && state.playing && !state.muted && f >= HEARING.min && f <= HEARING.max;
  if (!want) { if (master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.02); if (voice) setTimeout(() => { if (!wanted()) stopVoice(); }, 200); return; }
  if (!init()) return;
  if (!voice || voiceType !== state.sound) { stopVoice(); voiceType = state.sound; voice = makeVoice(voiceType, f); }
  else voice.setF(f);
  const cap = f > 16000 ? 0.35 : 1;
  master.gain.setTargetAtTime(0.8 * levelToGain(state.level) * cap, ctx.currentTime, 0.015);
}
function wanted() { return unlocked && state.mode === 'longitudinal' && state.playing && !state.muted; }

const WATCH = new Set(['f', 'level', 'sound', 'muted', 'playing', 'mode']);
bus.on('change', e => { if (e && WATCH.has(e.key)) sync(); });
// first tap anywhere unlocks audio (required by browsers); later taps just resume a suspended context
function unlock() { unlocked = true; init(); sync(); }
addEventListener('pointerdown', unlock, {capture: true});
addEventListener('keydown', unlock, {capture: true});
document.addEventListener('visibilitychange', () => { if (ctx) { if (document.hidden) ctx.suspend().catch(() => {}); else ctx.resume().catch(() => {}); } });
