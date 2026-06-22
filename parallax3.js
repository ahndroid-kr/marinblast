// 스테이지 2 잡몹: 왕우럭조개(mirugai) / 광어(hirame) / 방어(buri)
import { W, H } from '../config.js';
import { assets } from '../assetManager.js';

export const ENEMY2_PRESETS = {
  // 왕우럭조개 — 천천히 이동, 입 열릴 때만 피격 가능, 진주탄 발사
  mirugai: {
    hp: 4, spawnVx: -28, radius: 10, fireInterval: 2.2,
    points: 250, dropChance: 0.3,
    drawW: 36, drawH: 25,
    openTimer: 0, openDuration: 1.4, closeWait: 2.0, isOpen: false,
  },
  // 광어 — 바닥 근처에서 느리게 이동, 가끔 위로 급상승
  hirame: {
    hp: 5, spawnVx: -35, radius: 14, fireInterval: 3.5,
    points: 300, dropChance: 0.3,
    drawW: 51, drawH: 40,
  },
  // 방어 — 가장 빠름, 돌진형, 발사 없음
  buri: {
    hp: 2, spawnVx: -160, radius: 12, fireInterval: 999,
    points: 200, dropChance: 0.2,
    drawW: 56, drawH: 42,
  },
};

export function makeEnemy2() {
  return {
    active: false, kind: 'buri',
    x: 0, y: 0, vx: 0, vy: 0,
    hp: 1, maxHp: 1,
    age: 0, spawnY: 0, spawnVx: -60,
    radius: 5, fireTimer: 0, fireInterval: 999,
    points: 100, dropChance: 0,
    drawW: 40, drawH: 30,
    // 조개 전용
    openTimer: 0, openDuration: 1.4, closeWait: 2.0, isOpen: false,
    invuln: false, // 조개 닫힘 = 무적
    // 광어 전용
    rushTimer: 0, isRushing: false,
  };
}

export function resetEnemy2(e, kind, x, y) {
  const p = ENEMY2_PRESETS[kind];
  e.kind = kind;
  e.x = x; e.y = y;
  e.vx = p.spawnVx; e.vy = 0;
  e.hp = p.hp; e.maxHp = p.hp;
  e.radius = p.radius;
  e.age = 0; e.spawnY = y;
  e.spawnVx = p.spawnVx;
  e.fireTimer = p.fireInterval * 0.5; // 첫 발사까지 절반 대기
  e.fireInterval = p.fireInterval;
  e.points = p.points;
  e.dropChance = p.dropChance;
  e.drawW = p.drawW; e.drawH = p.drawH;
  // 조개
  e.openTimer = p.closeWait || 2.0;
  e.openDuration = p.openDuration || 1.4;
  e.closeWait = p.closeWait || 2.0;
  e.isOpen = false;
  e.invuln = kind === 'mirugai'; // 조개는 기본 무적
  // 광어
  e.rushTimer = 2.0 + Math.random() * 2.0;
  e.isRushing = false;
}

export function updateEnemy2(e, dt, player, enemyBulletPool) {
  e.age += dt;

  switch (e.kind) {
    case 'mirugai': _updateMirugai(e, dt, player, enemyBulletPool); break;
    case 'hirame':  _updateHirame(e, dt, player, enemyBulletPool); break;
    case 'buri':    _updateBuri(e, dt); break;
  }

  if (e.x < -60 || e.y < -60 || e.y > H + 60) e.active = false;
}

function _updateMirugai(e, dt, player, pool) {
  // 천천히 좌측 이동
  e.x += e.spawnVx * dt;

  // 입 열기/닫기 사이클
  e.openTimer -= dt;
  if (e.openTimer <= 0) {
    e.isOpen = !e.isOpen;
    e.invuln = !e.isOpen; // 열려 있을 때만 피격 가능
    e.openTimer = e.isOpen ? e.openDuration : e.closeWait;
    // 입 열었을 때 진주탄 발사
    if (e.isOpen && player.alive) {
      // 3방향 扇형
      const dx = player.x - e.x, dy = player.y - e.y;
      const base = Math.atan2(dy, dx);
      for (let i = -1; i <= 1; i++) {
        const b = pool.spawn();
        if (!b) continue;
        const a = base + i * 0.35;
        b.x = e.x; b.y = e.y;
        b.vx = Math.cos(a) * 90; b.vy = Math.sin(a) * 90;
        b.kind = 'enemy';
      }
    }
  }
}

function _updateHirame(e, dt, player, pool) {
  if (e.isRushing) {
    // 급상승 중
    e.vy -= 300 * dt;
    e.y += e.vy * dt;
    e.x += e.spawnVx * 0.3 * dt;
    if (e.vy < -200 || e.y < 30) {
      // 상승 후 다시 내려감
      e.vy = 60;
      e.isRushing = false;
      e.rushTimer = 2.5 + Math.random() * 2.0;
    }
  } else {
    // 바닥 근처에서 느리게 이동
    e.x += e.spawnVx * dt;
    e.y = e.spawnY + Math.sin(e.age * 0.8) * 10;
    e.rushTimer -= dt;
    if (e.rushTimer <= 0) {
      e.isRushing = true;
      e.vy = 0;
    }
    // 가끔 발사
    e.fireTimer -= dt;
    if (e.fireTimer <= 0 && player.alive) {
      e.fireTimer = e.fireInterval;
      const b = pool.spawn();
      if (b) {
        const dx = player.x - e.x, dy = player.y - e.y;
        const d = Math.hypot(dx, dy) || 1;
        b.x = e.x; b.y = e.y;
        b.vx = dx/d * 95; b.vy = dy/d * 95;
        b.kind = 'enemy';
      }
    }
  }
}

function _updateBuri(e, dt) {
  // 빠른 직선 돌진, 상하 약간 사인
  e.x += e.spawnVx * dt;
  e.y = e.spawnY + Math.sin(e.age * 2.5) * 8;
}

export function canDamageEnemy2(e) {
  // 조개는 열려있을 때만 데미지 가능
  if (e.kind === 'mirugai') return e.isOpen;
  return true;
}

export function drawEnemy2(ctx, e) {
  const img = assets[`enemy_${e.kind}`];
  if (img) {
    // 조개 닫힘 = 약간 어둡게 (무적 표시)
    if (e.kind === 'mirugai' && !e.isOpen) {
      ctx.globalAlpha = 0.7;
    }
    ctx.drawImage(img, e.x - e.drawW/2, e.y - e.drawH/2, e.drawW, e.drawH);
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = e.kind === 'buri' ? '#6080ff' : e.kind === 'hirame' ? '#c0a060' : '#8090a0';
    ctx.fillRect(e.x - e.drawW/2, e.y - e.drawH/2, e.drawW, e.drawH);
  }
}
