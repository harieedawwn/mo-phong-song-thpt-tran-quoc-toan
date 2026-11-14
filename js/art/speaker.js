// Flat cut-away loudspeaker, seen from the side (cone face toward the air on the right).
// Cone + voice coil move rigidly with u(0,t). Design units: 124 × 170; the cone rim rests at x = 118.
import {Figure} from './figure.js';
import {C} from '../draw/ink.js';

export const SPK_W = 124, SPK_H = 170, SPK_RIM = 118;
export const SPK_NAMES = {cone: 'Màng loa', coil: 'Cuộn dây', magnet: 'Nam châm', box: 'Thùng loa'};
export const SPK_CAPS = {
  cone: 'Màng loa: dao động qua lại, đẩy – kéo lớp không khí sát nó tạo thành vùng nén và vùng giãn.',
  coil: 'Cuộn dây: có dòng điện biến thiên nên bị nam châm đẩy – hút, kéo màng loa dao động.',
  magnet: 'Nam châm: tạo từ trường tác dụng lực lên cuộn dây.',
  box: 'Thùng loa: giữ cố định nam châm và khung của loa.'
};
export const SPK_LABELS = [['cone', 'Màng loa', 92, 40, 'top'], ['coil', 'Cuộn dây', 50, 100, 'bottom'], ['magnet', 'Nam châm', 26, 66, 'top']];

export function makeSpeaker() {
  const parts = [
    {id: 'box', d: 'M 120 4 L 10 4 Q 4 4 4 10 L 4 160 Q 4 166 10 166 L 120 166 L 120 150 L 16 150 L 16 20 L 120 20 Z', fill: '#868e96', stroke: C.ink2, lw: 2},
    {id: 'magnet', d: 'M 16 56 L 36 56 L 36 114 L 16 114 Z M 36 72 L 52 72 L 52 98 L 36 98 Z', fill: '#343a40', stroke: C.ink, lw: 1.6},
    {id: 'coil', dyn: true, thin: true, d: 'M 40 66 L 62 66 L 62 104 L 40 104 Z', fill: '#f0b84a', stroke: C.ink2, lw: 1.6},
    {id: 'cone', dyn: true, d: 'M 62 74 L 118 24 L 118 146 L 62 96 Z', fill: '#ced4da', stroke: C.ink2, lw: 2}
  ];
  const fig = new Figure(SPK_W, SPK_H, parts);
  const P = id => fig.by[id];
  // dd = cone displacement in design units (+ = toward the air)
  fig.drawDyn = (ctx, dd) => {
    fig.begin(ctx);
    ctx.save(); ctx.translate(dd, 0);
    fig.paint(ctx, P('coil'), fig.sel === 'coil');
    fig.paint(ctx, P('cone'), fig.sel === 'cone');
    ctx.strokeStyle = C.ink; ctx.lineWidth = 4 / 1; ctx.lineCap = 'round';           // radiating face of the cone
    ctx.beginPath(); ctx.moveTo(SPK_RIM, 24); ctx.lineTo(SPK_RIM, 146); ctx.stroke();
    ctx.restore();
    const sp = fig.sel && P(fig.sel);
    if (sp && !sp.dyn) fig.mark(ctx, sp);
    fig.hoverMark(ctx);
    fig.end(ctx);
  };
  return fig;
}
