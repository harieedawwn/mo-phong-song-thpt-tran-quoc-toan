// DOM helpers + control builders and the app shell (tabs, panels, toolbar, play button).
import {state, bus, set} from './state.js';
import {slowText} from './fmt.js';

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
  em: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  ruler: '<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/>',
  tag: '<path d="M3 3h8l10 10-8 8L3 11z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  medium: '<path d="M3 8c3-2 6 2 9 0s6-2 9 0M3 16c3-2 6 2 9 0s6-2 9 0"/>',
  note: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  standing: '<path d="M2 12c3-6 7-6 10 0s7 6 10 0"/><path d="M2 12c3 6 7 6 10 0s7-6 10 0" stroke-dasharray="2 2.5"/>',
  beads: '<circle cx="5" cy="12" r="2.5"/><circle cx="12" cy="12" r="2.5"/><circle cx="19" cy="12" r="2.5"/>',
  source: '<rect x="3" y="6" width="6" height="12" rx="1"/><path d="M9 9l6-5v16l-6-5"/>'
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
// Segmented control (active = black fill). opts: [[value, label], ...]
export function seg(opts, get, setter, label) {
  return h('div', {class: 'seg seg-in', role: 'group', 'aria-label': label},
    ...opts.map(([v, t]) => {
      const b = h('button', {type: 'button', 'aria-pressed': 'false', onclick: () => setter(v)}, t);
      bind(() => b.setAttribute('aria-pressed', String(get() === v)));
      return b;
    }));
}
export function toggle(ic, label, get, setter, tip) {
  const b = h('button', {type: 'button', class: 'tg', 'aria-pressed': 'false', title: tip || label, 'aria-label': tip || label, onclick: () => setter(!get())}, icon(ic, 18), h('span', {text: label}));
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
// Log slider for the slow-motion factor (×1 … ×maxN, default ×100 000) snapped to 1-2-5 steps.
export function slowControl(maxN = 1e5) {
  const val = h('span', {class: 'val'});
  const LO = 1 / maxN, SPAN = Math.log10(maxN);  // decades
  const s = slider({min: 0, max: 1000, label: 'Làm chậm',
    pos: () => Math.round(1000 * (Math.log10(Math.min(1, Math.max(LO, state.slow))) - Math.log10(LO)) / SPAN),
    apply: p => {
      const n = Math.pow(10, SPAN * (1 - p / 1000)), e = Math.floor(Math.log10(n) + 1e-9), m = n / 10 ** e;
      const nice = (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * 10 ** e;
      if (Math.abs(1 / nice - state.slow) > 1e-12) set('slow', 1 / nice);
    },
    sync: () => { val.textContent = slowText(state.slow); }});
  return [lab('slow', 'Làm chậm', val), s];
}
export const lab = (ic, text, valEl) => h('div', {class: 'lab'}, h('span', {class: 'ic'}, icon(ic, 15), text), valEl || null);
// A controls group; `tab` is its id in the phone bottom sheet ("wave" | "show").
export const group = (tab, title, ...nodes) => h('section', {class: 'grp', 'data-grp': tab}, h('h2', {class: 'grp-h', text: title}), ...nodes);

const HELP = [
  'Nhấn Phát / Tạm dừng (phím cách): khi sóng chạy chỉ thấy các vật và hạt; khi tạm dừng sẽ hiện nhãn, thước λ và số liệu thật.',
  'Chọn loại sóng ở thanh phía trên hoặc nhấn phím 1–5. Sóng cơ có 4 chế độ con: ngang – dọc, sóng âm, sóng mặt, sóng dừng.',
  'Kéo thanh Làm chậm để quan sát rõ dao động của từng phần tử; hình đã làm chậm và phóng đại biên độ.',
  'Chấm đỏ là một phần tử được theo dõi: nó chỉ dao động quanh vị trí cân bằng, sóng không mang nó đi. Bật "Chỉ phần tử" để chỉ xem các hạt.',
  'Trong nước, nguồn là đầu phát âm dưới nước áp sát môi trường (loa trong không khí không đẩy âm vào nước tốt); cùng tần số, bước sóng trong nước dài gấp 4,32 lần.'
];

/* ---- app shell ---- */
export function mountShell({modes, onMode, onRestart, onToggle, onShot}) {
  const $ = id => document.getElementById(id);

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
    btnMute.replaceChildren(icon(state.muted ? 'mute' : 'vol', 20), h('span', {class: 'mlab', text: state.muted ? 'Âm: tắt' : 'Âm: bật'}));
    btnMute.dataset.muted = String(!!state.muted);
  };

  // mode tabs: level 1 = group (Sóng cơ | Sóng điện từ), level 2 = sub-tabs of the mech group
  const tabs = $('tabs');
  const subBtn = m => h('button', {type: 'button', role: 'tab', 'data-id': m.id, 'aria-selected': 'false', onclick: () => onMode(m.id)},
    icon(m.icon, 18), h('span', {class: 't-l', text: m.title}), h('span', {class: 't-s', text: m.short}));
  const mech = modes.filter(m => m.group === 'mech'), emM = modes.filter(m => m.group === 'em');
  const tabBtns = [...mech, ...emM].map(subBtn);
  const byId = id => tabBtns.find(b => b.dataset.id === id);
  let lastMech = (mech[0] || {}).id;
  const gMech = h('button', {type: 'button', role: 'tab', id: 'gb-mech', 'data-g': 'mech', 'aria-selected': 'false', onclick: () => onMode(lastMech)},
    icon(mech[0].icon, 18), h('span', {text: 'Sóng cơ'}));
  const gEm = h('button', {type: 'button', role: 'tab', id: 'gb-em', 'data-g': 'em', 'aria-selected': 'false', onclick: () => onMode(emM[0].id)},
    icon(emM[0].icon, 18), h('span', {text: 'Sóng điện từ'}));
  const main = h('div', {class: 'main', role: 'tablist', 'aria-label': 'Nhóm sóng'}, gMech, gEm);
  const sub = h('div', {class: 'sub', role: 'tablist', 'aria-label': 'Các loại sóng cơ'}, ...tabBtns.filter(b => mech.some(m => m.id === b.dataset.id)));
  tabs.removeAttribute('role'); tabs.removeAttribute('aria-label');
  tabs.append(main, sub);

  // controls + phone bottom-sheet tabs + phone bottom-sheet tabs
  const ctrl = $('ctrl'), grps = $('grps'), dock = $('dock');
  const DOCK = {wave: ['freq', 'Sóng'], show: ['eye', 'Hiển thị']};
  function buildControls(m) {
    clearBinds();
    const groups = m.controls();
    grps.replaceChildren(...groups);
    const ids = [...new Set(groups.map(g => g.dataset.grp))];
    ctrl.dataset.tab = 'none';
    dock.replaceChildren(...ids.map(k => h('button', {type: 'button', 'data-k': k, 'aria-pressed': 'false', onclick: () => { ctrl.dataset.tab = ctrl.dataset.tab === k ? 'none' : k; syncDock(); }}, icon(DOCK[k][0], 20), DOCK[k][1])));
    syncDock(); syncBinds();
  }
  function syncDock() { for (const b of dock.children) b.setAttribute('aria-pressed', String(b.dataset.k === ctrl.dataset.tab)); }
  ctrl.dataset.tab = 'none';

  // play / restart / speed chip
  const playLab = h('span', {text: 'Phát'});
  const btnPlay = h('button', {type: 'button', id: 'btn-play', 'data-playing': 'false', 'aria-label': 'Phát', onclick: onToggle},
    icon('play', 22, 'i-play'), icon('pause', 22, 'i-pause'), playLab);
  const btnRestart = h('button', {type: 'button', id: 'btn-restart', class: 'rbtn', 'aria-label': 'Bắt đầu lại', title: 'Bắt đầu lại', onclick: onRestart}, icon('reset', 20));
  $('play-wrap').append(btnRestart, btnPlay);
  function syncPlay() {
    const p = !!state.playing;
    btnPlay.dataset.playing = String(p);
    playLab.textContent = p ? 'Tạm dừng' : 'Phát';
    btnPlay.setAttribute('aria-label', playLab.textContent);
    btnPlay.setAttribute('aria-pressed', String(p));
  }
  bus.on('change', e => { if (e.key === 'muted') syncMute(); if (e.key === 'playing') syncPlay(); syncBinds(); });
  syncMute(); syncPlay();

  return {
    setMode(m) {
      for (const b of tabBtns) b.setAttribute('aria-selected', String(b.dataset.id === m.id));
      if (m.group === 'mech') lastMech = m.id;
      tabs.dataset.g = m.group;
      sub.hidden = m.group !== 'mech';
      gMech.setAttribute('aria-selected', String(m.group === 'mech'));
      gEm.setAttribute('aria-selected', String(m.group === 'em'));
      buildControls(m);
    }
  };
}
