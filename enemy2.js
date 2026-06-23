// 스테이지 4: 거미게(spidercrab) / 초롱아귀(anglerfish) / 메로(toothfish)
import { W, H } from '../config.js';
import { assets } from '../assetManager.js';

export const ENEMY4_PRESETS = {
  // 거미게 — 바닥 근처에서 기어다님, 가까이 오면 집게 산탄
  spidercrab: {
    hp: 3, spawnVx: -40, radius: 12, fireInterval: 2.5,
    points: 300, dropChance: 0.3,
    drawW: 48, drawH: 32,
  },
  // 초롱아귀 — 느리게 이동, 루어로 유인 후 넓은 범위 탄막
  anglerfish: {
    hp: 4, spawnVx: -38, radius: 14, fireInterval: 2.8,
    points: 350, dropChance: 0.35,
    drawW: 48, drawH: 38,
  },
  // 메로 — 빠른 직선 돌진, 체력 높음
  toothfish: {
    hp: 4, spawnVx: -130, radius: 16, fireInterval: 999,
    points: 280, dropChance: 0.25,
    drawW: 60, drawH: 47,
  },
};

export function makeEnemy4() {
  return {
    active: false, kind: 'toothfish',
    x: 0, y: 0, vx: 0, vy: 0,
    hp: 1, maxHp: 1,
    age: 0, spawnY: 0, spawnVx: -60,
    radius: 10, fireTimer: 0, fireInterval: 999,
    points: 100, dropChance: 0,
    drawW: 40, drawH: 28,
    // 초롱아귀 전용
    lurePulse: 0,
    // 거미게 전용
    rushTimer: 0,
  };
}

export function resetEnemy4(e, kind, x, y) {
  const p = ENEMY4_PRESETS[kind];
  e.kind = kind;
  e.x = x; e.y = y;
  e.vx = p.spawnVx; e.vy = 0;
  e.hp = p.hp; e.maxHp = p.hp;
  e.radius = p.radius;
  e.age = 0; e.spawnY = y;
  e.spawnVx = p.spawnVx;
  e.fireTimer = p.fireInterval * 0.5;
  e.fireInterval = p.fireInterval;
  e.points = p.points;
  e.dropChance = p.dropChance;
  e.drawW = p.drawW; e.drawH = p.drawH;
  e.lurePulse = 0;
  e.rushTimer = 1.5 + Math.random() * 1.5;
}

export function updateEnemy4(e, dt, player, pool) {
  e.age += dt;
  switch (e.kind) {
    case 'spidercrab': _updateCrab(e, dt, player, pool); break;
    case 'anglerfish': _updateAngler(e, dt, player, pool); break;
    case 'toothfish':  _updateToothfish(e, dt); break;
  }
  if (e.x < -70 || e.y < -70 || e.y > H + 70) e.active = false;
}

function _updateCrab(e, dt, player, pool) {
  // 바닥 근처에서 느리게 기어다님, 상하 진동
  e.x += e.spawnVx * dt;
  e.y = e.spawnY + Math.sin(e.age * 1.8) * 18;
  e.fireTimer -= dt;
  if (e.fireTimer <= 0 && player.alive && e.x < W - 20) {
    e.fireTimer = e.fireInterval;
    // 집게 산탄 — 3방향
    const dx = player.x - e.x, dy = player.y - e.y;
    const base = Math.atan2(dy, dx);
    for (let i = -1; i <= 1; i++) {
      const b = pool.spawn();
      if (!b) continue;
      const a = base + i * 0.4;
      b.x = e.x; b.y = e.y;
      b.vx = Math.cos(a) * 95; b.vy = Math.sin(a) * 95;
      b.kind = 'enemy';
    }
  }
}

function _updateAngler(e, dt, player, pool) {
  e.x += e.spawnVx * dt;
  e.y = e.spawnY + Math.sin(e.age * 1.0) * 22;
  e.lurePulse += dt;
  e.fireTimer -= dt;
  if (e.fireTimer <= 0 && player.alive && e.x < W - 20) {
    e.fireTimer = e.fireInterval;
    // 넓은 5방향 탄막
    const dx = player.x - e.x, dy = player.y - e.y;
    const base = Math.atan2(dy, dx);
    for (let i = -2; i <= 2; i++) {
      const b = pool.spawn();
      if (!b) continue;
      const a = base + i * 0.32;
      b.x = e.x; b.y = e.y;
      b.vx = Math.cos(a) * 88; b.vy = Math.sin(a) * 88;
      b.kind = 'enemy';
    }
  }
}

function _updateToothfish(e, dt) {
  // 빠른 직선 + 사인 물결
  e.x += e.spawnVx * dt;
  e.y = e.spawnY + Math.sin(e.age * 2.2) * 10;
}

export function drawEnemy4(ctx, e) {
  const key = `enemy_${e.kind}`;
  const img = assets[key];

  if (img) {
    ctx.drawImage(img, e.x - e.drawW/2, e.y - e.drawH/2, e.drawW, e.drawH);
  } else {
    // 폴백 도형
    const colors = { spidercrab: '#8b3a1a', anglerfish: '#1a1a4a', toothfish: '#3a4a5a' };
    ctx.fillStyle = colors[e.kind] || '#555';
    ctx.fillRect(e.x - e.drawW/2, e.y - e.drawH/2, e.drawW, e.drawH);
  }

  // 초롱아귀 루어 글로우 (이미지 위에 코드로 추가)
  if (e.kind === 'anglerfish') {
    const pulse = 0.5 + Math.sin(e.lurePulse * 3) * 0.5;
    const lx = e.x + e.drawW * 0.15;
    const ly = e.y - e.drawH * 0.55;
    ctx.globalAlpha = 0.7 * pulse;
    const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, 8);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#40ffcc');
    grad.addColorStop(1, 'rgba(64,255,200,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(lx, ly, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
