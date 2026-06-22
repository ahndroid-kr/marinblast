// 지형: 천장은 어두운 바위 그라디언트, 바닥은 해초/산호 타일 + 바위 베이스.
// 충돌은 키프레임 기반 컬럼 시스템 그대로.

import { W, H } from './config.js';
import { assets } from './assetManager.js';

// 타일셋(terrain.png)에서 사용할 영역 좌표 (원본 600x383 기준 추정)
// 실제 이미지에서 산호/해초 부분만 source rect로 잘라 사용
const TILE_RECTS = {
  // 해초 (왼쪽 큰 것들)
  seaweed_small:  { sx:  6,  sy: 32, sw: 70,  sh: 165 },
  seaweed_med:    { sx: 78,  sy:  6, sw: 80,  sh: 195 },
  seaweed_tall:   { sx: 160, sy:  6, sw: 85,  sh: 195 },
  // 산호
  coral_pink_a:   { sx: 252, sy: 50, sw: 90,  sh: 150 },
  coral_pink_b:   { sx: 345, sy: 35, sw: 110, sh: 165 },
  coral_pink_c:   { sx: 458, sy: 50, sw: 75,  sh: 150 },
};

export class Terrain {
  constructor(keyframes, totalWidth) {
    this.keyframes = keyframes;
    this.totalWidth = totalWidth;
    // 바닥 데코 — worldX마다 어떤 타일을 놓을지 (시드 기반 의사난수)
    this.deco = this._buildDeco();
  }

  _buildDeco() {
    let s = 7777;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const arr = [];
    const tileKeys = Object.keys(TILE_RECTS);
    for (let x = 0; x < this.totalWidth + 200; x += 80 + Math.floor(rand() * 60)) {
      arr.push({ x, kind: tileKeys[Math.floor(rand() * tileKeys.length)] });
    }
    return arr;
  }

  sample(worldX) {
    const kfs = this.keyframes;
    if (worldX <= kfs[0].x) return { top: kfs[0].top, bottom: kfs[0].bottom };
    if (worldX >= kfs[kfs.length - 1].x) {
      const k = kfs[kfs.length - 1];
      return { top: k.top, bottom: k.bottom };
    }
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

  collides(worldX, screenY, radius = 3) {
    const { top, bottom } = this.sample(worldX);
    return screenY - radius < top || screenY + radius > bottom;
  }

  draw(ctx, cameraX) {
    // 천장 — 어두운 바위
    ctx.fillStyle = '#1a3040';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let sx = 0; sx <= W; sx += 2) {
      const { top } = this.sample(cameraX + sx);
      ctx.lineTo(sx, top);
    }
    ctx.lineTo(W, 0);
    ctx.closePath();
    ctx.fill();

    // 천장 윤곽 (밝은 줄)
    ctx.strokeStyle = '#3a607a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let sx = 0; sx <= W; sx += 2) {
      const { top } = this.sample(cameraX + sx);
      if (sx === 0) ctx.moveTo(sx, top); else ctx.lineTo(sx, top);
    }
    ctx.stroke();

    // 바닥 — 어두운 청록 베이스
    ctx.fillStyle = '#0a3848';
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let sx = 0; sx <= W; sx += 2) {
      const { bottom } = this.sample(cameraX + sx);
      ctx.lineTo(sx, bottom);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();

    // 바닥 윤곽 + 모래색 띠
    ctx.strokeStyle = '#3a8aa0';
    ctx.beginPath();
    for (let sx = 0; sx <= W; sx += 2) {
      const { bottom } = this.sample(cameraX + sx);
      if (sx === 0) ctx.moveTo(sx, bottom); else ctx.lineTo(sx, bottom);
    }
    ctx.stroke();

    // 바닥 데코 — 해초/산호 타일
    const t = assets.terrain;
    if (t) {
      for (const d of this.deco) {
        const screenX = d.x - cameraX;
        if (screenX < -100 || screenX > W + 50) continue;
        const r = TILE_RECTS[d.kind];
        if (!r) continue;
        // 타일을 바닥 라인 위에 올림
        const { bottom } = this.sample(d.x);
        // 해초/산호 종류별 적정 크기
        const drawH = d.kind.startsWith('seaweed') ? 36 : 28;
        const drawW = drawH * (r.sw / r.sh);
        const drawX = screenX - drawW / 2;
        const drawY = bottom - drawH + 4; // 바닥에 약간 박힌 느낌
        ctx.drawImage(t, r.sx, r.sy, r.sw, r.sh, drawX, drawY, drawW, drawH);
      }
    }
  }
}
