// 배경 이미지(static) + 패럴렉스 mid 레이어(반복 스크롤) + 떠다니는 광점(원거리).
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

    // 배경 — 정적 이미지 (가로 스크롤 살짝, 0.15배속)
    const bg = assets.background;
    if (bg) {
      const bgW = bg.naturalWidth;
      const offset = ((-cameraX * 0.15) % bgW + bgW) % bgW;
      // 화면 폭이 배경 폭보다 크면 두 번 그림
      ctx.drawImage(bg, -offset, 0, bgW, H);
      if (W > bgW - offset) {
        ctx.drawImage(bg, bgW - offset, 0, bgW, H);
      }
    } else {
      // fallback
      ctx.fillStyle = '#0d3858';
      ctx.fillRect(0, 0, W, H);
    }

    // 먼 광점 (0.25배속)
    ctx.save();
    for (const d of this.dots) {
      const x = ((d.x - cameraX * 0.25) % (W * 2) + W * 2) % (W * 2);
      if (x < W) {
        ctx.fillStyle = `rgba(220, 240, 255, ${d.b * (0.7 + Math.sin(t * 1.5 + d.y) * 0.3)})`;
        ctx.fillRect(x, d.y, 1, 1);
      }
    }
    ctx.restore();

    // 중간 레이어 — 해파리/물고기 실루엣 (0.45배속, 반복)
    const mid = assets.parallax_mid;
    if (mid) {
      const mw = mid.naturalWidth;
      const mh = mid.naturalHeight;
      const drawH = H * 0.85;
      const drawW = mw * (drawH / mh);
      const offset = ((-cameraX * 0.45) % drawW + drawW) % drawW;
      ctx.globalAlpha = 0.55;
      ctx.drawImage(mid, -offset, H - drawH, drawW, drawH);
      if (W > drawW - offset) {
        ctx.drawImage(mid, drawW - offset, H - drawH, drawW, drawH);
      }
      ctx.globalAlpha = 1;
    }
  }
}
