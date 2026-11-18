// SVG layer loader (the art pipeline). loadArt('speaker') fetches art/speaker.svg once and splits it into layers:
//   • every top-level <g id="…" data-move="1"> = one moving layer (SVG is XML: the attribute needs a value);  everything else = the static layer (drawn first, under the moving ones)
//   • <circle class="anchor" id="a-…" r="0"> marks label anchors / pivots: read once (cx, cy in design units), then removed
//     (anchors are read in root coordinates – do not put them inside transformed groups)
// Each layer is a copy of the SVG with only that layer kept → data-URL Image → rasterised into an offscreen canvas on render() (resize only).
// Per frame: art.draw(ctx, x, y, {layerId: {dx, dy, rot, sx}}) = drawImage calls only. A moving layer rotates about the anchor "a-<id>-pivot".
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
