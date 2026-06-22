import { W, H } from '../config.js';
import { assets } from '../assetManager.js';

export function makeEnemy() {
  return {
    active: false, kind: 'anchovy',
    x: 0, y: 0, vx: 0, vy: 0,
    hp: 1, age: 0, spawnY: 0, spawnVx: -60,
    radius: 5, fireTimer: 0, fireInterval: 999,
    points: 100, dropChance: 0,
    drawW: 16, drawH: 8,
  };
}

// 멸치 < 옵션≒불가사리 < 새우≒고등어≒잠수함(78x52) < 보스
export const ENEMY_PRESETS = {
  anchovy: {
    hp: 1, spawnVx: -100, radius: 7, fireInterval: 999,
    points: 100, dropChance: 0.1,
    drawW: 30, drawH: 9.6,
  },
  shrimp: {
    hp: 2, spawnVx: -55, radius: 5, fireInterval: 2.0,
    points: 200, dropChance: 0.25,
    drawW: 28, drawH: 24,
  },
  mackerel: {
    hp: 3, spawnVx: -140, radius: 22, fireInterval: 3.0,
    points: 300, dropChance: 0.35,
    drawW: 40, drawH: 21,
  },
};

export function resetEnemy(e, kind, x, y) {
  const p = ENEMY_PRESETS[kind] || ENEMY_PRESETS.anchovy;
  e.kind = kind;
  e.x = x; e.y = y;
  e.vx = p.spawnVx; e.vy = 0;
  e.hp = p.hp;
  e.radius = p.radius;
  e.age = 0;
  e.spawnY = y;
  e.spawnVx = p.spawnVx;
  e.fireTimer = p.fireInterval;
  e.fireInterval = p.fireInterval;
  e.points = p.points;
  e.dropChance = p.dropChance;
  e.drawW = p.drawW;
  e.drawH = p.drawH;
}

export function updateEnemy(e, dt, player, enemyBulletPool) {
  e.age += dt;
  switch (e.kind) {
    case 'anchovy':
      e.x += e.spawnVx * dt;
      e.y = e.spawnY + Math.sin(e.age * 4) * 16;
      break;
    case 'shrimp':
      e.x += e.spawnVx * dt;
      e.y = e.spawnY + Math.sin(e.age * 1.5) * 32;
      e.fireTimer -= dt;
      if (e.fireTimer <= 0 && e.x < W - 30) {
        e.fireTimer = e.fireInterval;
        _fireAimed(e, player, enemyBulletPool, 110);
      }
      break;
    case 'mackerel':
      e.x += e.spawnVx * dt;
      e.fireTimer -= dt;
      if (e.fireTimer <= 0 && e.x < W - 40 && e.x > 40) {
        e.fireTimer = e.fireInterval;
        _fireAimed(e, player, enemyBulletPool, 120);
      }
      break;
  }
  if (e.x < -50 || e.y < -50 || e.y > H + 50) e.active = false;
}

function _fireAimed(e, player, pool, speed) {
  if (!player.alive) return;
  const b = pool.spawn();
  if (!b) return;
  const dx = player.x - e.x;
  const dy = player.y - e.y;
  const d = Math.hypot(dx, dy) || 1;
  b.x = e.x; b.y = e.y;
  b.vx = (dx / d) * speed;
  b.vy = (dy / d) * speed;
  b.kind = 'enemy';
}

export function drawEnemy(ctx, e) {
  const img = assets[`enemy_${e.kind}`];
  if (img) {
    ctx.drawImage(img, e.x - e.drawW / 2, e.y - e.drawH / 2, e.drawW, e.drawH);
  } else {
    ctx.fillStyle = '#88aacc';
    ctx.fillRect(e.x - e.drawW/2, e.y - e.drawH/2, e.drawW, e.drawH);
  }
}
