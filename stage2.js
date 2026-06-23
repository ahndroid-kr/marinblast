// 지형: 천장은 어두운 바위, 바닥은 어두운 바위 + 자동 분리된 식물 타일.
import { W, H, PLANT_COUNT } from './config.js';
import { assets } from './assetManager.js';

export class Terrain {
  constructor(keyframes, totalWidth) {
    this.keyframes = keyframes;
    this.totalWidth = totalWidth;
    this.deco = this._buildDeco();
  }

  _buildDeco() {
    let s = 7777;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const arr = [];
    for (let x = 0; x < this.totalWidth + 200; ) {
      const plantIdx = Math.floor(rand() * PLANT_COUNT);
      const scale = 0.7 + rand() * 0.6; // 0.7~1.3 배
      arr.push({ x, plantIdx, scale });
      x += 60 + Math.floor(rand() * 80);
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

    ctx.strokeStyle = '#3a607a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let sx = 0; sx <= W; sx += 2) {
      const { top } = this.sample(cameraX + sx);
      if (sx === 0) ctx.moveTo(sx, top); else ctx.lineTo(sx, top);
    }
    ctx.stroke();

    // 바닥 베이스
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

    ctx.strokeStyle = '#3a8aa0';
    ctx.beginPath();
    for (let sx = 0; sx <= W; sx += 2) {
      const { bottom } = this.sample(cameraX + sx);
      if (sx === 0) ctx.moveTo(sx, bottom); else ctx.lineTo(sx, bottom);
    }
    ctx.stroke();

    // 식물 타일 — 화면 안에서만 그리되, 우측 가장자리에서 잘려 보이지 않도록 클리핑
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.clip();
    for (const d of this.deco) {
      const screenX = d.x - cameraX;
      if (screenX < -80 || screenX > W + 40) continue;
      const key = `plant_${String(d.plantIdx).padStart(2, '0')}`;
      const img = assets[key];
      if (!img) continue;
      const { bottom } = this.sample(d.x);
      const drawH = img.naturalHeight * d.scale * 0.7;
      const drawW = img.naturalWidth * d.scale * 0.7;
      ctx.drawImage(img, screenX - drawW / 2, bottom - drawH + 3, drawW, drawH);
    }
    ctx.restore();
  }
}
