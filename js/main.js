// Boot, render loop, canvas sizing, mode routing. Exposes window.__app for the checker.
import {state, bus, set} from './state.js';
import {mountShell} from './ui.js';
import {makeGrid} from './draw/grid.js';
import {fx} from './draw/ink.js';
import longitudinal from './modes/longitudinal.js';
import transverse from './modes/transverse.js';
import surface from './modes/surface.js';
import em from './modes/em.js';
import './audio.js';

const MODES = [longitudinal, transverse, surface, em];
const byId = id => MODES.find(m => m.id === id);
const canvas = document.getElementById('cv'), stage = document.getElementById('stage');
const ctx = canvas.getContext('2d');
let mode = MODES[0], W = 0, H = 0, grid = null, dirty = true, raf = 0, last = 0, fadeT0 = 0;
const FADE = 400, calm = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
// labels fade in over 0,4 s while the wave starts again from the source (t = 0)
function startFade() { if (!calm) { fx.a = 0; fadeT0 = performance.now(); } }

function play() { set('playing', true); }
function pause() { set('playing', false); }
function toggle() { state.playing ? pause() : play(); }
function restart() { state.t = 0; if (mode.reset) mode.reset(); startFade(); dirty = true; }
function modeFromHash() { const m = /mode=([a-z]+)/.exec(location.hash); return m && byId(m[1]) ? m[1] : null; }

const ui = mountShell({
  modes: MODES, onMode: id => setMode(id), onRestart: restart, onToggle: toggle,
  onShot() {
    draw();
    canvas.toBlob(b => {
      if (!b) return;
      const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'song-' + mode.id + '.png';
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });
  }
});

function setMode(id) {
  const m = byId(id) || MODES[0];
  if (mode.hover) mode.hover(-1, -1);
  mode = m; state.t = 0; if (m.reset) m.reset(); startFade(); canvas.style.cursor = '';
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
  grid = makeGrid(W, H, dpr);
  mode.layout(W, H);
  bus.emit('change', {key: 'layout'});
  dirty = true;
}

function draw() {
  if (!grid) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(grid, 0, 0);
  ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  mode.draw(ctx, W, H);
}

function frame(ts) {
  raf = requestAnimationFrame(frame);
  const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
  if (fx.a < 1) { const e = Math.min(1, Math.max(0, (performance.now() - fadeT0) / FADE)); fx.a = e * (2 - e); dirty = true; }
  if (state.playing) { const sdt = dt * state.slow; state.t += sdt; mode.update(sdt); draw(); dirty = false; }
  else if (dirty) { draw(); dirty = false; }
}
function startLoop() { cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(frame); }

bus.on('change', () => { dirty = true; });
// taps on the stage go to the current mode (e.g. select an anatomy part); Esc clears
canvas.addEventListener('pointerdown', e => {
  if (!mode.pointer || (e.button && e.button !== 0)) return;
  const r = canvas.getBoundingClientRect();
  mode.pointer((e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height));
  dirty = true;
});
// mouse hover over a tappable part (anatomy, spectrum block): highlight + hand cursor. Touch has no hover: tap selects.
canvas.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse' || !mode.hover) return;
  const r = canvas.getBoundingClientRect();
  const on = mode.hover((e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height));
  const c = on ? 'pointer' : '';
  if (canvas.style.cursor !== c) canvas.style.cursor = c;
});
canvas.addEventListener('pointerleave', () => { if (mode.hover) mode.hover(-1, -1); canvas.style.cursor = ''; });
addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (mode.escape) { mode.escape(); dirty = true; } return; }
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

if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) state.playing = false;
window.__app = {play, pause, restart, setMode, get mode() { return mode.id; }, state};
if (/src=talker/.test(location.hash)) state.source = 'talker';   // checker / teacher link: #mode=longitudinal&src=talker
setMode(modeFromHash() || 'longitudinal');
resize();
startLoop();
// make sure canvas text uses the web fonts as soon as they are loaded
if (document.fonts && document.fonts.load) ['800 20px "Be Vietnam Pro"', '600 14px "Be Vietnam Pro"', '700 14px "JetBrains Mono"'].forEach(f => document.fonts.load(f).then(() => { dirty = true; }).catch(() => {}));
