// SVG layer loader (the art pipeline). loadArt('speaker') fetches art/speaker.svg once and splits it into layers:
//   • every top-level <g id="…" data-move="1"> = one moving layer (SVG is XML: the attribute needs a value);  everything else = the static layer (drawn first, under the moving ones)
//   • <circle class="anchor" id="a-…" r="0"> marks label anchors / pivots: read once (cx, cy in design units), then removed
//     (anchors are read in root coordinates – do not put them inside transformed groups)
// Each layer is a copy of the SVG with only that layer kept → data-URL Image → rasterised into an offscreen canvas on render() (resize only).
// Per frame: art.draw(ctx, x, y, {layerId: {dx, dy, rot, sx}}) = drawImage calls only. A moving layer rotates about the anchor "a-<id>-pivot".
import {C, font, textW, roundRect} from '../draw/ink.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const cache = new Map();
const url = name => new URL('../../art/' + name + '.svg', import.meta.url).href;

function toImage(root) {
  const src = new XMLSerializer().serializeToString(root);
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src);
  return img.decode().then(() => img);
}
// copy of the root keeping <defs> plus the top-level nodes accepted by keep(node)
function slim(root, keep) {
  const c = root.cloneNode(true);
  for (const n of Array.from(c.children)) if (n.localName !== 'defs' && !keep(n)) n.remove();
  return c;
}

export function loadArt(name) {
  if (cache.has(name)) return cache.get(name);
  const art = {
    name, w: 0, h: 0, ready: null, failed: false, scale: 0, dpr: 1, pending: null,
    layers: [],            // {id, move, img, c, px, py}   (static layer first, id '')
    anchors: new Map(),
    pt(id) { return this.anchors.get(id) || null; },
    render(scale, dpr = 1) {
      if (!this.layers.length) { this.pending = {scale, dpr}; return; }   // called before the SVG is decoded: redo once it is ready
      this.scale = scale; this.dpr = dpr;
      const pw = Math.max(1, Math.ceil(this.w * scale * dpr)), ph = Math.max(1, Math.ceil(this.h * scale * dpr));
      for (const L of this.layers) {
        if (!L.c) L.c = document.createElement('canvas');
        L.c.width = pw; L.c.height = ph;
        const g = L.c.getContext('2d');
        g.clearRect(0, 0, pw, ph);
        g.drawImage(L.img, 0, 0, pw, ph);
      }
    },
    // x, y = top-left of the art on the stage (CSS px); dx/dy are design units, rot in radians, sx / sy = horizontal / vertical scale about the pivot,
    // clipY = design y (unmoved frame): the layer is only drawn above it (a rod sliding into a body)
    draw(ctx, x, y, moves) {
      const s = this.scale, w = this.w * s, h = this.h * s;
      if (!this.layers.length || !this.layers[0].c || !s) {          // placeholder until loaded + rendered
        ctx.fillStyle = 'rgba(0,0,0,.05)'; ctx.fillRect(x, y, w || 40, h || 40);
        return;
      }
      for (const L of this.layers) {
        const m = L.move && moves && moves[L.id];
        if (!L.move || !m) { ctx.drawImage(L.c, x, y, w, h); continue; }
        ctx.save();
        if (m.clipY != null) { ctx.beginPath(); ctx.rect(x - 1e4, y - 1e4, 2e4, 1e4 + m.clipY * s); ctx.clip(); }
        ctx.translate(x + (L.px + (m.dx || 0)) * s, y + (L.py + (m.dy || 0)) * s);
        if (m.rot) ctx.rotate(m.rot);
        if ((m.sx && m.sx !== 1) || (m.sy && m.sy !== 1)) ctx.scale(m.sx || 1, m.sy || 1);
        ctx.drawImage(L.c, -L.px * s, -L.py * s, w, h);
        ctx.restore();
      }
    }
  };
  art.ready = fetch(url(name)).then(r => { if (!r.ok) throw new Error(r.status + ' ' + r.url); return r.text(); }).then(async text => {
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml'), root = doc.documentElement;
    if (root.localName !== 'svg') throw new Error('not an svg: ' + name);
    const vb = (root.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
    art.w = vb.length === 4 ? vb[2] : parseFloat(root.getAttribute('width')) || 100;
    art.h = vb.length === 4 ? vb[3] : parseFloat(root.getAttribute('height')) || 100;
    for (const c of Array.from(root.querySelectorAll('circle.anchor'))) {
      if (c.id) art.anchors.set(c.id, {x: parseFloat(c.getAttribute('cx')) || 0, y: parseFloat(c.getAttribute('cy')) || 0});
      c.remove();
    }
    const isMove = n => n.localName === 'g' && n.hasAttribute('data-move') && !!n.id;
    const moving = Array.from(root.children).filter(isMove);
    const specs = [{id: '', move: false, root: slim(root, n => !isMove(n))}];             // static layer: everything not data-move
    for (const g of moving) specs.push({id: g.id, move: true, root: slim(root, n => isMove(n) && n.id === g.id)});
    for (const sp of specs) {
      sp.root.setAttribute('width', art.w); sp.root.setAttribute('height', art.h);
      if (!sp.root.getAttribute('xmlns')) sp.root.setAttribute('xmlns', SVGNS);
    }
    const imgs = await Promise.all(specs.map(sp => toImage(sp.root)));
    art.layers = specs.map((sp, i) => {
      const p = art.pt('a-' + sp.id + '-pivot');
      return {id: sp.id, move: sp.move, img: imgs[i], c: null, px: p ? p.x : 0, py: p ? p.y : 0};
    });
    if (art.pending) art.render(art.pending.scale, art.pending.dpr);
    return art;
  }).catch(e => { art.failed = true; console.error('art/' + name + '.svg: ' + e.message); return art; });
  cache.set(name, art);
  return art;
}

// ---- part labels (leaders + pills) for the art figures ------------------------------------------------------------------------------------------------
// items: [{text, tx, ty (design target), id}]. Rows mode: pills stacked in rows above/below the figure so that none overlap.
// Side mode (phones): pills in a column left/right of the figure, de-collided vertically.
const orient = (ax, ay, bx, by, cx, cy) => Math.sign((bx - ax) * (cy - ay) - (by - ay) * (cx - ax));
// proper intersection of segments AB and CD
function cross(ax, ay, bx, by, cx, cy, dx, dy) {
  return orient(ax, ay, bx, by, cx, cy) * orient(ax, ay, bx, by, dx, dy) < 0 && orient(cx, cy, dx, dy, ax, ay) * orient(cx, cy, dx, dy, bx, by) < 0;
}
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
      // uncross leaders: swapping the slots of two crossing labels removes that crossing (total leader length drops, so this ends)
      const lx = side === 'right' ? o.xR : o.xL;
      for (let pass = 0, sw = true; pass < 12 && sw; pass++) {
        sw = false;
        for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) {
          const p = arr[i], q = arr[j];
          if (cross(lx, p.y, p.tx, p.ty, lx, q.y, q.tx, q.ty)) { const t = p.y; p.y = q.y; q.y = t; sw = true; }
        }
      }
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
  const ga = ctx.globalAlpha;
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
  ctx.globalAlpha = ga;
}
