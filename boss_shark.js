// 보스 사망 시 드랍되는 에너지 포션 (+1 라이프)
// 분홍톤이지만 하트와 구별되는 보라-분홍 색
import { H } from '../config.js';
import { assets } from '../assetManager.js';

export function makeLifeItem() {
  return { active: false, x: 0, y: 0, vx: -50, vy: 0, age: 0 };
}

export function resetLifeItem(item, x, y) {
  item.x = x; item.y = y;
  item.vx = -50 + (Math.random()-0.5)*20;
  item.vy = -60 + Math.random()*30;
  item.age = 0;
}

export function updateLifeItem(item, dt) {
  item.age += dt;
  item.x += item.vx * dt;
  item.vy += 60 * dt; // 중력
  item.y += item.vy * dt;
  item.vy *= 0.98;
  if (item.x < -30 || item.y > H + 20) item.active = false;
}

export function drawLifeItem(ctx, item) {
  const img = assets.energy_potion;
  const bob = Math.sin(item.age * 4) * 2;
  if (img) {
    const w = 20, h = 20;
    ctx.drawImage(img, item.x - w/2, item.y - h/2 + bob, w, h);
  } else {
    // 폴백: 보라-분홍 하트
    ctx.fillStyle = '#cc44aa';
    const s = 1.5;
    const pattern = [
      [0,1,1,0,0,1,1,0],
      [1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,0],
      [0,0,1,1,1,1,0,0],
      [0,0,0,1,1,0,0,0],
    ];
    const ox = item.x - 6, oy = item.y - 4.5 + bob;
    for (let py = 0; py < pattern.length; py++)
      for (let px = 0; px < pattern[py].length; px++)
        if (pattern[py][px]) ctx.fillRect(ox + px*s, oy + py*s, s, s);
    // 반짝이
    ctx.fillStyle = '#ffaaee';
    ctx.fillRect(item.x - 3, item.y - 5 + bob, 1, 1);
  }
}
