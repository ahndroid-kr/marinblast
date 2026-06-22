import { BULLET, W } from '../config.js';

// 플레이어 탄
export function makeBullet() {
  return { active: false, x: 0, y: 0, vx: 0, vy: 0, kind: 'player' };
}

export function resetBullet(b, x, y, vx, vy, kind = 'player') {
  b.x = x; b.y = y; b.vx = vx; b.vy = vy; b.kind = kind;
}

export function updateBullet(b, dt) {
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  if (b.x < -10 || b.x > W + 10 || b.y < -10 || b.y > 250) b.active = false;
}

export function drawBullet(ctx, b) {
  if (b.kind === 'player') {
    ctx.fillStyle = '#fffac8';
    ctx.fillRect(b.x - 3, b.y - 1, 6, 2);
    ctx.fillStyle = '#ffe060';
    ctx.fillRect(b.x - 2, b.y, 4, 1);
  } else {
    // 적 탄
    ctx.fillStyle = '#ff6080';
    ctx.beginPath();
    ctx.arc(b.x, b.y, BULLET.radius + 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe0e0';
    ctx.fillRect(b.x - 0.5, b.y - 0.5, 1, 1);
  }
}
