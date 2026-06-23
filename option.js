// 배경 + 패럴렉스 mid + 광점.
// 배경은 화면 폭에 맞게 stretch (정적, 스크롤 없음 — 이음새 문제 회피).
// mid 레이어는 충분히 큰 폭이고 좌우 안전하게 그림.

import { W, H } from './config.js';
import { assets } from './assetManager.js';

export class Parallax {
  constructor() {
    this.t = 0;
    this.dots = this._makeDots(40);
  }

  _makeDots(n) {
    const arr = [];
    let s = 12345;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < n; i++) {
      arr.push({ x: rand() * W * 2, y: rand() * H, b: 0.3 + rand() * 0.5 });
    }
    return arr;
  }

  draw(ctx, cameraX, t) {
    this.t = t;

    // 배경 — 화면 폭 가득 채워 stretch (스크롤 없음, 이음새 문제 회피)
    const bg = assets.background;
    if (bg) {
      ctx.drawImage(bg, 0, 0, W, H);
    } else {
      ctx.fillStyle = '#0d3858';
      ctx.fillRect(0, 0, W, H);
    }

    // 먼 광점 (0.25배속)
    for (const d of this.dots) {
      const x = ((d.x - cameraX * 0.25) % (W * 2) + W * 2) % (W * 2);
      if (x < W) {
        ctx.fillStyle = `rgba(220, 240, 255, ${d.b * (0.7 + Math.sin(t * 1.5 + d.y) * 0.3)})`;
        ctx.fillRect(x, d.y, 1, 1);
      }
    }

    // 중간 레이어 — 해파리/물고기 실루엣 (0.45배속, 반복)
    // 화면을 절대 넘지 않도록 clipping
    const mid = assets.parallax_mid;
    if (mid) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.clip();

      const mw = mid.naturalWidth;
      const mh = mid.naturalHeight;
      const drawH = H * 0.85;
      const drawW = mw * (drawH / mh);
      const offset = ((-cameraX * 0.45) % drawW + drawW) % drawW;
      ctx.globalAlpha = 0.55;
      // 화면 폭이 mid 폭보다 작거나 같으면 한 번만 그려도 되지만, 안전하게 항상 2번
      ctx.drawImage(mid, -offset, H - drawH, drawW, drawH);
      ctx.drawImage(mid, drawW - offset, H - drawH, drawW, drawH);
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }
}
