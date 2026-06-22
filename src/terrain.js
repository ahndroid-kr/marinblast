// 지형: x좌표별 ceiling(천장 y) / floor(바닥 y) 값을 저장.
// 키프레임으로 압축 정의, 런타임에 선형보간으로 컬럼 배열을 펼침.
// 데이터: [{ x, top, bottom }, ...] - x는 월드 좌표

import { W, H } from './config.js';

export class Terrain {
  constructor(keyframes, totalWidth) {
    this.keyframes = keyframes;
    this.totalWidth = totalWidth;
    // 컬럼 배열을 미리 만들지 않고, 키프레임 사이의 보간을 매번 계산 (메모리 절약)
  }

  // worldX 위치의 ceiling/floor 반환
  sample(worldX) {
    const kfs = this.keyframes;
    if (worldX <= kfs[0].x) return { top: kfs[0].top, bottom: kfs[0].bottom };
    if (worldX >= kfs[kfs.length - 1].x) {
      const k = kfs[kfs.length - 1];
      return { top: k.top, bottom: k.bottom };
    }
    // 이진 탐색
    let lo = 0, hi = kfs.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (kfs[m].x <= worldX) lo = m;
      else hi = m;
    }
    const a = kfs[lo], b = kfs[hi];
    const t = (worldX - a.x) / (b.x - a.x);
    return {
      top: a.top + (b.top - a.top) * t,
      bottom: a.bottom + (b.bottom - a.bottom) * t,
    };
  }

  // 플레이어/오브젝트가 지형과 충돌하는지 (worldX 기준)
  collides(worldX, screenY, radius = 3) {
    const { top, bottom } = this.sample(worldX);
    return screenY - radius < top || screenY + radius > bottom;
  }

  // 카메라 위치 cameraX 기준으로 화면에 지형을 그림
  draw(ctx, cameraX) {
    // 천장
    ctx.fillStyle = '#1a3a1a';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let sx = 0; sx <= W; sx += 2) {
      const { top } = this.sample(cameraX + sx);
      ctx.lineTo(sx, top);
    }
    ctx.lineTo(W, 0);
    ctx.closePath();
    ctx.fill();

    // 바닥
    ctx.fillStyle = '#2a1a0a';
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let sx = 0; sx <= W; sx += 2) {
      const { bottom } = this.sample(cameraX + sx);
      ctx.lineTo(sx, bottom);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();

    // 윤곽선 (해초/산호 느낌의 디테일은 나중에 스프라이트로 교체)
    ctx.strokeStyle = '#3a5a3a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let sx = 0; sx <= W; sx += 2) {
      const { top } = this.sample(cameraX + sx);
      if (sx === 0) ctx.moveTo(sx, top); else ctx.lineTo(sx, top);
    }
    ctx.stroke();

    ctx.strokeStyle = '#5a3a1a';
    ctx.beginPath();
    for (let sx = 0; sx <= W; sx += 2) {
      const { bottom } = this.sample(cameraX + sx);
      if (sx === 0) ctx.moveTo(sx, bottom); else ctx.lineTo(sx, bottom);
    }
    ctx.stroke();
  }
}
