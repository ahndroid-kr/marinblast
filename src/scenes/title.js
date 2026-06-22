import { W, H } from '../config.js';
import { Parallax } from '../parallax.js';

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
    this.parallax.update?.(dt);
    // 키 눌리거나 터치 시작 시 진행
    if (input.anyKeyEdge) {
      this.onStart();
    }
  }

  draw(ctx) {
    this.parallax.draw(ctx, this.scrollX, this.t);

    // 타이틀
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.fillStyle = '#80e0ff';
    ctx.fillText('MARINE', W / 2, H / 2 - 30);
    ctx.fillStyle = '#ffcc40';
    ctx.fillText('BLAST', W / 2, H / 2);

    // 깜박이는 안내
    if (Math.floor(this.t * 2) % 2 === 0) {
      ctx.font = '8px "Courier New", monospace';
      ctx.fillStyle = '#fff';
      ctx.fillText('PRESS ANY KEY  /  TOUCH TO START', W / 2, H / 2 + 40);
    }

    // 조작
    ctx.font = '7px "Courier New", monospace';
    ctx.fillStyle = '#88aacc';
    ctx.fillText('ARROW/WASD: MOVE   Z/SPACE: SHOOT', W / 2, H - 30);
    ctx.fillText('TOUCH: DRAG TO MOVE (AUTO FIRE)', W / 2, H - 18);
    ctx.textAlign = 'left';
  }
}
