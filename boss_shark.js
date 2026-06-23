// 스테이지 3 잡몹: 돌돔(stripedbeakfish) / 바라쿠다(barracuda) / 복어(pufferfish)
// 복어는 피격 시 부풀어 산탄 발사하는 독특한 메카닉
import { W, H } from '../config.js';
import { assets } from '../assetManager.js';

export const ENEMY3_PRESETS = {
  stripedbeakfish: {
    hp: 3, spawnVx: -70, radius: 10, fireInterval: 2.0,
    points: 300, dropChance: 0.3,
    drawW: 40, drawH: 29,
  },
  barracuda: {
    hp: 2, spawnVx: -200, radius: 9, fireInterval: 999,
    points: 250, dropChance: 0.2,
    drawW: 54, drawH: 20,
  },
  pufferfish: {
    hp: 2, spawnVx: -45, radius: 8, fireInterval: 999,
    points: 200, dropChance: 0.35,
    drawW: 32, drawH: 23,
  },
};

export function makeEnemy3() {
  return {
    active: false, kind: 'stripedbeakfish',
    x: 0, y: 0, vx: 0, vy: 0,
    hp: 1, maxHp: 1,
    age: 0, spawnY: 0, spawnVx: -60,
    radius: 8, fireTimer: 0, fireInterval: 999,
    points: 100, dropChance: 0,
    drawW: 40, drawH: 30,
    // 복어 전용
    inflated: false,
    inflateTimer: 0,
  };
}

export function resetEnemy3(e, kind, x, y) {
  const p = ENEMY3_PRESETS[kind];
  e.kind = kind;
  e.x = x; e.y = y;
  e.vx = p.spawnVx; e.vy = 0;
  e.hp = p.hp; e.maxHp = p.hp;
  e.radius = p.radius;
  e.age = 0; e.spawnY = y;
  e.spawnVx = p.spawnVx;
  e.fireTimer = p.fireInterval * 0.6;
  e.fireInterval = p.fireInterval;
  e.points = p.points;
  e.dropChance = p.dropChance;
  e.drawW = p.drawW; e.drawH = p.drawH;
  e.inflated = false;
  e.inflateTimer = 0;
}

export function updateEnemy3(e, dt, player, enemyBulletPool) {
  e.age += dt;

  switch (e.kind) {
    case 'stripedbeakfish': _updateBeakfish(e, dt, player, enemyBulletPool); break;
    case 'barracuda':       _updateBarracuda(e, dt); break;
    case 'pufferfish':      _updatePuffer(e, dt); break;
  }

  if (e.x < -70 || e.y < -70 || e.y > H + 70) e.active = false;
}

function _updateBeakfish(e, dt, player, pool) {
  // 지그재그 이동 + 조준탄
  e.x += e.spawnVx * dt;
  e.y = e.spawnY + Math.sin(e.age * 2.5) * 22;
  e.fireTimer -= dt;
  if (e.fireTimer <= 0 && player.alive && e.x < W - 20) {
    e.fireTimer = e.fireInterval;
    const dx = player.x - e.x, dy = player.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    const b = pool.spawn();
    if (b) { b.x = e.x; b.y = e.y; b.vx = dx/d*100; b.vy = dy/d*100; b.kind = 'enemy'; }
  }
}

function _updateBarracuda(e, dt) {
  // 극도로 빠른 직선 돌진
  e.x += e.spawnVx * dt;
  // 약간의 y 흔들림
  e.y = e.spawnY + Math.sin(e.age * 5) * 5;
}

function _updatePuffer(e, dt) {
  e.x += e.spawnVx * dt;
  if (e.inflated) {
    // 부풀면 느려지고 히트박스 커짐
    e.x += (e.spawnVx * 0.3 - e.spawnVx) * dt; // 속도 30%로
    e.inflateTimer -= dt;
    if (e.inflateTimer <= 0) {
      // 부풀기 종료 → 수축
      e.inflated = false;
      e.drawW = ENEMY3_PRESETS.pufferfish.drawW;
      e.drawH = ENEMY3_PRESETS.pufferfish.drawH;
      e.radius = ENEMY3_PRESETS.pufferfish.radius;
      e.vx = e.spawnVx;
    }
  } else {
    e.y = e.spawnY + Math.sin(e.age * 1.2) * 12;
  }
}

// 복어 피격 시 외부에서 호출
export function inflatePuffer(e, pool) {
  if (e.inflated) return; // 이미 부풀어 있으면 무시
  e.inflated = true;
  e.inflateTimer = 2.5;
  e.drawW = ENEMY3_PRESETS.pufferfish.drawW * 1.6;
  e.drawH = ENEMY3_PRESETS.pufferfish.drawH * 1.6;
  e.radius = ENEMY3_PRESETS.pufferfish.radius * 2;
  e.vx = e.spawnVx * 0.3;

  // 8방향 가시 산탄
  for (let i = 0; i < 8; i++) {
    const b = pool.spawn();
    if (!b) continue;
    const a = (i / 8) * Math.PI * 2;
    b.x = e.x; b.y = e.y;
    b.vx = Math.cos(a) * 85; b.vy = Math.sin(a) * 85;
    b.kind = 'enemy';
  }
}

export function drawEnemy3(ctx, e) {
  let key = `enemy_${e.kind}`;
  if (e.kind === 'pufferfish' && e.inflated) key = 'enemy_pufferfish_angry';
  const img = assets[key];
  if (img) {
    ctx.drawImage(img, e.x - e.drawW/2, e.y - e.drawH/2, e.drawW, e.drawH);
  } else {
    ctx.fillStyle = '#c8d840';
    ctx.fillRect(e.x - e.drawW/2, e.y - e.drawH/2, e.drawW, e.drawH);
  }
}
