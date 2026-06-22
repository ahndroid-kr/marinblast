export function makeParticle() {
  return {
    active: false,
    x: 0, y: 0, vx: 0, vy: 0,
    life: 0, maxLife: 0.5,
    color: '#fff', size: 2,
  };
}

export function resetParticle(p, x, y, vx, vy, color, life, size) {
  p.x = x; p.y = y; p.vx = vx; p.vy = vy;
  p.color = color; p.life = life; p.maxLife = life;
  p.size = size;
}

export function updateParticle(p, dt) {
  p.life -= dt;
  if (p.life <= 0) { p.active = false; return; }
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.vx *= 0.95;
  p.vy *= 0.95;
}

export function drawParticle(ctx, p) {
  const a = p.life / p.maxLife;
  ctx.globalAlpha = a;
  ctx.fillStyle = p.color;
  ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  ctx.globalAlpha = 1;
}

// 폭발 - particle pool에서 여러 개 발생
export function explode(particlePool, x, y, color, count = 8) {
  for (let i = 0; i < count; i++) {
    const p = particlePool.spawn();
    if (!p) break;
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const sp = 30 + Math.random() * 60;
    resetParticle(p, x, y, Math.cos(a) * sp, Math.sin(a) * sp, color, 0.3 + Math.random() * 0.2, 1 + Math.random() * 2);
  }
}
