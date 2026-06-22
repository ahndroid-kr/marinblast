// 파티클 — effects.png 이미지를 쓰지 않고 코드로 직접 그림.
// (효과 이미지의 source rect가 맞지 않아서 흰 박스로 보이던 문제 해결)

export function makeParticle() {
  return {
    active: false,
    x: 0, y: 0, vx: 0, vy: 0,
    life: 0, maxLife: 0.5,
    color: '#fff', size: 2,
    kind: 'dot', // dot | explosion | sparkle
  };
}

export function resetParticle(p, x, y, vx, vy, color, life, size, kind = 'dot') {
  p.x = x; p.y = y; p.vx = vx; p.vy = vy;
  p.color = color; p.life = life; p.maxLife = life;
  p.size = size; p.kind = kind;
}

export function updateParticle(p, dt) {
  p.life -= dt;
  if (p.life <= 0) { p.active = false; return; }
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.vx *= 0.94;
  p.vy *= 0.94;
}

export function drawParticle(ctx, p) {
  const a = p.life / p.maxLife;

  if (p.kind === 'explosion') {
    // 노란/주황 원 + 안쪽 흰 코어
    const t = 1 - a; // 0 → 1
    const r = p.size * (0.4 + t * 0.8);
    ctx.globalAlpha = a;
    // 바깥 주황
    ctx.fillStyle = '#ff9020';
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    // 노랑
    ctx.fillStyle = '#ffe060';
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 0.6, 0, Math.PI * 2);
    ctx.fill();
    // 흰 코어
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }

  if (p.kind === 'sparkle') {
    // 4점 별 모양 — 흰색 + 노란 외곽
    const s = p.size * (0.7 + Math.sin((p.maxLife - p.life) * 30) * 0.3);
    ctx.globalAlpha = a;
    ctx.fillStyle = '#ffe060';
    // 가로 막대
    ctx.fillRect(p.x - s, p.y - 0.5, s * 2, 1);
    // 세로 막대
    ctx.fillRect(p.x - 0.5, p.y - s, 1, s * 2);
    // 흰 코어
    ctx.fillStyle = '#fff';
    ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
    ctx.globalAlpha = 1;
    return;
  }

  // dot — 색 사각형
  ctx.globalAlpha = a;
  ctx.fillStyle = p.color;
  ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  ctx.globalAlpha = 1;
}

// 작은 폭발 (적 사망용)
export function explodeSmall(particlePool, x, y, color = '#ffcc66') {
  const big = particlePool.spawn();
  if (big) resetParticle(big, x, y, 0, 0, '#fff', 0.4, 14, 'explosion');
  for (let i = 0; i < 6; i++) {
    const p = particlePool.spawn();
    if (!p) break;
    const a = (i / 6) * Math.PI * 2 + Math.random() * 0.5;
    const sp = 40 + Math.random() * 50;
    resetParticle(p, x, y, Math.cos(a) * sp, Math.sin(a) * sp, color, 0.3 + Math.random() * 0.2, 1.5 + Math.random() * 1.5, 'dot');
  }
}

// 큰 폭발 (보스용)
export function explodeBig(particlePool, x, y) {
  for (let i = 0; i < 5; i++) {
    const p = particlePool.spawn();
    if (!p) break;
    const ox = (Math.random() - 0.5) * 40;
    const oy = (Math.random() - 0.5) * 40;
    resetParticle(p, x + ox, y + oy, 0, 0, '#fff', 0.5 + Math.random() * 0.3, 22 + Math.random() * 8, 'explosion');
  }
  for (let i = 0; i < 16; i++) {
    const p = particlePool.spawn();
    if (!p) break;
    const a = (i / 16) * Math.PI * 2;
    const sp = 60 + Math.random() * 80;
    resetParticle(p, x, y, Math.cos(a) * sp, Math.sin(a) * sp, '#ffcc66', 0.4 + Math.random() * 0.3, 2 + Math.random() * 2, 'dot');
  }
}

export function explode(particlePool, x, y, color) {
  explodeSmall(particlePool, x, y, color || '#ffcc66');
}
