// Shared kit for the anatomy / equipment figures (loa, người nói, tai).
// A figure is authored once in "design units" (SVG-like coordinates) as a list of parts:
//   shape : {id, d, fill, stroke, lw}                 – closed Path2D, filled + outlined
//   tube  : {id, items:[{d, w}], fill, stroke, lw}    – thick round strokes (outline colour under fill colour)
//   dyn:true parts are not painted into the cached static layer; the figure's own draw code paints them each frame.
// Static parts are painted once into an offscreen canvas (rebuilt only when the size / DPR changes).
import {C, font, textW, roundRect} from '../draw/ink.js';

const hit = document.createElement('canvas').getContext('2d');

export function stipple(color, bg, size = 6) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, size, size);
  g.fillStyle = color;
  g.beginPath(); g.arc(size * 0.3, size * 0.3, size * 0.14, 0, 6.2832); g.arc(size * 0.8, size * 0.78, size * 0.12, 0, 6.2832); g.fill();
  return hit.createPattern(c, 'repeat');
}

export class Figure {
  constructor(w, h, parts) {
    this.w = w; this.h = h; this.parts = parts; this.by = {};
    for (const p of parts) {
      this.by[p.id] = p;
      if (p.d) p.path = new Path2D(p.d);
      if (p.items) for (const it of p.items) it.path = it.path || new Path2D(it.d);
    }
    this.x = 0; this.y = 0; this.s = 1; this.sel = null;
    this.cache = null; this.cacheKey = '';
    this.clip = true;
  }
  // Fit the figure into the box (x, y, bw, bh); `ax`/`ay` ∈ [0,1] set where it sits inside the box.
  place(x, y, bw, bh, ax = 0.5, ay = 0.5) {
    const s = Math.min(bw / this.w, bh / this.h);
    this.s = s; this.x = x + (bw - this.w * s) * ax; this.y = y + (bh - this.h * s) * ay;
  }
  px(dx, dy) { return [this.x + dx * this.s, this.y + dy * this.s]; }       // design → stage
  // pick the topmost pickable part under a stage point (null = background)
  pick(sx, sy) {
    const dx = (sx - this.x) / this.s, dy = (sy - this.y) / this.s;
    if (dx < -8 || dy < -8 || dx > this.w + 8 || dy > this.h + 8) return null;
    const tol = Math.max(5, 11 / this.s);                                   // finger-sized tolerance (design units)
    for (let k = this.parts.length - 1; k >= 0; k--) {
      const p = this.parts[k];
      if (p.pick === false) continue;
      if (this._hit(p, dx, dy, 0)) return p.id;
    }
    // second pass: thin parts, generous tolerance
    for (let k = this.parts.length - 1; k >= 0; k--) {
      const p = this.parts[k];
      if (p.pick === false || !p.thin) continue;
      if (this._hit(p, dx, dy, tol)) return p.id;
    }
    return null;
  }
  _hit(p, dx, dy, tol) {
    if (p.ghost) return hit.isPointInPath(p.clipPath, dx, dy) && hit.isPointInPath(p.path, dx, dy);
    if (p.items) {
      for (const it of p.items) { hit.lineWidth = it.w + 2 + tol + (p.fat || 0); hit.lineCap = 'round'; hit.lineJoin = 'round'; if (hit.isPointInStroke(it.path, dx, dy)) return true; }
      return false;
    }
    if (tol) { hit.lineWidth = tol * 2; return hit.isPointInPath(p.path, dx, dy) || hit.isPointInStroke(p.path, dx, dy); }
    return hit.isPointInPath(p.path, dx, dy);
  }
  // paint one part in the current (design) transform
  paint(g, p, sel) {
    const s = this.s, lw = Math.max(p.lw || 1.8, 1.3 / s);
    g.lineJoin = 'round'; g.lineCap = 'round';
    if (p.items) {
      for (const it of p.items) { g.strokeStyle = p.stroke; g.lineWidth = it.w + lw * 2; g.stroke(it.path); }
      for (const it of p.items) { g.strokeStyle = p.fill; g.lineWidth = it.w; g.stroke(it.path); }
    } else {
      // lineFirst: a thick lining stroke painted under the fill (only its outer half shows; overlaps stay clean)
      if (p.lineFirst && p.stroke) { g.strokeStyle = p.stroke; g.lineWidth = lw; g.stroke(p.path); }
      if (p.fill) { g.fillStyle = p.fill; g.fill(p.path); }
      if (p.stroke && !p.lineFirst) { g.strokeStyle = p.stroke; g.lineWidth = lw; g.stroke(p.path); }
    }
    if (sel) this.mark(g, p);
  }
  // thick selection outline (flat, no glow)
  mark(g, p) {
    const s = this.s;
    g.strokeStyle = C.red; g.lineJoin = 'round'; g.lineCap = 'round';
    if (p.items) { for (const it of p.items) { g.lineWidth = it.w + 7 / s; g.stroke(it.path); } for (const it of p.items) { g.strokeStyle = p.fill; g.lineWidth = it.w; g.stroke(it.path); } }
    else { g.lineWidth = 3.4 / s; g.stroke(p.path); }
  }
  _buildCache(dpr) {
    const k = this.s.toFixed(3) + '|' + dpr.toFixed(2);
    if (this.cache && this.cacheKey === k) return;
    const c = this.cache || (this.cache = document.createElement('canvas'));
    c.width = Math.ceil(this.w * this.s * dpr); c.height = Math.ceil(this.h * this.s * dpr);
    const g = c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height);
    g.setTransform(dpr * this.s, 0, 0, dpr * this.s, 0, 0);
    g.beginPath(); g.rect(0, 0, this.w, this.h); g.clip();
    for (const p of this.parts) {
      if (p.clipOn) { g.save(); g.clip(p.path); continue; }              // clip markers: everything until clipOff is cut to this shape
      if (p.clipOff) { g.restore(); continue; }
      if (!p.dyn && !p.after) this.paint(g, p, false);
    }
    this.cacheKey = k; this.dpr = dpr;
  }
  // static layer + selection mark of the selected static part
  drawStatic(ctx, dpr = 1) {
    this._buildCache(dpr);
    ctx.drawImage(this.cache, this.x, this.y, this.cache.width / this.dpr, this.cache.height / this.dpr);
  }
  begin(ctx) { ctx.save(); ctx.translate(this.x, this.y); ctx.scale(this.s, this.s); }
  end(ctx) { ctx.restore(); }
  // paint parts flagged `after` (drawn over dynamic ones), then the selection mark of a static part
  drawOver(ctx) {
    this.begin(ctx);
    for (const p of this.parts) if (p.after && !p.dyn) this.paint(ctx, p, this.sel === p.id);
    const sp = this.sel && this.by[this.sel];
    if (sp && !sp.dyn && !sp.after) this.mark(ctx, sp);
    this.end(ctx);
  }
}

// ---- labels ------------------------------------------------------------------------------------------------
// items: [{text, tx, ty (design target), id}]. Rows mode: pills stacked in rows above/below the figure so that none overlap.
// Side mode (phones): pills in a column left/right of the figure, de-collided vertically.
export function layoutLabels(ctx, fig, items, o) {
  const out = [], fs = o.size || 11, pad = 6, ph = fs + 9;
  ctx.font = font(fs, 700);
  const placed = [];
  const fit = (x, w) => Math.min(o.xmax - w / 2, Math.max(o.xmin + w / 2, x));
  if (o.mode === 'side') {
    const col = {left: [], right: []};
    for (const it of items) { const [tx, ty] = fig.px(it.tx, it.ty); col[it.side || o.side || 'right'].push({it, tx, ty, w: textW(ctx, it.text) + pad * 2}); }
    for (const side of ['left', 'right']) {
      const arr = col[side].sort((a, b) => a.ty - b.ty);
      let last = o.ymin - ph;
      for (const a of arr) {
        let y = Math.max(a.ty, last + ph + 3); a.y = y; last = y;
      }
      // pull back up if the column overflows the bottom
      let over = (arr.length ? arr[arr.length - 1].y : 0) - o.ymax;
      for (let k = arr.length - 1; k >= 0 && over > 0; k--) { const lim = k ? arr[k - 1].y + ph + 3 : o.ymin; const dy = Math.min(over, arr[k].y - lim); arr[k].y -= Math.max(0, dy); over -= Math.max(0, dy); }
      for (const a of arr) {
        const x = side === 'right' ? o.xR + a.w / 2 : o.xL - a.w / 2;
        out.push({id: a.it.id, text: a.it.text, x, y: a.y, w: a.w, h: ph, tx: a.tx, ty: a.ty, ex: side === 'right' ? x - a.w / 2 : x + a.w / 2, ey: a.y});
      }
    }
    return out;
  }
  // rows mode: greedy placement; a label may shift sideways / use a farther row so that no pill and no leader crosses another pill
  const placedRows = {top: [], bottom: []};
  const arr = items.map(it => { const [tx, ty] = fig.px(it.tx, it.ty); return {it, tx, ty, w: textW(ctx, it.text) + pad * 2, side: it.side || 'bottom'}; })
    .sort((a, b) => a.tx - b.tx);
  for (const a of arr) {
    const list = placedRows[a.side], offs = [0, -0.3, 0.3, -0.6, 0.6, -0.9, 0.9];
    let best = null;
    for (let pass = 0; pass < 2 && !best; pass++) search: for (let k = a.it.row || 0; k < 6; k++) for (const f of offs) {
      const x = fit(a.tx + f * a.w, a.w);
      let ok = true;
      for (const r of list) {
        if (r.k === k && Math.abs(r.x - x) < (r.w + a.w) / 2 + 5) { ok = false; break; }                   // overlap in the same row
        if (pass) continue;                                                                                     // pass 2: only avoid overlapping pills
        if (r.k < k && Math.abs(a.tx - r.x) < r.w / 2 + 4) { ok = false; break; }                              // my leader would cross a nearer pill
        if (r.k > k && Math.abs(r.tx - x) < a.w / 2 + 4) { ok = false; break; }                                // a farther leader would cross my pill
      }
      if (ok) { best = {k, x}; break search; }
    }
    if (!best) best = {k: 0, x: fit(a.tx, a.w)};
    list.push({k: best.k, x: best.x, w: a.w, tx: a.tx});
    const y = a.side === 'top' ? o.yTop - best.k * (ph + 5) - ph / 2 : o.yBot + best.k * (ph + 5) + ph / 2;
    const ex = Math.min(best.x + a.w / 2 - 8, Math.max(best.x - a.w / 2 + 8, a.tx));
    out.push({id: a.it.id, text: a.it.text, x: best.x, y, w: a.w, h: ph, tx: a.tx, ty: a.ty, ex, ey: a.side === 'top' ? y + ph / 2 : y - ph / 2});
  }
  return out;
}

export function drawLabels(ctx, labels, sel, fs = 11) {
  ctx.lineCap = 'round';
  for (const l of labels) {                                                      // leaders first, then pills on top
    ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(l.ex, l.ey); ctx.lineTo(l.tx, l.ty); ctx.stroke();
    ctx.fillStyle = C.ink2; ctx.beginPath(); ctx.arc(l.tx, l.ty, 2.3, 0, 6.2832); ctx.fill();
  }
  ctx.font = font(fs, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const l of labels) {
    const on = sel === l.id;
    ctx.beginPath(); roundRect(ctx, l.x - l.w / 2, l.y - l.h / 2, l.w, l.h, 6);
    ctx.fillStyle = on ? C.red : '#fff'; ctx.fill();
    ctx.lineWidth = 1.4; ctx.strokeStyle = on ? C.red : C.ink; ctx.stroke();
    ctx.fillStyle = on ? '#fff' : C.ink; ctx.fillText(l.text, l.x, l.y + 0.5);
  }
}

// hit-test the label pills (so tapping a label selects its part)
export function pickLabel(labels, x, y) {
  for (const l of labels) if (Math.abs(x - l.x) <= l.w / 2 + 2 && Math.abs(y - l.y) <= l.h / 2 + 3) return l.id;
  return null;
}
