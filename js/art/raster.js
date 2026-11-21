// Raster art loader (v4): WebP sprites + img/anchors.json (image pixels). Everything is relative to this module's URL.
// loadImg(path) -> entry {img, ok, ready}; the entry caches ONE baked canvas (downscaled once per layout/DPR, high quality),
// so a frame is a single drawImage of an already-sized bitmap.  loadAnchors() -> {data, ready}; data is null until fetched.
const imgs = new Map();
const base = p => new URL('../../' + p, import.meta.url).href;

export function loadImg(path) {
  let e = imgs.get(path);
  if (e) return e;
  const img = new Image();
  e = {img, ok: false, path, c: null, key: ''};
  img.src = base(path);
  e.ready = img.decode().then(() => { e.ok = true; return e; }).catch(err => { console.error('img: ' + path + ' ' + err.message); return e; });
  imgs.set(path, e);
  return e;
}

// bitmap of the image at cssW × cssH CSS px (device pixels = × dpr); rebuilt only when the size changes; null until loaded.
// Halving steps keep thin lines crisp when the art is shrunk a lot.
export function baked(e, cssW, cssH, dpr = 1) {
  if (!e.ok) return null;
  const pw = Math.max(1, Math.round(cssW * dpr)), ph = Math.max(1, Math.round(cssH * dpr)), key = pw + 'x' + ph;
  if (e.key === key) return e.c;
  let src = e.img, sw = src.naturalWidth, sh = src.naturalHeight;
  while (sw > pw * 2 && sh > ph * 2) {
    const nw = Math.max(pw, Math.ceil(sw / 2)), nh = Math.max(ph, Math.ceil(sh / 2));
    const t = document.createElement('canvas'); t.width = nw; t.height = nh;
    const g = t.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, nw, nh);
    src = t; sw = nw; sh = nh;
  }
  const c = document.createElement('canvas'); c.width = pw; c.height = ph;
  const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, pw, ph);
  e.c = c; e.key = key;
  return c;
}

let anchorsP = null;
export const anchors = {data: null, ready: null};
export function loadAnchors() {
  if (anchorsP) return anchors;
  anchors.ready = anchorsP = fetch(base('img/anchors.json')).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(d => { anchors.data = d; return d; }).catch(err => { console.error('anchors.json ' + err.message); return null; });
  return anchors;
}
