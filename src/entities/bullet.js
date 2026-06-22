import { BULLET, W } from '../config.js';

// 플레이어 탄
export function drawBullet(ctx, b) {
  if (b.kind === 'player') {
    // 거품/진주 스타일 — 하늘색 원 + 흰 하이라이트
    ctx.fillStyle = '#80e8ff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
    ctx.fill();
    // 가장자리 테두리
    ctx.strokeStyle = '#40b0e0';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    // 흰 하이라이트 (왼쪽 위)
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(b.x - 0.8, b.y - 0.8, 1, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // 적 탄 — 빨간 물방울
    ctx.fillStyle = '#ff3060';
    ctx.beginPath();
    ctx.arc(b.x, b.y, BULLET.radius + 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#cc0030';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    // 흰 코어
    ctx.fillStyle = 'rgba(255,220,220,0.9)';
    ctx.beginPath();
    ctx.arc(b.x - 0.5, b.y - 0.5, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
}
