// 3레이어 패럴렉스. 임시 도형(점·실루엣)으로 깊이감을 만든다.
// 나중에 스프라이트로 교체 예정.

import { W, H } from './config.js';

export class Parallax {
  constructor() {
    // 레이어별 점/실루엣 미리 생성
    this.far = this._makeDots(60, 0.6);   // 먼 심해: 작은 광점
    this.mid = this._makeSilhouettes(12); // 중간: 물고기 떼 실루엣
    this.lightShafts = this._makeShafts(5); // 빛줄기
  }

  _rand(seed) {
    // 시드 기반 의사난수 (재현 가능)
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  _makeDots(count, brightness) {
    const r = this._rand(12345);
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: r() * W * 2,
        y: r() * H,
        b: brightness * (0.4 + r() * 0.6),
      });
    }
    return arr;
  }

  _makeSilhouettes(count) {
    const r = this._rand(67890);
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: r() * W * 3,
        y: 40 + r() * (H - 80),
        s: 3 + r() * 4,
        phase: r() * Math.PI * 2,
      });
    }
    return arr;
  }

  _makeShafts(count) {
    const r = this._rand(54321);
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: r() * W * 1.5,
        w: 20 + r() * 30,
        a: 0.05 + r() * 0.06,
      });
    }
    return arr;
  }

  draw(ctx, cameraX, t) {
    // 배경 그라디언트 (한 번만 draw마다)
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#003860');
    g.addColorStop(0.6, '#001a35');
    g.addColorStop(1, '#000814');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 빛줄기 (가장 먼 레이어, 0.1배속)
    ctx.save();
    for (const sh of this.lightShafts) {
      const x = ((sh.x - cameraX * 0.1) % (W * 1.5) + W * 1.5) % (W * 1.5) - 20;
      ctx.fillStyle = `rgba(120, 200, 255, ${sh.a})`;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + sh.w, 0);
      ctx.lineTo(x + sh.w + 20, H);
      ctx.lineTo(x - 20, H);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 먼 광점 (0.2배속)
    for (const d of this.far) {
      const x = ((d.x - cameraX * 0.2) % (W * 2) + W * 2) % (W * 2);
      if (x < W) {
        ctx.fillStyle = `rgba(180, 220, 255, ${d.b})`;
        ctx.fillRect(x, d.y, 1, 1);
      }
    }

    // 중간 실루엣 물고기 (0.5배속)
    ctx.fillStyle = 'rgba(0, 30, 50, 0.5)';
    for (const s of this.mid) {
      const x = ((s.x - cameraX * 0.5) % (W * 3) + W * 3) % (W * 3);
      if (x > -20 && x < W + 20) {
        const y = s.y + Math.sin(t * 0.5 + s.phase) * 3;
        ctx.beginPath();
        ctx.ellipse(x, y, s.s, s.s * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
