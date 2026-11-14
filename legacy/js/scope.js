const CSS = `
.sc-root{background:#fff;border:1px solid #dde3ec;border-radius:12px;font:13px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--ink,#1b2430);overflow:hidden}
.sc-root>summary{cursor:pointer;padding:9px 12px;font-weight:700;list-style:none;display:flex;align-items:center}
.sc-root>summary::-webkit-details-marker{display:none}
.sc-root>summary::after{content:"▾";margin-left:auto;color:var(--accent,#3b5bdb);transition:transform .2s}
.sc-root:not([open])>summary::after{transform:rotate(-90deg)}
.sc-tabs{display:flex;gap:4px;padding:0 10px 6px}
.sc-tab{flex:1;font:600 12px system-ui,sans-serif;background:var(--paper,#f4f6fa);border:1px solid #dde3ec;border-radius:8px;padding:5px 4px;cursor:pointer;color:inherit}
.sc-tab.sc-on{background:var(--accent,#3b5bdb);border-color:var(--accent,#3b5bdb);color:#fff}
.sc-wrap{padding:0 10px 10px}
.sc-canvas{display:block;width:100%;height:150px;border-radius:8px;background:var(--paper,#f4f6fa)}
.sc-cap{margin-top:4px;font-size:12px;opacity:.8}
`;

function injectStyle() {
  if (typeof document === 'undefined' || document.getElementById('sc-style')) return;
  const s = document.createElement('style');
  s.id = 'sc-style';
  s.textContent = CSS;
  document.head.appendChild(s);
}

const h = (tag, cls, txt) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
};

let depsP = null;
function deps() {
  if (!depsP) {
    depsP = (async () => {
      const d = {};
      const imp = async (k, p) => {
        try { d[k] = await import(p); } catch (e) { console.warn('[scope] cannot load ' + p, e && e.message); }
      };
      await Promise.all([imp('st', './state.js'), imp('au', './audio.js'), imp('ph', './physics.js')]);
      return d;
    })();
  }
  return depsP;
}

const num = (x, d = 3) => (isFinite(x) ? String(Number(x.toPrecision(d))).replace('.', ',') : '—');
const fmtT = (T) => (T >= 1 ? num(T) + ' s' : T >= 1e-3 ? num(T * 1e3) + ' ms' : num(T * 1e6) + ' µs');

export function mountScope(el) {
  if (!el) return;
  injectStyle();
  let D = {};
  deps().then((d) => { D = d; });
  const S = () => (D.st && D.st.state) || null;

  const root = h('details', 'sc-root');
  root.open = true;
  root.appendChild(h('summary', null, 'Máy hiện sóng'));
  const tabs = h('div', 'sc-tabs');
  const names = ['Dạng sóng', 'Phổ tần số', 'Áp suất tại tai'];
  let tab = 0;
  const tabEls = names.map((n, i) => {
    const b = h('button', 'sc-tab' + (i === 0 ? ' sc-on' : ''), n);
    b.type = 'button';
    b.onclick = () => { tab = i; tabEls.forEach((t, k) => t.classList.toggle('sc-on', k === i)); };
    tabs.appendChild(b);
    return b;
  });
  const wrap = h('div', 'sc-wrap');
  const canvas = h('canvas', 'sc-canvas');
  const cap = h('div', 'sc-cap');
  wrap.append(canvas, cap);
  root.append(tabs, wrap);
  el.textContent = '';
  el.appendChild(root);

  let ctx = null;
  try { ctx = canvas.getContext('2d'); } catch (e) { ctx = null; }
  if (!ctx) { cap.textContent = 'Trình duyệt không hỗ trợ vẽ đồ thị.'; return; }

  const HIST = 12 * 30;
  const ring = new Float32Array(HIST);
  let ringN = 0;
  let wave = null, spec = null;
  let W = 0, H = 0, dpr = 1;
  const cssVar = (n, fb) => {
    try { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || fb; } catch (e) { return fb; }
  };

  function resize() {
    const w = canvas.clientWidth || 300, hh = canvas.clientHeight || 150;
    const r = Math.min(window.devicePixelRatio || 1, 2);
    if (w !== W || hh !== H || r !== dpr) {
      W = w; H = hh; dpr = r;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function text(s, x, y, color, align) {
    ctx.fillStyle = color; ctx.textAlign = align || 'left';
    ctx.fillText(s, x, y);
  }

  function drawWave(st, c) {
    const live = st.live || {};
    const f = Math.max(1, live.frequency || st.frequency || 440);
    const T = 1 / f;
    const mid = H / 2, amp = H * 0.38;
    ctx.strokeStyle = '#cfd7e3'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke();
    const au = D.au && D.au.audio;
    const an = au && au.analyser;
    let real = false;
    ctx.strokeStyle = c.accent; ctx.lineWidth = 2; ctx.beginPath();
    if (an && live.active && au.getWaveform) {
      if (!wave || wave.length !== an.fftSize) wave = new Float32Array(an.fftSize);
      au.getWaveform(wave);
      const sr = (an.context && an.context.sampleRate) || 44100;
      const span = Math.min(wave.length - 1, Math.max(64, Math.round(3 * T * sr)));
      let s0 = 0;
      const lim = wave.length - span;
      for (let i = 1; i < lim; i++) if (wave[i - 1] < 0 && wave[i] >= 0) { s0 = i; break; }
      let peak = 0.02;
      for (let i = 0; i < wave.length; i++) { const a = Math.abs(wave[i]); if (a > peak) peak = a; }
      for (let x = 0; x < W; x++) {
        const y = mid - (wave[s0 + Math.floor((x / W) * span)] / Math.max(peak, 0.3)) * amp;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      real = true;
    } else {
      const a = live.active ? Math.min(1, 0.15 + ((live.level || 60) - 20) / 100) * (live.env == null ? 1 : live.env) : 0.5;
      for (let x = 0; x < W; x++) {
        const y = mid - Math.sin((x / W) * 3 * 2 * Math.PI) * amp * a;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    // period mark: one period = W/3
    const pw = W / 3, y0 = H - 14;
    ctx.strokeStyle = c.comp; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(8, y0); ctx.lineTo(8 + pw, y0);
    ctx.moveTo(8, y0 - 4); ctx.lineTo(8, y0 + 4);
    ctx.moveTo(8 + pw, y0 - 4); ctx.lineTo(8 + pw, y0 + 4);
    ctx.stroke();
    text('T = ' + fmtT(T), 8 + pw / 2, y0 - 6, c.comp, 'center');
    text('f = ' + num(f) + ' Hz', W - 8, 14, c.ink, 'right');
    cap.textContent = real ? 'Tín hiệu thật từ nguồn âm (3 chu kì).' : 'Dạng sóng minh họa (3 chu kì). Bấm phát để xem tín hiệu thật.';
  }

  function drawSpectrum(st, c) {
    const live = st.live || {};
    const FMIN = 10, FMAX = 24000;
    const lg0 = Math.log10(FMIN), lg1 = Math.log10(FMAX);
    const X = (f) => ((Math.log10(Math.max(f, FMIN)) - lg0) / (lg1 - lg0)) * W;
    const base = H - 18;
    ctx.fillStyle = 'rgba(59,91,219,0.10)';
    ctx.fillRect(X(20), 0, X(20000) - X(20), base);
    text('Vùng nghe được 20–20000 Hz', X(20) + 4, 12, c.accent);
    const au = D.au && D.au.audio;
    const an = au && au.analyser;
    ctx.fillStyle = c.accent;
    if (an && live.active && au.getSpectrum) {
      if (!spec || spec.length !== an.frequencyBinCount) spec = new Uint8Array(an.frequencyBinCount);
      au.getSpectrum(spec);
      const sr = (an.context && an.context.sampleRate) || 44100;
      const binHz = sr / an.fftSize;
      const colMax = new Float32Array(Math.ceil(W) + 1);
      for (let i = 1; i < spec.length; i++) {
        const xi = Math.floor(X(i * binHz));
        if (xi >= 0 && xi < colMax.length && spec[i] > colMax[xi]) colMax[xi] = spec[i];
      }
      for (let x = 0; x < W; x++) {
        const v = colMax[x] / 255;
        if (v > 0) ctx.fillRect(x, base - v * (base - 18), 1, v * (base - 18));
      }
      cap.textContent = 'Phổ thật của âm đang phát (trục tần số theo thang log).';
    } else {
      const f = live.frequency || st.frequency || 440;
      const nh = st.timbre === 'sine' ? 1 : st.timbre === 'rich' ? 8 : 5;
      for (let n = 1; n <= nh; n++) {
        const hh = (base - 18) * (live.active ? 1 : 0.5) / n;
        const x = X(f * n);
        if (x < W) ctx.fillRect(x - 1, base - hh, 2, hh);
      }
      cap.textContent = 'Phổ minh họa. Bấm phát để xem phổ thật.';
    }
    const fx = X(live.frequency || st.frequency || 440);
    ctx.strokeStyle = c.comp; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(fx, 14); ctx.lineTo(fx, base); ctx.stroke(); ctx.setLineDash([]);
    text(num(live.frequency || st.frequency || 440) + ' Hz', Math.min(Math.max(fx, 30), W - 30), 26, c.comp, 'center');
    ctx.strokeStyle = '#8795a8'; ctx.beginPath(); ctx.moveTo(0, base); ctx.lineTo(W, base); ctx.stroke();
    [[20, '20'], [100, '100'], [1000, '1k'], [10000, '10k']].forEach(([f, l]) => {
      text(l, X(f), H - 4, '#6b7a8f', 'center');
      ctx.beginPath(); ctx.moveTo(X(f), base); ctx.lineTo(X(f), base + 3); ctx.stroke();
    });
  }

  function drawPressure(st, c) {
    const ed = st.earDrive || {};
    const f = Math.max(1, (st.live && st.live.frequency) || st.frequency || 440);
    const slow = st.slow || 0.005;
    const Tvis = 1 / (f * slow);
    const win = Math.min(12, Math.max(2, 3 * Tvis));
    const n = Math.min(ringN, Math.max(2, Math.round(win * 30)));
    const mid = H / 2, amp = H * 0.4;
    ctx.strokeStyle = '#cfd7e3'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke();
    const a = Math.abs(ed.amp || 0);
    if (a > 0.01) {
      ctx.strokeStyle = c.comp; ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(0, mid - a * amp); ctx.lineTo(W, mid - a * amp);
      ctx.moveTo(0, mid + a * amp); ctx.lineTo(W, mid + a * amp);
      ctx.stroke(); ctx.setLineDash([]);
      text('biên độ = ' + num(a, 2), 6, mid - a * amp - 3, c.comp);
    }
    ctx.strokeStyle = c.accent; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const idx = (ringN - n + i) % HIST;
      const x = W - ((n - 1 - i) / (win * 30)) * W;
      const y = mid - ring[idx < 0 ? idx + HIST : idx] * amp;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    text('+p (nén)', W - 6, 12, c.comp, 'right');
    text('−p (giãn)', W - 6, H - 5, c.rare, 'right');
    const pw = (Tvis / win) * W;
    if (pw < W - 20) {
      const y0 = H - 16;
      ctx.strokeStyle = c.ink; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(8, y0); ctx.lineTo(8 + pw, y0);
      ctx.moveTo(8, y0 - 4); ctx.lineTo(8, y0 + 4);
      ctx.moveTo(8 + pw, y0 - 4); ctx.lineTo(8 + pw, y0 + 4);
      ctx.stroke();
      text('T hiển thị ≈ ' + fmtT(Tvis), 8 + pw + 6, y0 + 4, c.ink);
    }
    cap.textContent = 'Áp suất tại tai theo thời gian đã làm chậm (thật: T = ' + fmtT(1 / f) + ').';
  }

  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (now - last < 33) return;
    last = now;
    const st = S();
    if (!st || (typeof document !== 'undefined' && document.hidden)) return;
    if (!root.open || !root.isConnected || (root.offsetParent === null && canvas.clientWidth === 0)) return;
    ring[ringN % HIST] = (st.earDrive && st.earDrive.pressure) || 0;
    ringN++;
    try {
      resize();
      ctx.clearRect(0, 0, W, H);
      ctx.font = '11px system-ui, sans-serif';
      const c = {
        accent: cssVar('--accent', '#3b5bdb'), ink: cssVar('--ink', '#1b2430'),
        comp: cssVar('--compression', '#e8590c'), rare: cssVar('--rarefaction', '#1c7ed6')
      };
      if (tab === 0) drawWave(st, c); else if (tab === 1) drawSpectrum(st, c); else drawPressure(st, c);
    } catch (e) { console.warn('[scope] draw', e && e.message); }
  }
  requestAnimationFrame(frame);
}
