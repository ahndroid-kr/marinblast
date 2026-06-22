import { W, H, PLAYER, BULLET, OPTION } from '../config.js';

export function makePlayer() {
  return {
    x: PLAYER.startX,
    y: PLAYER.startY,
    fireTimer: 0,
    power: 0,       // 0=기본, 1=강화 (빨강 불가사리)
    shieldTime: 0,  // 무적 잔여 시간
    alive: true,
    invulnAfterHit: 0, // 피격 후 잠깐 무적
    history: [],    // 옵션이 따라다닐 과거 좌표 큐
    historyMax: 60, // 충분히 길게
  };
}

export function updatePlayer(p, input, dt) {
  if (!p.alive) return;

  // 이동
  let mx = 0, my = 0;
  if (input.touchActive) {
    // 손가락 위치로 부드럽게 추적 (lerp)
    const dx = input.touchTarget.x - p.x;
    const dy = input.touchTarget.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 1) {
      // 손가락이 가까우면 천천히, 멀면 최대속도
      const maxStep = PLAYER.speed * dt;
      const step = Math.min(maxStep, dist);
      mx = (dx / dist) * step;
      my = (dy / dist) * step;
    }
  } else {
    mx = input.axisX() * PLAYER.speed * dt;
    my = input.axisY() * PLAYER.speed * dt;
  }
  p.x = Math.max(8, Math.min(W - 8, p.x + mx));
  p.y = Math.max(8, Math.min(H - 8, p.y + my));

  // 과거 좌표 큐 갱신
  p.history.unshift({ x: p.x, y: p.y });
  if (p.history.length > p.historyMax) p.history.length = p.historyMax;

  // 발사 타이머
  p.fireTimer -= dt;
  if (p.shieldTime > 0) p.shieldTime -= dt;
  if (p.invulnAfterHit > 0) p.invulnAfterHit -= dt;
}

// 플레이어 발사 시도. 발사 가능하면 풀에서 탄을 받아 세팅.
export function tryFire(p, input, bulletPool, options) {
  if (!p.alive) return;
  if (!input.fire) return;
  if (p.fireTimer > 0) return;
  p.fireTimer = PLAYER.fireRate;

  // 메인 샷
  const b = bulletPool.spawn();
  if (b) { b.x = p.x + 8; b.y = p.y; b.vx = BULLET.speed; b.vy = 0; b.kind = 'player'; }

  // 빨강 강화 시 보조 탄
  if (p.power >= 1) {
    const b2 = bulletPool.spawn();
    if (b2) { b2.x = p.x + 6; b2.y = p.y - 4; b2.vx = BULLET.speed; b2.vy = -20; b2.kind = 'player'; }
    const b3 = bulletPool.spawn();
    if (b3) { b3.x = p.x + 6; b3.y = p.y + 4; b3.vx = BULLET.speed; b3.vy = 20; b3.kind = 'player'; }
  }

  // 옵션도 같이 발사
  for (const opt of options) {
    if (!opt.active) continue;
    const ob = bulletPool.spawn();
    if (ob) { ob.x = opt.x + 6; ob.y = opt.y; ob.vx = BULLET.speed; ob.vy = 0; ob.kind = 'player'; }
  }
}

export function drawPlayer(ctx, p) {
  if (!p.alive) return;
  // 피격 후 깜박임
  if (p.invulnAfterHit > 0 && Math.floor(p.invulnAfterHit * 20) % 2 === 0) return;

  // 무적 쉴드
  if (p.shieldTime > 0) {
    ctx.strokeStyle = `rgba(120, 220, 255, ${0.5 + Math.sin(p.shieldTime * 12) * 0.3})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 본체 (삼각형 비행기 - 임시)
  ctx.fillStyle = '#ddeeff';
  ctx.beginPath();
  ctx.moveTo(p.x + 10, p.y);
  ctx.lineTo(p.x - 6, p.y - 6);
  ctx.lineTo(p.x - 3, p.y);
  ctx.lineTo(p.x - 6, p.y + 6);
  ctx.closePath();
  ctx.fill();
  // 콕핏
  ctx.fillStyle = '#3388cc';
  ctx.fillRect(p.x + 1, p.y - 1, 3, 2);
  // 분사
  ctx.fillStyle = '#ff8800';
  ctx.fillRect(p.x - 6, p.y - 1, 2, 2);
}
