// Phase-0 placeholder mode: draws its title and a small travelling sine. Replaced by real modes in later phases.
import {state, set} from '../state.js';
import {slider, group, lab} from '../ui.js';
import {slowText} from '../fmt.js';

const INK = '#15181d', MUTED = '#5d6470';
export function makeStub(cfg) {
  let W = 0, H = 0;
  return {
    id: cfg.id, title: cfg.title, short: cfg.short, icon: cfg.icon,
    defaults: {slow: cfg.slow},
    metrics() { return cfg.sources; },   // {f, v} real values for the readouts
    controls() {
      const fmin = 0.001, ratio = 1000;
      const val = document.createElement('span'); val.className = 'val';
      const s = slider({min: 0, max: 1000, label: 'Làm chậm',
        pos: () => Math.round(1000 * Math.log(Math.min(1, Math.max(fmin, state.slow)) / fmin) / Math.log(ratio)),
        apply: p => set('slow', Number((fmin * Math.pow(ratio, p / 1000)).toFixed(5))),
        sync: () => { val.textContent = slowText(state.slow); }});
      const todo = document.createElement('p'); todo.className = 'todo'; todo.textContent = 'Các điều khiển riêng của chế độ này đang được xây dựng.';
      return [group('wave', 'Điều chỉnh sóng', lab('slow', 'Làm chậm', val), s, todo)];
    },
    features() { return cfg.features; },
    layout(w, h) { W = w; H = h; },
    update() {},
    draw(ctx) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = INK; ctx.font = '800 ' + Math.max(18, Math.min(34, W / 18)) + 'px "Be Vietnam Pro",sans-serif';
      ctx.fillText(cfg.title, W / 2, H * 0.4);
      ctx.fillStyle = MUTED; ctx.font = '600 ' + Math.max(12, Math.min(16, W / 40)) + 'px "Be Vietnam Pro",sans-serif';
      ctx.fillText('Đang xây dựng – sắp có trong các phase tiếp theo', W / 2, H * 0.4 + 34);
      // travelling sine (shows that the loop / play / pause / slow-motion work)
      const ph = state.t / state.slow * 0.35;
      ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.strokeStyle = cfg.color;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 6) { const y = H * 0.66 + Math.sin(x / 38 - ph) * Math.min(26, H * 0.06); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    }
  };
}
