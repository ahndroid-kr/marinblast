// 스테이지 4 — 극심해. 완전한 어둠 + 생물발광 강조
import { W, H } from './config.js';

export class Parallax4 {
  constructor() {
    this.glows = this._makeGlows(22);
    this.tendrils = this._makeTendrils(8);
  }

  _makeGlows(n) {
    const arr = []; let s = 44411;
    const rand = () => { s=(s*9301+49297)%233280; return s/233280; };
    for (let i=0; i<n; i++) arr.push({
      x: rand()*W*3, y: 20+rand()*(H-40),
      r: 5+rand()*12, phase: rand()*Math.PI*2,
      hue: rand()<0.6 ? 170+rand()*30 : 270+rand()*40,
      speed: 0.4+rand()*0.8,
    });
    return arr;
  }

  _makeTendrils(n) {
    const arr = []; let s = 99933;
    const rand = () => { s=(s*9301+49297)%233280; return s/233280; };
    for (let i=0; i<n; i++) arr.push({
      x: rand()*W*2, segments: 4+Math.floor(rand()*4),
      hue: 170+rand()*60,
    });
    return arr;
  }

  draw(ctx, cameraX, t) {
    // 극심해 배경
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#06020e');
    g.addColorStop(0.6, '#080414');
    g.addColorStop(1, '#120820');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 바닥 열수분출공 희미한 빛
    const ventGlow = ctx.createRadialGradient(W*0.3, H, 0, W*0.3, H, 80);
    ventGlow.addColorStop(0, 'rgba(80,30,0,0.3)');
    ventGlow.addColorStop(1, 'rgba(80,30,0,0)');
    ctx.fillStyle = ventGlow;
    ctx.fillRect(0, H-80, W, 80);

    // 생물발광 글로우 (0.3배속)
    for (const g of this.glows) {
      const x = ((g.x - cameraX*0.3) % (W*3) + W*3) % (W*3);
      if (x < W+20) {
        const pulse = 0.3 + Math.sin(t*g.speed + g.phase)*0.35;
        ctx.save();
        ctx.globalAlpha = pulse;
        const grad = ctx.createRadialGradient(x, g.y, 0, x, g.y, g.r*2.5);
        grad.addColorStop(0, `hsla(${g.hue},90%,85%,0.7)`);
        grad.addColorStop(1, `hsla(${g.hue},80%,60%,0)`);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(x, g.y, g.r*2.5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = `hsla(${g.hue},100%,95%,0.9)`;
        ctx.beginPath(); ctx.arc(x, g.y, g.r*0.3, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      }
    }

    // 심해 해초 실루엣 (0.2배속)
    ctx.save();
    ctx.globalAlpha = 0.25;
    for (const td of this.tendrils) {
      const x = ((td.x - cameraX*0.2) % (W*2) + W*2) % (W*2);
      if (x < W+20) {
        ctx.strokeStyle = `hsl(${td.hue},60%,30%)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, H);
        for (let s=0; s<td.segments; s++) {
          const sx = x + Math.sin(t*0.5+s)*8;
          const sy = H - (s+1)*(30+td.segments*2);
          ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
