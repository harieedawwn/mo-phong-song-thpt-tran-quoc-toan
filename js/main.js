// Boot, render loop, canvas sizing, mode routing. Exposes window.__app for the checker.
import {state, bus, set} from './state.js';
import {mountShell} from './ui.js';
import {makeGrid} from './draw/grid.js';
import {setBallDpr} from './draw/ball.js';
import {fx, C, font, textW, roundRect} from './draw/ink.js';
import {freqParts, timeParts, lenParts, speedParts} from './fmt.js';
import waves from './modes/waves.js';
import sound from './modes/sound.js';
import surface from './modes/surface.js';
import em from './modes/em.js';
import {makeScope} from './scope.js';
import './audio.js';

const MODES = [waves, sound, surface, em];
const ALIAS = {transverse: 'waves', longitudinal: 'sound'};   // old #mode= links keep working
const byId = id => MODES.find(m => m.id === (ALIAS[id] || id));
const canvas = document.getElementById('cv'), stage = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const scope = makeScope(document.getElementById('sc')), scopeEl = document.getElementById('scope'), zbtn = document.getElementById('zreset');
let scopeOn = false;
// stage zoom (1×–4×): canvas transform x' = z·x + px, y' = z·y + py; pointer hits use the inverse
const view = {z: 1, px: 0, py: 0};
const clampView = () => { view.px = Math.min(0, Math.max(W * (1 - view.z), view.px)); view.py = Math.min(0, Math.max(H * (1 - view.z), view.py)); };
function zoomAt(mx, my, z2) {
  z2 = Math.min(4, Math.max(1, z2)); if (z2 < 1.02) z2 = 1;
  view.px = mx - (mx - view.px) * z2 / view.z; view.py = my - (my - view.py) * z2 / view.z; view.z = z2;
  clampView(); zbtn.hidden = view.z === 1; dirty = true;
}
const resetView = () => { view.z = 1; view.px = view.py = 0; zbtn.hidden = true; dirty = true; };
let mode = MODES[0], W = 0, H = 0, grid = null, dirty = true, raf = 0, last = 0, fadeT0 = 0;
const FADE = 250, calm = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
// annotations (annotate()) exist only while paused: fade in over 0,25 s after Pause, vanish at once on Play
function startFade() { if (calm) fx.a = 1; else { fx.a = 0; fadeT0 = performance.now(); } }

function play() { set('playing', true); }
function pause() { set('playing', false); }
function toggle() { state.playing ? pause() : play(); }
function restart() { state.t = 0; if (mode.reset) mode.reset(); dirty = true; }
function modeFromHash() { const m = /mode=([a-z]+)/.exec(location.hash); return m && byId(m[1]) ? byId(m[1]).id : null; }

const ui = mountShell({
  modes: MODES, onMode: id => setMode(id), onRestart: restart, onToggle: toggle,
  onShot() {
    draw(!state.playing);
    canvas.toBlob(b => {
      if (!b) return;
      const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'song-' + mode.id + '.png';
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });
  }
});

function setMode(id) {
  const m = byId(id) || MODES[0];
  if (mode && mode !== m && mode.leave) mode.leave();
  mode = m; state.t = 0; resetView(); if (m.reset) m.reset();
  set('mode', m.id);
  set('slow', m.defaults.slow);
  m.layout(W, H);
  ui.setMode(m);
  try { history.replaceState(null, '', '#mode=' + m.id); } catch (e) { /* in-app browsers may refuse */ }
  dirty = true;
}

function resize() {
  const phone = innerWidth < 1000;
  const dpr = Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 2);
  W = stage.clientWidth; H = stage.clientHeight;
  if (!W || !H) return;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  setBallDpr(dpr);
  grid = makeGrid(W, H, dpr);
  mode.layout(W, H);
  bus.emit('change', {key: 'layout'});
  clampView(); scopeOn = scopeEl.offsetParent !== null && scope.resize();
  dirty = true;
}

// readout chip (paused only): line 1 = real f · T · λ · v from metrics(), line 2 (muted) = mode.readout()
const parts = p => p[0] + ' ' + p[1];
function chip() {
  const {f, v} = mode.metrics(), n2 = mode.readout && H >= 440 ? mode.readout() : '';   // short stage (phone landscape): one line only
  const items = ['f = ' + parts(freqParts(f)), 'T = ' + parts(timeParts(1 / f)), 'λ = ' + parts(lenParts(v / f)), 'v = ' + parts(speedParts(v))];
  const fs = W < 600 ? 11 : 12.5, pad = 9, lh = fs + 5;
  ctx.font = font(fs, 700, true);
  const one = items.join(' · '), split = textW(ctx, one) + 2 * pad > W - 16;
  const rows = split ? [items.slice(0, 2).join(' · '), items.slice(2).join(' · ')] : [one];
  ctx.font = font(fs - 1.5, 600);
  const sub = n2 || '', subW = sub ? textW(ctx, sub) : 0;
  ctx.font = font(fs, 700, true);
  const w = Math.min(W - 16, Math.max(subW, ...rows.map(r => textW(ctx, r))) + 2 * pad), hh = (rows.length + (sub ? 0.85 : 0)) * lh + 8;
  ctx.beginPath(); roundRect(ctx, 8, 8, w, hh, 8); ctx.fillStyle = 'rgba(255,255,255,.94)'; ctx.fill();
  ctx.lineWidth = 1.5; ctx.strokeStyle = C.ink; ctx.stroke();
  ctx.fillStyle = C.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  rows.forEach((r, i) => ctx.fillText(r, 8 + pad, 8 + 4 + lh * (i + 0.5) + 0.5));
  if (sub) { ctx.font = font(fs - 1.5, 600); ctx.fillStyle = C.muted; ctx.fillText(sub, 8 + pad, 8 + 4 + lh * (rows.length + 0.4) + 0.5); }
}
function draw(annotate) {
  if (!grid) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(grid, 0, 0);
  const k = canvas.width / W;
  ctx.setTransform(k * view.z, 0, 0, k * view.z, k * view.px, k * view.py);
  mode.draw(ctx, W, H);
  if (annotate && fx.a > 0) {
    ctx.globalAlpha = fx.a; fx.shadow = true;
    if (mode.annotate) mode.annotate(ctx, W, H);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    chip();
    fx.shadow = false; ctx.globalAlpha = 1;
  }
  if (scopeOn) { scopeEl.hidden = !state.track; if (state.track) scope.draw(mode, state.t, !!annotate); }
}

function frame(ts) {
  raf = requestAnimationFrame(frame);
  const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
  if (!state.playing && fx.a < 1) { const e = Math.min(1, Math.max(0, (performance.now() - fadeT0) / FADE)); fx.a = e * (2 - e); dirty = true; }
  if (state.playing) { const sdt = dt * state.slow; state.t += sdt; mode.update(sdt); draw(false); dirty = false; }
  else if (dirty) { draw(true); dirty = false; }
}
function startLoop() { cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(frame); }

bus.on('change', e => {
  if (e.key === 'playing') { if (state.playing) fx.a = 0; else startFade(); }
  dirty = true;
});
// stage pointer: tap → mode.pointer (inverse zoom transform); wheel / pinch zoom, drag pans, double-click resets
const pts = new Map();
let g0 = null;                                     // gesture start: {x, y, px, py, moved, d, z}
const local = e => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)]; };
canvas.addEventListener('wheel', e => {
  e.preventDefault(); const [x, y] = local(e);
  zoomAt(x, y, view.z * Math.exp(-e.deltaY * (e.deltaMode ? 0.05 : 0.0016)));
}, {passive: false});
canvas.addEventListener('dblclick', resetView);
zbtn.addEventListener('click', resetView);
canvas.addEventListener('pointerdown', e => {
  if (e.button && e.button !== 0) return;
  const [x, y] = local(e); pts.set(e.pointerId, [x, y]);
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  g0 = {x, y, px: view.px, py: view.py, moved: false, d: 0, z: view.z};
  if (pts.size === 2) { const [a, b] = [...pts.values()]; g0.d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1; g0.moved = true; }
});
canvas.addEventListener('pointermove', e => {
  if (!pts.has(e.pointerId) || !g0) return;
  const [x, y] = local(e); pts.set(e.pointerId, [x, y]);
  if (pts.size >= 2 && g0.d) {
    const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
    zoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, g0.z * d / g0.d); return;
  }
  if (!g0.moved && Math.hypot(x - g0.x, y - g0.y) < 6) return;
  g0.moved = true;
  if (view.z > 1) { view.px = g0.px + x - g0.x; view.py = g0.py + y - g0.y; clampView(); dirty = true; }
});
function up(e) {
  if (!pts.has(e.pointerId)) return;
  const tap = g0 && !g0.moved && pts.size === 1 && e.type === 'pointerup';
  pts.delete(e.pointerId); if (pts.size === 0) { if (tap && mode.pointer) { const [x, y] = local(e); mode.pointer((x - view.px) / view.z, (y - view.py) / view.z); dirty = true; } g0 = null; }
  else if (g0) { g0.moved = true; g0.d = 0; }
}
canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
addEventListener('keydown', e => {
  if (e.key === 'Escape') return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const t = e.target, tag = t && t.tagName;
  if (tag === 'INPUT' && t.type !== 'range') return;
  if (e.key >= '1' && e.key <= String(MODES.length)) { setMode(MODES[+e.key - 1].id); return; }
  // Space toggles play/pause unless a button/link has focus (it would click it itself)
  if ((e.key === ' ' || e.code === 'Space') && tag !== 'BUTTON' && tag !== 'A' && tag !== 'SELECT') { e.preventDefault(); toggle(); }
});
new ResizeObserver(resize).observe(stage);
addEventListener('hashchange', () => { const id = modeFromHash(); if (id && id !== mode.id) setMode(id); });
document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(raf); else startLoop(); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { dirty = true; });

if (calm) state.playing = false;
fx.a = state.playing ? 0 : 1;
window.__app = {play, pause, restart, setMode, zoomAt: (z, x = W / 2, y = H / 2) => zoomAt(x, y, z), resetView, get mode() { return mode.id; }, state};
if (/src=talker/.test(location.hash)) state.source = 'talker';   // checker / teacher link: #mode=sound&src=talker
{ const mm = /med=(air|water)/.exec(location.hash); if (mm) state.medium = mm[1]; }   // checker / teacher link: #mode=sound&med=water
setMode(modeFromHash() || 'waves');
resize();
startLoop();
// make sure canvas text uses the web fonts as soon as they are loaded
if (document.fonts && document.fonts.load) ['800 20px "Be Vietnam Pro"', '600 14px "Be Vietnam Pro"', '700 14px "JetBrains Mono"'].forEach(f => document.fonts.load(f).then(() => { dirty = true; }).catch(() => {}));
