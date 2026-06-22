import { W, H } from '../config.js';
import { Parallax } from '../parallax.js';
import { assets, flipped } from '../assetManager.js';

export class TitleScene {
  constructor(onStart) {
    this.onStart = onStart;
    this.parallax = new Parallax();
    this.t = 0;
    this.scrollX = 0;
  }

  update(dt, input) {
    this.t += dt;
    this.scrollX += 30 * dt;
    if (input.anyKeyEdge) this.onStart();
  }

  draw(ctx) {
    this.parallax.draw(ctx, this.scrollX, this.t);

    // 약간 어둡게
    ctx.fillStyle = 'rgba(0, 16, 32, 0.35)';
    ctx.fillRect(0, 0, W, H);

    // 잠수함 데모 — 둥실
    const subImg = flipped.player;
    if (subImg) {
      const subW = 56, subH = 36;
      const bob = Math.sin(this.t * 2) * 4;
      ctx.drawImage(subImg, W / 2 - subW / 2, H - 80 + bob, subW, subH);
    }

// 타이틀 로고 이미지
    const logo = assets.title_logo;
    if (logo) {
      const lw = 200, lh = Math.round(logo.naturalHeight * (200 / logo.naturalWidth));
      ctx.drawImage(logo, W / 2 - lw / 2, H / 2 - lh / 2 - 20, lw, lh);
    }

    if (Math.floor(this.t * 2) % 2 === 0) {
      ctx.font = '9px "Courier New", monospace';
      ctx.fillStyle = '#fff';
      ctx.strokeText('PRESS ANY KEY / TOUCH TO START', W / 2, H / 2 + 30);
      ctx.fillText('PRESS ANY KEY / TOUCH TO START', W / 2, H / 2 + 30);
    }

    ctx.font = '7px "Courier New", monospace';
    ctx.fillStyle = '#88aacc';
    ctx.fillText('ARROW/WASD: MOVE   Z/SPACE: SHOOT', W / 2, H - 24);
    ctx.fillText('TOUCH: DRAG TO MOVE (AUTO FIRE)', W / 2, H - 14);
    ctx.textAlign = 'left';
  }
}
