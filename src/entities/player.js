import { W, H, PLAYER, BULLET } from '../config.js';
import { flipped } from '../assetManager.js';

export function makePlayer() {
  return {
    x: PLAYER.startX,
    y: PLAYER.startY,
    fireTimer: 0,
    power: 0,
    powerTime: 0,    // 빨강 파워업 잔여 시간 (0이면 power=0)
    shieldTime: 0,
    alive: true,
    invulnAfterHit: 0,
    history: [],
    historyMax: 60,
  };
}

export function updatePlayer(p, input, dt) {
  if (!p.alive) return;

  let mx = 0, my = 0;
  if (input.touchActive) {
    const dx = input.touchTarget.x - p.x;
    const dy = input.touchTarget.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 1) {
      const maxStep = PLAYER.speed * dt;
      const step = Math.min(maxStep, dist);
      mx = (dx / dist) * step;
      my = (dy / dist) * step;
    }
  } else {
    mx = input.axisX() * PLAYER.speed * dt;
    my = input.axisY() * PLAYER.speed * dt;
  }
  p.x = Math.max(PLAYER.drawW / 2, Math.min(W - PLAYER.drawW / 2, p.x + mx));
  p.y = Math.max(PLAYER.drawH / 2, Math.min(H - PLAYER.drawH / 2, p.y + my));

  p.history.unshift({ x: p.x, y: p.y });
  if (p.history.length > p.historyMax) p.history.length = p.historyMax;

  p.fireTimer -= dt;
  if (p.shieldTime > 0) p.shieldTime -= dt;
  if (p.powerTime > 0) {
    p.powerTime -= dt;
    if (p.powerTime <= 0) {
      p.powerTime = 0;
      p.power = 0;
    }
  }
  if (p.invulnAfterHit > 0) p.invulnAfterHit -= dt;
}

export function tryFire(p, input, bulletPool, options) {
  if (!p.alive) return;
  if (!input.fire) return;
  if (p.fireTimer > 0) return;
  p.fireTimer = PLAYER.fireRate;

  const b = bulletPool.spawn();
  if (b) { b.x = p.x + PLAYER.drawW / 2; b.y = p.y; b.vx = BULLET.speed; b.vy = 0; b.kind = 'player'; }

  if (p.power >= 1) {
    const b2 = bulletPool.spawn();
    if (b2) { b2.x = p.x + 6; b2.y = p.y - 4; b2.vx = BULLET.speed; b2.vy = -30; b2.kind = 'player'; }
    const b3 = bulletPool.spawn();
    if (b3) { b3.x = p.x + 6; b3.y = p.y + 4; b3.vx = BULLET.speed; b3.vy = 30; b3.kind = 'player'; }
  }

  for (const opt of options) {
    if (!opt.active) continue;
    const ob = bulletPool.spawn();
    if (ob) { ob.x = opt.x + 8; ob.y = opt.y; ob.vx = BULLET.speed; ob.vy = 0; ob.kind = 'player'; }
  }
}

export function drawPlayer(ctx, p) {
  if (!p.alive) return;
  if (p.invulnAfterHit > 0 && Math.floor(p.invulnAfterHit * 20) % 2 === 0) return;

  if (p.shieldTime > 0) {
    // 강화된 실드 — 굵은 외곽 링 + 안쪽 글로우 + 회전하는 입자
    const pulse = 0.7 + Math.sin(p.shieldTime * 10) * 0.3;
    // 바깥 글로우
    ctx.fillStyle = `rgba(100, 180, 255, ${0.15 * pulse})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 26, 0, Math.PI * 2);
    ctx.fill();
    // 굵은 외곽선
    ctx.strokeStyle = `rgba(140, 230, 255, ${pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 22, 0, Math.PI * 2);
    ctx.stroke();
    // 안쪽 가는 링
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 * pulse})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
    ctx.stroke();
    // 회전하는 입자 4개
    const rotAngle = p.shieldTime * 3;
    for (let i = 0; i < 4; i++) {
      const a = rotAngle + i * Math.PI / 2;
      const px = p.x + Math.cos(a) * 22;
      const py = p.y + Math.sin(a) * 22;
      ctx.fillStyle = '#fff';
      ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
    }
  }

  const img = flipped.player; // 좌우 반전된 (오른쪽 보는) 잠수함
  if (img) {
    ctx.drawImage(img, p.x - PLAYER.drawW / 2, p.y - PLAYER.drawH / 2, PLAYER.drawW, PLAYER.drawH);
  } else {
    // fallback
    ctx.fillStyle = '#ff80b0';
    ctx.fillRect(p.x - PLAYER.drawW/2, p.y - PLAYER.drawH/2, PLAYER.drawW, PLAYER.drawH);
  }
}
