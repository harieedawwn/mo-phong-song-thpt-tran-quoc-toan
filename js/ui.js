// DOM helpers + control builders (ported from legacy/js/ui.js) and the app shell (tabs, panels, toolbar, play button).
import {state, bus, set} from './state.js';
import {num, freqParts, timeParts, lenParts, speedParts, slowText} from './fmt.js';

export const PATHS = {
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4"/><path d="M12 17.5h.01"/>',
  full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  shot: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  vol: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/>',
  mute: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/>',
  play: '<path d="M7 4.5v15l13-7.5z" fill="currentColor"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  slow: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>',
  freq: '<path d="M2 12h2l2-6 3 12 3-12 3 12 3-12 2 6h2"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7.5h.01"/>',
  longitudinal: '<path d="M3 5v14M6 5v14M9 5v14M15 5v14M21 5v14"/>',
  transverse: '<path d="M2 12c2.5-7 5-7 7.5 0s5 7 7.5 0 3.5-5 5-3"/>',
  surface: '<path d="M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><circle cx="12" cy="15" r="3.5"/><path d="M12 11.5v.01"/>',
  em: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'
};
export function icon(name, size = 20, cls = '') {
  const s = document.createElement('span');
  s.className = 'ico ' + cls;
  s.innerHTML = '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (PATHS[name] || '') + '</svg>';
  return s;
}
export function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  if (props) for (const k in props) {
    const v = props[k];
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) { if (c == null || c === false) continue; e.append(c.nodeType ? c : document.createTextNode(c)); }
  return e;
}

/* ---- control builders: each registers a sync() that re-reads state ---- */
let binds = [];
export const bind = f => { binds.push(f); };
export const clearBinds = () => { binds = []; };
export const syncBinds = () => { for (const f of binds) { try { f(); } catch (e) { console.warn('UI sync', e); } } };

export function chip(content, isOn, onClick, cls) {
  const b = h('button', {type: 'button', class: 'chip ' + (cls || ''), 'aria-pressed': 'false', onclick: onClick}, content);
  bind(() => b.setAttribute('aria-pressed', String(!!isOn())));
  return b;
}
export function toggle(ic, label, get, setter) {
  const b = h('button', {type: 'button', class: 'tg', 'aria-pressed': 'false', title: label, onclick: () => setter(!get())}, icon(ic, 18), h('span', {text: label}));
  bind(() => b.setAttribute('aria-pressed', String(!!get())));
  return b;
}
// Flat slider: track + fill are two solid blocks under a transparent <input type=range>.
export function slider({min, max, step = 1, label, pos, apply, sync}) {
  const i = h('input', {type: 'range', min, max, step, 'aria-label': label});
  const wrap = h('div', {class: 'rng'}, h('i', {class: 'trk'}), h('i', {class: 'fil'}), i);
  const paint = () => wrap.style.setProperty('--p', ((+i.value - min) / (max - min) * 100) + '%');
  i.value = String(pos()); paint();
  i.addEventListener('input', () => { paint(); apply(+i.value); });
  bind(() => { if (document.activeElement !== i) { const p = String(pos()); if (i.value !== p) { i.value = p; paint(); } } if (sync) sync(); });
  return wrap;
}
export const lab = (ic, text, valEl) => h('div', {class: 'lab'}, h('span', {class: 'ic'}, icon(ic, 15), text), valEl || null);
// A controls group; `tab` is its id in the phone bottom sheet ("wave" | "show").
export const group = (tab, title, ...nodes) => h('section', {class: 'grp', 'data-grp': tab}, h('h2', {class: 'grp-h', text: title}), ...nodes);

const FEAT_TITLE = 'Đặc điểm';
const HELP = [
  'Chọn loại sóng ở thanh phía trên: sóng dọc, sóng ngang, sóng mặt, sóng điện từ.',
  'Nhấn Phát / Tạm dừng. Nút ↻ cho sóng xuất phát lại từ nguồn.',
  'Kéo thanh Làm chậm để quan sát rõ dao động của từng phần tử.',
  'Số liệu bên phải là giá trị thật (f, T, λ, v); hình vẽ đã làm chậm và phóng đại biên độ.',
  'λ = v·T = v/f: tăng tần số thì bước sóng ngắn lại (cùng môi trường).'
];

/* ---- app shell ---- */
export function mountShell({modes, onMode, onRestart, onToggle, onShot}) {
  const $ = id => document.getElementById(id);
  const mq = window.matchMedia ? window.matchMedia('(max-width: 999px), (max-height: 520px)') : {matches: false};

  // toolbar
  const tb = (id, ic, label, fn, cls) => h('button', {type: 'button', id, class: 'tbtn ' + (cls || ''), 'aria-label': label, title: label, onclick: fn}, icon(ic, 20));
  const btnMute = tb('btn-mute', 'vol', 'Tắt tiếng', () => set('muted', !state.muted));
  const canFull = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
  const btnFull = tb('btn-full', 'full', 'Toàn màn hình', () => {
    try {
      const d = document.documentElement;
      if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else (d.requestFullscreen || d.webkitRequestFullscreen).call(d);
    } catch (e) { console.warn(e); }
  }, 'desk');
  btnFull.hidden = !canFull;
  const modal = $('modal');
  const openHelp = () => { modal.hidden = false; modal.querySelector('button').focus(); };
  const closeHelp = () => { modal.hidden = true; };
  $('tools').append(
    tb('btn-help', 'help', 'Hướng dẫn sử dụng', openHelp), btnMute, btnFull,
    tb('btn-shot', 'shot', 'Chụp ảnh màn hình sân khấu', onShot, 'desk'),
    tb('btn-restart-top', 'reset', 'Bắt đầu lại', onRestart, 'desk'));
  modal.querySelector('ul').append(...HELP.map(t => h('li', {text: t})));
  modal.querySelector('button').addEventListener('click', closeHelp);
  modal.addEventListener('click', e => { if (e.target === modal) closeHelp(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeHelp(); });
  const syncMute = () => {
    btnMute.setAttribute('aria-pressed', String(state.muted));
    btnMute.title = state.muted ? 'Bật tiếng' : 'Tắt tiếng'; btnMute.setAttribute('aria-label', btnMute.title);
    btnMute.replaceChildren(icon(state.muted ? 'mute' : 'vol', 20));
  };

  // mode tabs
  const tabs = $('tabs');
  const tabBtns = modes.map(m => h('button', {type: 'button', role: 'tab', 'data-id': m.id, 'aria-selected': 'false', onclick: () => onMode(m.id)},
    icon(m.icon, 18), h('span', {class: 't-l', text: m.title}), h('span', {class: 't-s', text: m.short})));
  tabs.append(...tabBtns);

  // metrics
  const cells = {};
  const metric = (key, long, sym) => {
    const v = h('b', {class: 'm-val'});
    cells[key] = {v, last: ''};
    return h('div', {class: 'metric'}, h('span', {class: 'm-lab'}, h('span', {class: 'l', text: long + ' '}), h('span', {class: 's', text: sym})), v);
  };
  $('metrics').append(metric('f', 'Tần số', 'f'), metric('T', 'Chu kì', 'T'), metric('l', 'Bước sóng', 'λ'), metric('v', 'Tốc độ', 'v'));
  $('formula').append('λ = ', h('b', {text: 'v'}), '·T = ', h('b', {text: 'v'}), '/f');
  const put = (c, parts) => { const t = parts[0] + '|' + parts[1]; if (c.last !== t) { c.last = t; c.v.replaceChildren(parts[0], h('small', {text: parts[1]})); } };
  function syncMetrics(m) {
    const {f, v} = m.sources;
    put(cells.f, freqParts(f)); put(cells.T, timeParts(1 / f)); put(cells.l, lenParts(v / f)); put(cells.v, speedParts(v));
  }

  // controls + Đặc điểm card + phone bottom-sheet tabs
  const ctrl = $('ctrl'), grps = $('grps'), dock = $('dock'), infoIn = $('info-in');
  const featBody = h('div', {class: 'feat'}, h('h2', {class: 'grp-h', text: FEAT_TITLE}));
  const featGrp = h('section', {class: 'grp', 'data-grp': 'feat'});
  const DOCK = {wave: ['freq', 'Sóng'], show: ['eye', 'Hiển thị'], feat: ['info', FEAT_TITLE]};
  // Đặc điểm card lives in the right panel on desktop and in the bottom sheet on phones
  function placeFeat() {
    if (mq.matches) { featGrp.replaceChildren(featBody); grps.append(featGrp); }
    else { featGrp.remove(); infoIn.append(featBody); }
    const ids = [...grps.children].map(g => g.dataset.grp);
    if (!ids.includes(ctrl.dataset.tab)) ctrl.dataset.tab = 'none';
  }
  function buildControls(m) {
    clearBinds();
    const groups = m.controls();
    grps.replaceChildren(...groups);
    featBody.replaceChildren(featBody.firstChild, ...m.features().map(([k, v]) => h('div', {class: 'feat-row'}, h('span', {class: 'k', text: k}), h('span', {class: 'vv', text: v}))));
    const ids = [...groups.map(g => g.dataset.grp), 'feat'];
    ctrl.dataset.tab = 'none';
    dock.replaceChildren(...ids.map(k => h('button', {type: 'button', 'data-k': k, 'aria-pressed': 'false', onclick: () => { ctrl.dataset.tab = ctrl.dataset.tab === k ? 'none' : k; syncDock(); }}, icon(DOCK[k][0], 20), DOCK[k][1])));
    placeFeat(); syncDock(); syncBinds();
  }
  function syncDock() { for (const b of dock.children) b.setAttribute('aria-pressed', String(b.dataset.k === ctrl.dataset.tab)); }
  ctrl.dataset.tab = 'none';
  if (mq.addEventListener) mq.addEventListener('change', placeFeat);

  // play / restart / speed chip
  const playLab = h('span', {text: 'Phát'});
  const btnPlay = h('button', {type: 'button', id: 'btn-play', 'data-playing': 'false', 'aria-label': 'Phát', onclick: onToggle},
    icon('play', 22, 'i-play'), icon('pause', 22, 'i-pause'), playLab);
  const spd = h('span', {class: 'spd', title: 'Hệ số làm chậm'});
  const btnRestart = h('button', {type: 'button', id: 'btn-restart', class: 'rbtn', 'aria-label': 'Bắt đầu lại', title: 'Bắt đầu lại', onclick: onRestart}, icon('reset', 20));
  $('play-wrap').append(btnRestart, btnPlay, spd);
  const badges = $('badges');
  function syncPlay() {
    const p = !!state.playing;
    btnPlay.dataset.playing = String(p);
    playLab.textContent = p ? 'Tạm dừng' : 'Phát';
    btnPlay.setAttribute('aria-label', playLab.textContent);
    btnPlay.setAttribute('aria-pressed', String(p));
  }
  function syncBadges() {
    spd.replaceChildren(icon('slow', 15), 'Làm chậm ' + slowText(state.slow));
    badges.replaceChildren(...(state.slow < 1 ? [h('span', {class: 'badge', text: 'Đã làm chậm ' + slowText(state.slow)})] : []));
  }

  bus.on('change', e => { if (e.key === 'muted') syncMute(); if (e.key === 'playing') syncPlay(); if (e.key === 'slow') syncBadges(); syncBinds(); });
  syncMute(); syncPlay(); syncBadges();

  return {
    setMode(m) {
      for (const b of tabBtns) b.setAttribute('aria-selected', String(b.dataset.id === m.id));
      buildControls(m); syncMetrics(m); syncBadges();
    }
  };
}
