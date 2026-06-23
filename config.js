// 스테이지 3 — 심해 배경 + stage3_bg 오버레이 + 생물발광 파티클
import { W, H } from './config.js';
import { assets } from './assetManager.js';

export class Parallax3 {
  constructor() {
    this.t = 0;
    this.dots = this._makeDots(55);
    this.glows = this._makeGlows(18);
  }

  _makeDots(n) {
    const arr = [];
    let s = 33311;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < n; i++) {
      arr.push({
        x: rand() * W * 2, y: rand() * H,
        b: 0.2 + rand() * 0.5,
        hue: rand() < 0.5 ? 180 : 280, // 청록 or 보라
      });
    }
    return arr;
  }

  _makeGlows(n) {
    // 생물발광 해파리/플랑크톤 실루엣
    const arr = [];
    let s = 77733;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < n; i++) {
      arr.push({
        x: rand() * W * 3, y: 30 + rand() * (H - 60),
        r: 4 + rand() * 8,
        phase: rand() * Math.PI * 2,
        hue: 160 + rand() * 120, // 청록~보라
        speed: 0.3 + rand() * 0.5,
      });
    }
    return arr;
  }

  draw(ctx, cameraX, t) {
    this.t = t;

    // 심해 그라디언트 배경
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#001428');
    g.addColorStop(0.5, '#000c1e');
    g.addColorStop(1, '#000408');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 생물발광 광점 (0.2배속)
    for (const d of this.dots) {
      const x = ((d.x - cameraX * 0.2) % (W * 2) + W * 2) % (W * 2);
      if (x < W) {
        const pulse = 0.5 + Math.sin(t * 1.2 + d.y) * 0.5;
        ctx.fillStyle = `hsla(${d.hue}, 80%, 70%, ${d.b * pulse})`;
        ctx.fillRect(x, d.y, 1.5, 1.5);
      }
    }

    // 생물발광 해파리/플랑크톤 (0.35배속)
    for (const g of this.glows) {
      const x = ((g.x - cameraX * 0.35) % (W * 3) + W * 3) % (W * 3);
      if (x < W + 20) {
        const pulse = 0.4 + Math.sin(t * g.speed + g.phase) * 0.35;
        ctx.save();
        ctx.globalAlpha = pulse;
        // 외곽 글로우
        const grad = ctx.createRadialGradient(x, g.y, 0, x, g.y, g.r * 2);
        grad.addColorStop(0, `hsla(${g.hue}, 90%, 80%, 0.6)`);
        grad.addColorStop(1, `hsla(${g.hue}, 80%, 60%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, g.y, g.r * 2, 0, Math.PI * 2);
        ctx.fill();
        // 코어
        ctx.fillStyle = `hsla(${g.hue}, 100%, 90%, 0.8)`;
        ctx.beginPath();
        ctx.arc(x, g.y, g.r * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // stage3_bg 오버레이 (0.45배속, 반투명)
    const bg = assets.stage3_bg;
    if (bg) {
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
      const bw = bg.naturalWidth, bh = bg.naturalHeight;
      const drawW = bw * (H / bh);
      const offset = ((-cameraX * 0.45) % drawW + drawW) % drawW;
      ctx.globalAlpha = 0.55;
      ctx.drawImage(bg, -offset, 0, drawW, H);
      ctx.drawImage(bg, drawW - offset, 0, drawW, H);
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }
}
