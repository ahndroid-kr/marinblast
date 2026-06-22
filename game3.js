import { H } from '../config.js';

export const STAGE3 = {
  mobDuration: 90,
  scrollSpeed: 70,
  bossWarnTime: 1.5,
  terrain: [
    { x: 0,    top: 22, bottom: H - 22 },
    { x: 500,  top: 28, bottom: H - 44 },
    { x: 900,  top: 50, bottom: H - 24 },
    { x: 1300, top: 24, bottom: H - 55 },
    { x: 1700, top: 22, bottom: H - 22 },
    { x: 2100, top: 55, bottom: H - 32 },
    { x: 2500, top: 24, bottom: H - 60 },
    { x: 2900, top: 35, bottom: H - 22 },
    { x: 3300, top: 22, bottom: H - 22 },
    { x: 3800, top: 44, bottom: H - 44 },
    { x: 4300, top: 22, bottom: H - 22 },
    { x: 4900, top: 22, bottom: H - 22 },
    { x: 5500, top: 22, bottom: H - 22 },
    { x: 6200, top: 22, bottom: H - 22 },
  ],
  timeline: [
    // 0~18초: 돌돔 + 바라쿠다 워밍업
    { t: 2.0,  kind: 'barracuda',       ys: [100, 130] },
    { t: 5.0,  kind: 'stripedbeakfish', ys: [90, 120, 150] },
    { t: 8.0,  kind: 'pufferfish',      ys: [100, 170] },
    { t: 11.0, kind: 'barracuda',       ys: [80, 110, 140] },
    { t: 14.0, kind: 'stripedbeakfish', ys: [80, 160] },
    { t: 17.0, kind: 'pufferfish',      ys: [120] },

    // 18~40초: 혼합
    { t: 19.0, kind: 'barracuda',       ys: [70, 100, 130, 160] },
    { t: 22.0, kind: 'stripedbeakfish', ys: [85, 120, 155] },
    { t: 25.0, kind: 'pufferfish',      ys: [90, 170] },
    { t: 28.0, kind: 'barracuda',       ys: [80, 120, 160] },
    { t: 31.0, kind: 'stripedbeakfish', ys: [70, 110, 150] },
    { t: 34.0, kind: 'pufferfish',      ys: [100, 140, 180] },
    { t: 37.0, kind: 'barracuda',       ys: [90, 130] },

    // 40~65초: 난이도 상승
    { t: 41.0, kind: 'stripedbeakfish', ys: [70, 100, 130, 160] },
    { t: 44.0, kind: 'barracuda',       ys: [80, 110, 140, 170] },
    { t: 47.0, kind: 'pufferfish',      ys: [80, 130, 180] },
    { t: 50.0, kind: 'stripedbeakfish', ys: [75, 115, 155] },
    { t: 53.0, kind: 'barracuda',       ys: [70, 100, 130, 160] },
    { t: 56.0, kind: 'pufferfish',      ys: [90, 140] },
    { t: 59.0, kind: 'stripedbeakfish', ys: [80, 120, 160] },
    { t: 62.0, kind: 'barracuda',       ys: [75, 105, 135, 165] },

    // 65~90초: 보스 직전 러시
    { t: 66.0, kind: 'pufferfish',      ys: [80, 120, 170] },
    { t: 69.0, kind: 'barracuda',       ys: [70, 100, 130, 160] },
    { t: 72.0, kind: 'stripedbeakfish', ys: [75, 115, 155] },
    { t: 75.0, kind: 'pufferfish',      ys: [90, 140] },
    { t: 78.0, kind: 'barracuda',       ys: [80, 110, 140] },
    { t: 81.0, kind: 'stripedbeakfish', ys: [70, 110, 150] },
    { t: 85.0, kind: 'pufferfish',      ys: [100, 160] },
    { t: 88.0, kind: 'barracuda',       ys: [80, 120, 160] },
  ],
};
