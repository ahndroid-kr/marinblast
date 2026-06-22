import { assets } from '../assetManager.js';

// effects.png에서 사용할 폭발 프레임 (sx, sy, sw, sh) — 큰 폭발 3프레임
// 원본 이미지 분석 기반 추정 좌표
const EXPLOSION_FRAMES = [
  { sx: 167, sy: 28, sw: 50, sh: 56 },  // 큰 폭발
  { sx: 217, sy: 28, sw: 50, sh: 56 },  // 흩어지는 중
  { sx: 267, sy: 38, sw: 40, sh: 36 },  // 잔해
];
const SPARKLE_FRAMES = [
  { sx: 130, sy: 168, sw: 24, sh: 28 },
  { sx: 160, sy: 165, sw: 28, sh: 30 },
  { sx: 195, sy: 170, sw: 22, sh: 24 },
];

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
    const img = assets.effects;
    if (img) {
      const frameIdx = Math.min(EXPLOSION_FRAMES.length - 1, Math.floor((1 - a) * EXPLOSION_FRAMES.length));
      const f = EXPLOSION_FRAMES[frameIdx];
      const size = p.size * 2;
      ctx.globalAlpha = Math.min(1, a * 2);
      ctx.drawImage(img, f.sx, f.sy, f.sw, f.sh, p.x - size / 2, p.y - size / 2, size, size);
      ctx.globalAlpha = 1;
      return;
    }
  }
  if (p.kind === 'sparkle') {
    const img = assets.effects;
    if (img) {
      const frameIdx = Math.floor((p.maxLife - p.life) * 12) % SPARKLE_FRAMES.length;
      const f = SPARKLE_FRAMES[frameIdx];
      const size = p.size * 1.5;
      ctx.globalAlpha = a;
      ctx.drawImage(img, f.sx, f.sy, f.sw, f.sh, p.x - size / 2, p.y - size / 2, size, size);
      ctx.globalAlpha = 1;
      return;
    }
  }
  // dot fallback
  ctx.globalAlpha = a;
  ctx.fillStyle = p.color;
  ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  ctx.globalAlpha = 1;
}

// 작은 폭발 (적 사망용)
export function explodeSmall(particlePool, x, y, color = '#ffcc66') {
  // 메인 폭발 1개 + 작은 점들 6개
  const big = particlePool.spawn();
  if (big) resetParticle(big, x, y, 0, 0, '#fff', 0.4, 18, 'explosion');
  for (let i = 0; i < 6; i++) {
    const p = particlePool.spawn();
    if (!p) break;
    const a = (i / 6) * Math.PI * 2 + Math.random() * 0.5;
    const sp = 40 + Math.random() * 50;
    resetParticle(p, x, y, Math.cos(a) * sp, Math.sin(a) * sp, color, 0.3 + Math.random() * 0.2, 1.5 + Math.random() * 1.5, 'dot');
  }
}

// 큰 폭발 (보스 페이즈/사망용)
export function explodeBig(particlePool, x, y) {
  for (let i = 0; i < 4; i++) {
    const p = particlePool.spawn();
    if (!p) break;
    const ox = (Math.random() - 0.5) * 30;
    const oy = (Math.random() - 0.5) * 30;
    resetParticle(p, x + ox, y + oy, 0, 0, '#fff', 0.5 + Math.random() * 0.3, 24 + Math.random() * 10, 'explosion');
  }
  for (let i = 0; i < 14; i++) {
    const p = particlePool.spawn();
    if (!p) break;
    const a = (i / 14) * Math.PI * 2;
    const sp = 60 + Math.random() * 80;
    resetParticle(p, x, y, Math.cos(a) * sp, Math.sin(a) * sp, '#ffcc66', 0.4 + Math.random() * 0.3, 2 + Math.random() * 2, 'dot');
  }
}

// 호환성용 (기존 호출)
export function explode(particlePool, x, y, color, count = 8) {
  explodeSmall(particlePool, x, y, color || '#ffcc66');
}
