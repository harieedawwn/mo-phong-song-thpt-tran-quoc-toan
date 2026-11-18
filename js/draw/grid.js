// Graph-paper background, rendered once per size into an offscreen canvas: light lines + a very soft baked vignette.
export const PAPER = '#fbfaf6', MINOR = '#efebe2', MAJOR = '#e4ddcf';
export function makeGrid(w, h, dpr, cell = 24) {
  const c = document.createElement('canvas');
  c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
  const g = c.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = PAPER; g.fillRect(0, 0, w, h);
  g.lineWidth = 1;
  for (const major of [false, true]) {
    g.strokeStyle = major ? MAJOR : MINOR;
    g.beginPath();
    for (let i = 0, x = 0; x <= w; i++, x += cell) if ((i % 5 === 0) === major) { g.moveTo(Math.round(x) + .5, 0); g.lineTo(Math.round(x) + .5, h); }
    for (let i = 0, y = 0; y <= h; i++, y += cell) if ((i % 5 === 0) === major) { g.moveTo(0, Math.round(y) + .5); g.lineTo(w, Math.round(y) + .5); }
    g.stroke();
  }
  // vignette: transparent centre → faint warm edge
  const r = Math.hypot(w, h) / 2, v = g.createRadialGradient(w / 2, h / 2, r * 0.55, w / 2, h / 2, r);
  v.addColorStop(0, 'rgba(120,96,48,0)'); v.addColorStop(1, 'rgba(120,96,48,.10)');
  g.fillStyle = v; g.fillRect(0, 0, w, h);
  return c;
}
