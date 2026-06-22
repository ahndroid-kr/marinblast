// 1스테이지 데이터.
// terrain: 키프레임 배열 (x, top, bottom)
// timeline: 시간(초) 기준 스폰 이벤트 배열

// 카메라는 게임 시간에 따라 자동 스크롤.
// 한 스테이지 길이: ~90초 (보스 30초 별도)

import { H } from '../config.js';

export const STAGE1 = {
  duration: 80,           // 잡몹 구간 길이(초)
  scrollSpeed: 60,        // 카메라 스크롤 px/sec
  terrain: [
    { x: 0,    top: 18, bottom: H - 18 },
    { x: 400,  top: 22, bottom: H - 22 },
    { x: 800,  top: 40, bottom: H - 25 },
    { x: 1200, top: 25, bottom: H - 45 },
    { x: 1600, top: 18, bottom: H - 18 },
    { x: 2000, top: 35, bottom: H - 35 },
    { x: 2400, top: 50, bottom: H - 25 },
    { x: 2800, top: 25, bottom: H - 50 },
    { x: 3200, top: 18, bottom: H - 18 },
    { x: 3600, top: 18, bottom: H - 18 },
    { x: 4000, top: 30, bottom: H - 30 },
    { x: 4400, top: 18, bottom: H - 18 },
    { x: 4800, top: 18, bottom: H - 18 }, // 보스룸 진입 전
  ],
  // spawn timeline: 시간 t(초)에 종류 kind를 (y 또는 y배열)에 spawn
  timeline: [
    // === 0-15초: 멸치 위주, 워밍업 ===
    { t: 2.0,  kind: 'anchovy', ys: [80, 90, 100, 110, 120] },
    { t: 4.0,  kind: 'anchovy', ys: [140, 150, 160, 170, 180] },
    { t: 6.5,  kind: 'anchovy', ys: [60, 80, 100, 120, 140, 160] },
    { t: 9.0,  kind: 'shrimp',  ys: [200] },
    { t: 11.0, kind: 'anchovy', ys: [70, 85, 100, 115, 130] },
    { t: 13.5, kind: 'shrimp',  ys: [50, 200] },

    // === 15-35초: 새우/멸치 혼합 ===
    { t: 16.0, kind: 'mackerel', ys: [120] },
    { t: 18.5, kind: 'anchovy',  ys: [80, 90, 100, 110, 120, 130] },
    { t: 21.0, kind: 'shrimp',   ys: [60, 180] },
    { t: 24.0, kind: 'mackerel', ys: [90, 150] },
    { t: 27.0, kind: 'anchovy',  ys: [60, 75, 90, 105, 120, 135, 150] },
    { t: 30.0, kind: 'shrimp',   ys: [200] },
    { t: 32.5, kind: 'mackerel', ys: [110] },

    // === 35-60초: 난이도 상승 ===
    { t: 36.0, kind: 'anchovy',  ys: [70, 90, 110, 130, 150] },
    { t: 38.0, kind: 'mackerel', ys: [80, 160] },
    { t: 41.0, kind: 'shrimp',   ys: [50, 100, 200] },
    { t: 44.0, kind: 'anchovy',  ys: [60, 80, 100, 120, 140, 160, 180] },
    { t: 47.0, kind: 'mackerel', ys: [100, 140] },
    { t: 50.0, kind: 'shrimp',   ys: [60, 200] },
    { t: 53.0, kind: 'mackerel', ys: [80] },
    { t: 55.0, kind: 'anchovy',  ys: [70, 90, 110, 130, 150, 170] },
    { t: 58.0, kind: 'shrimp',   ys: [50, 180] },

    // === 60-80초: 보스 직전 러시 ===
    { t: 62.0, kind: 'mackerel', ys: [100, 140, 180] },
    { t: 65.0, kind: 'anchovy',  ys: [60, 75, 90, 105, 120, 135, 150, 165] },
    { t: 68.0, kind: 'shrimp',   ys: [60, 100, 180] },
    { t: 71.0, kind: 'mackerel', ys: [80, 120, 160] },
    { t: 75.0, kind: 'anchovy',  ys: [60, 80, 100, 120, 140, 160] },
  ],
};
