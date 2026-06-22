import { W, H } from '../config.js';
import { Parallax } from '../parallax.js';
import { assets, flipped } from '../assetManager.js';
import { audio } from '../audio.js';

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
    audio.play('main');
    if (input.anyKeyEdge) this.onStart();
  }

  draw(ctx) {
    this.parallax.draw(ctx, this.scrollX, this.t);
    ctx.fillStyle = 'rgba(0, 16, 32, 0.35)';
    ctx.fillRect(0, 0, W, H);

    const subImg = flipped.player;
    if (subImg) {
      const subW = 56, subH = 36;
      const bob = Math.sin(this.t * 2) * 4;
      ctx.drawImage(subImg, W / 2 - subW / 2, H - 80 + bob, subW, subH);
    }

    ctx.textAlign = 'center';
    const logo = assets.title_logo;
    if (logo) {
      const lw = 200;
      const lh = Math.round(logo.naturalHeight * (lw / logo.naturalWidth));
      ctx.drawImage(logo, W / 2 - lw / 2, H / 2 - lh / 2 - 20, lw, lh);
    } else {
      ctx.font = 'bold 32px "Courier New", monospace';
      ctx.strokeStyle = '#003050'; ctx.lineWidth = 4;
      ctx.fillStyle = '#80e0ff';
      ctx.strokeText('MARINE', W / 2, H / 2 - 30);
      ctx.fillText('MARINE', W / 2, H / 2 - 30);
      ctx.fillStyle = '#ffcc40';
      ctx.strokeText('BLAST', W / 2, H / 2 + 4);
      ctx.fillText('BLAST', W / 2, H / 2 + 4);
    }

    if (Math.floor(this.t * 2) % 2 === 0) {
      ctx.font = '9px "Courier New", monospace';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      ctx.strokeText('PRESS ANY KEY / TOUCH TO START', W / 2, H / 2 + 70);
      ctx.fillText('PRESS ANY KEY / TOUCH TO START', W / 2, H / 2 + 70);
    }

    ctx.font = '7px "Courier New", monospace';
    ctx.fillStyle = '#88aacc';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
    ctx.strokeText('ARROW/WASD: MOVE   Z/SPACE: SHOOT', W / 2, H - 24);
    ctx.fillText('ARROW/WASD: MOVE   Z/SPACE: SHOOT', W / 2, H - 24);
    ctx.strokeText('TOUCH: DRAG TO MOVE (AUTO FIRE)', W / 2, H - 14);
    ctx.fillText('TOUCH: DRAG TO MOVE (AUTO FIRE)', W / 2, H - 14);
    ctx.textAlign = 'left';
  }
}
