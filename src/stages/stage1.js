// 1스테이지: 잡몹 80초 → 보스 등장
import { H } from '../config.js';

export const STAGE1 = {
  mobDuration: 80,       // 잡몹 구간 길이
  scrollSpeed: 60,
  bossWarnTime: 1.5,     // "WARNING" 표시 시간
  terrain: [
    { x: 0,    top: 22, bottom: H - 22 },
    { x: 400,  top: 26, bottom: H - 26 },
    { x: 800,  top: 45, bottom: H - 28 },
    { x: 1200, top: 28, bottom: H - 50 },
    { x: 1600, top: 22, bottom: H - 22 },
    { x: 2000, top: 38, bottom: H - 38 },
    { x: 2400, top: 55, bottom: H - 28 },
    { x: 2800, top: 28, bottom: H - 55 },
    { x: 3200, top: 22, bottom: H - 22 },
    { x: 3600, top: 22, bottom: H - 22 },
    { x: 4000, top: 32, bottom: H - 32 },
    { x: 4400, top: 22, bottom: H - 22 },
    { x: 4800, top: 22, bottom: H - 22 },
    { x: 5400, top: 22, bottom: H - 22 }, // 보스룸
    { x: 6000, top: 22, bottom: H - 22 },
  ],
  timeline: [
    { t: 2.0,  kind: 'anchovy', ys: [80, 90, 100, 110, 120] },
    { t: 4.0,  kind: 'anchovy', ys: [140, 150, 160, 170, 180] },
    { t: 6.5,  kind: 'anchovy', ys: [60, 80, 100, 120, 140, 160] },
    { t: 9.0,  kind: 'shrimp',  ys: [200] },
    { t: 11.0, kind: 'anchovy', ys: [70, 85, 100, 115, 130] },
    { t: 13.5, kind: 'shrimp',  ys: [50, 200] },

    { t: 16.0, kind: 'mackerel', ys: [120] },
    { t: 18.5, kind: 'anchovy',  ys: [80, 90, 100, 110, 120, 130] },
    { t: 21.0, kind: 'shrimp',   ys: [60, 180] },
    { t: 24.0, kind: 'mackerel', ys: [90, 150] },
    { t: 27.0, kind: 'anchovy',  ys: [60, 75, 90, 105, 120, 135, 150] },
    { t: 30.0, kind: 'shrimp',   ys: [200] },
    { t: 32.5, kind: 'mackerel', ys: [110] },

    { t: 36.0, kind: 'anchovy',  ys: [70, 90, 110, 130, 150] },
    { t: 38.0, kind: 'mackerel', ys: [80, 160] },
    { t: 41.0, kind: 'shrimp',   ys: [50, 100, 200] },
    { t: 44.0, kind: 'anchovy',  ys: [60, 80, 100, 120, 140, 160, 180] },
    { t: 47.0, kind: 'mackerel', ys: [100, 140] },
    { t: 50.0, kind: 'shrimp',   ys: [60, 200] },
    { t: 53.0, kind: 'mackerel', ys: [80] },
    { t: 55.0, kind: 'anchovy',  ys: [70, 90, 110, 130, 150, 170] },
    { t: 58.0, kind: 'shrimp',   ys: [50, 180] },

    { t: 62.0, kind: 'mackerel', ys: [100, 140, 180] },
    { t: 65.0, kind: 'anchovy',  ys: [60, 75, 90, 105, 120, 135, 150, 165] },
    { t: 68.0, kind: 'shrimp',   ys: [60, 100, 180] },
    { t: 71.0, kind: 'mackerel', ys: [80, 120, 160] },
    { t: 75.0, kind: 'anchovy',  ys: [60, 80, 100, 120, 140, 160] },
  ],
};
