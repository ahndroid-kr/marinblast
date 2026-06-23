import { W, H, PLAYER, BULLET, OPTION_DRAW, QA_MODE } from '../config.js';
import { flipped } from '../assetManager.js';

// 터치 시 스프라이트를 손가락 위로 띄우는 오프셋 (px)
// 히트박스/이동은 실제 p.x/p.y 기준, 그림만 위로 올림
const TOUCH_DRAW_OFFSET_Y = 48;

export function makePlayer() {
  return {
    x: PLAYER.startX,
    y: PLAYER.startY,
    fireTimer: 0,
    power: 0,
    powerTime: 0,
    shieldTime: 0,
    alive: true,
    invulnAfterHit: 0,
    history: [],
    historyMax: 60,
    isTouching: false,  // 터치 중인지 여부 (draw에서 오프셋 적용)
  };
}

export function updatePlayer(p, input, dt) {
  if (!p.alive) return;

  p.isTouching = input.touchActive;

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
  if (!QA_MODE) {
    if (p.shieldTime > 0) p.shieldTime -= dt;
    if (p.powerTime > 0) {
      p.powerTime -= dt;
      if (p.powerTime <= 0) { p.powerTime = 0; p.power = 0; }
    }
  } else {
    if (p.power > 0) p.powerTime = 999;
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

  // 터치 중이면 스프라이트를 손가락 위로 올려서 그림
  // 히트박스(p.x/p.y)는 그대로 — 눈에 보이는 위치만 오프셋
  const drawY = p.isTouching
    ? Math.max(PLAYER.drawH / 2, p.y - TOUCH_DRAW_OFFSET_Y)
    : p.y;

  if (p.shieldTime > 0) {
    const pulse = 0.7 + Math.sin(p.shieldTime * 10) * 0.3;
    ctx.fillStyle = `rgba(100, 180, 255, ${0.15 * pulse})`;
    ctx.beginPath();
    ctx.arc(p.x, drawY, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(140, 230, 255, ${pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, drawY, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 * pulse})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(p.x, drawY, 18, 0, Math.PI * 2);
    ctx.stroke();
    const rotAngle = p.shieldTime * 3;
    for (let i = 0; i < 4; i++) {
      const a = rotAngle + i * Math.PI / 2;
      ctx.fillStyle = '#fff';
      ctx.fillRect(p.x + Math.cos(a) * 22 - 1.5, drawY + Math.sin(a) * 22 - 1.5, 3, 3);
    }
  }

  const img = flipped.player;
  if (img) {
    ctx.drawImage(img, p.x - PLAYER.drawW / 2, drawY - PLAYER.drawH / 2, PLAYER.drawW, PLAYER.drawH);
  } else {
    ctx.fillStyle = '#ff80b0';
    ctx.fillRect(p.x - PLAYER.drawW/2, drawY - PLAYER.drawH/2, PLAYER.drawW, PLAYER.drawH);
  }

  // 터치 중일 때 실제 히트박스 위치를 작은 점으로 표시 (선택적 — 끄려면 아래 블록 삭제)
  if (p.isTouching && drawY !== p.y) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
