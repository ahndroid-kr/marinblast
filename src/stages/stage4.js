import { H } from '../config.js';

export const STAGE4 = {
  mobDuration: 95,
  scrollSpeed: 72,
  bossWarnTime: 1.5,
  terrain: [
    { x: 0,    top: 24, bottom: H - 24 },
    { x: 500,  top: 32, bottom: H - 48 },
    { x: 900,  top: 55, bottom: H - 26 },
    { x: 1300, top: 26, bottom: H - 60 },
    { x: 1700, top: 24, bottom: H - 24 },
    { x: 2200, top: 58, bottom: H - 34 },
    { x: 2600, top: 26, bottom: H - 62 },
    { x: 3000, top: 38, bottom: H - 24 },
    { x: 3400, top: 24, bottom: H - 24 },
    { x: 3900, top: 46, bottom: H - 46 },
    { x: 4400, top: 24, bottom: H - 24 },
    { x: 5000, top: 24, bottom: H - 24 },
    { x: 5600, top: 24, bottom: H - 24 },
    { x: 6400, top: 24, bottom: H - 24 },
  ],
  timeline: [
    // 0~20초: 거미게 + 메로 워밍업
    { t: 2.0,  kind: 'toothfish',  ys: [90, 120] },
    { t: 5.0,  kind: 'spidercrab', ys: [180, 200] },
    { t: 8.0,  kind: 'toothfish',  ys: [80, 110, 140] },
    { t: 11.0, kind: 'anglerfish', ys: [110] },
    { t: 14.0, kind: 'spidercrab', ys: [50, 190] },
    { t: 17.0, kind: 'toothfish',  ys: [100, 130, 160] },

    // 20~45초: 혼합
    { t: 20.0, kind: 'anglerfish', ys: [90, 160] },
    { t: 23.0, kind: 'spidercrab', ys: [55, 200] },
    { t: 26.0, kind: 'toothfish',  ys: [80, 110, 140, 170] },
    { t: 29.0, kind: 'anglerfish', ys: [120] },
    { t: 32.0, kind: 'spidercrab', ys: [50, 100, 195] },
    { t: 35.0, kind: 'toothfish',  ys: [90, 130] },
    { t: 38.0, kind: 'anglerfish', ys: [80, 170] },
    { t: 41.0, kind: 'spidercrab', ys: [55, 200] },
    { t: 44.0, kind: 'toothfish',  ys: [100, 140] },

    // 45~70초: 난이도 상승
    { t: 46.0, kind: 'anglerfish', ys: [90, 150] },
    { t: 49.0, kind: 'spidercrab', ys: [50, 110, 195] },
    { t: 52.0, kind: 'toothfish',  ys: [80, 110, 140, 170] },
    { t: 55.0, kind: 'anglerfish', ys: [100, 160] },
    { t: 58.0, kind: 'spidercrab', ys: [55, 200] },
    { t: 61.0, kind: 'toothfish',  ys: [90, 120, 150] },
    { t: 64.0, kind: 'anglerfish', ys: [80, 140] },
    { t: 67.0, kind: 'spidercrab', ys: [50, 100, 190] },

    // 70~95초: 보스 직전 러시
    { t: 71.0, kind: 'toothfish',  ys: [80, 110, 140, 170] },
    { t: 74.0, kind: 'anglerfish', ys: [90, 160] },
    { t: 77.0, kind: 'spidercrab', ys: [55, 120, 200] },
    { t: 80.0, kind: 'toothfish',  ys: [85, 115, 145] },
    { t: 83.0, kind: 'anglerfish', ys: [100, 150] },
    { t: 86.0, kind: 'spidercrab', ys: [50, 195] },
    { t: 89.0, kind: 'toothfish',  ys: [90, 130, 170] },
    { t: 92.0, kind: 'anglerfish', ys: [110, 160] },
  ],
};
