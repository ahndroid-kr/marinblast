// 2스테이지: 왕우럭조개 / 광어 / 방어 → 보스 상어
import { H } from '../config.js';

export const STAGE2 = {
  mobDuration: 85,
  scrollSpeed: 65,
  bossWarnTime: 1.5,
  terrain: [
    { x: 0,    top: 22, bottom: H - 22 },
    { x: 500,  top: 30, bottom: H - 40 },
    { x: 900,  top: 22, bottom: H - 28 },
    { x: 1300, top: 45, bottom: H - 22 },
    { x: 1700, top: 22, bottom: H - 50 },
    { x: 2100, top: 22, bottom: H - 22 },
    { x: 2500, top: 50, bottom: H - 30 },
    { x: 2900, top: 28, bottom: H - 55 },
    { x: 3300, top: 22, bottom: H - 22 },
    { x: 3700, top: 38, bottom: H - 38 },
    { x: 4200, top: 22, bottom: H - 22 },
    { x: 4800, top: 22, bottom: H - 22 },
    { x: 5400, top: 22, bottom: H - 22 }, // 보스룸
    { x: 6000, top: 22, bottom: H - 22 },
  ],
  timeline: [
    // === 0-15초: 조개 + 방어 워밍업 ===
    { t: 2.0,  kind: 'buri',    ys: [90, 110] },
    { t: 4.5,  kind: 'mirugai', ys: [180] },
    { t: 7.0,  kind: 'buri',    ys: [80, 100, 120] },
    { t: 10.0, kind: 'hirame',  ys: [190] },
    { t: 12.5, kind: 'mirugai', ys: [60, 200] },
    { t: 15.0, kind: 'buri',    ys: [70, 130] },

    // === 15-35초: 광어 함정 + 방어 돌진 ===
    { t: 17.0, kind: 'hirame',  ys: [175, 195] },
    { t: 19.5, kind: 'buri',    ys: [80, 100, 120, 140] },
    { t: 22.0, kind: 'mirugai', ys: [60, 180] },
    { t: 25.0, kind: 'hirame',  ys: [185] },
    { t: 27.5, kind: 'buri',    ys: [70, 90, 110] },
    { t: 30.0, kind: 'mirugai', ys: [200] },
    { t: 33.0, kind: 'hirame',  ys: [170, 195] },

    // === 35-60초: 혼합 난이도 상승 ===
    { t: 36.0, kind: 'buri',    ys: [60, 80, 100, 120] },
    { t: 38.5, kind: 'mirugai', ys: [55, 195] },
    { t: 41.0, kind: 'hirame',  ys: [180, 200] },
    { t: 44.0, kind: 'buri',    ys: [70, 100, 130, 160] },
    { t: 47.0, kind: 'mirugai', ys: [60, 120, 190] },
    { t: 50.0, kind: 'hirame',  ys: [175, 195] },
    { t: 53.0, kind: 'buri',    ys: [80, 110, 140] },
    { t: 56.0, kind: 'mirugai', ys: [55, 200] },
    { t: 59.0, kind: 'hirame',  ys: [185] },

    // === 60-85초: 보스 직전 러시 ===
    { t: 62.0, kind: 'buri',    ys: [60, 90, 120, 150] },
    { t: 65.0, kind: 'mirugai', ys: [55, 120, 200] },
    { t: 68.0, kind: 'hirame',  ys: [170, 190] },
    { t: 71.0, kind: 'buri',    ys: [70, 100, 130, 160] },
    { t: 74.0, kind: 'mirugai', ys: [60, 180] },
    { t: 77.0, kind: 'buri',    ys: [80, 110, 140] },
    { t: 81.0, kind: 'hirame',  ys: [175, 200] },
  ],
};
