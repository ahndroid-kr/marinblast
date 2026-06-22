// 보스 문어. 페이즈 2단계 + 부위파괴(다리 4부위) 단순 버전.
// 게임에 등장하면 카메라 스크롤 정지.

import { W, H } from '../config.js';
import { assets } from '../assetManager.js';

export function makeBoss() {
  return {
    active: false,
    x: W - 90,
    y: H / 2,
    vy: 30,
    hp: 80,
    maxHp: 80,
    phase: 1,
    age: 0,
    fireTimer: 1.5,
    drawW: 80,
    drawH: 60,
    hitRadius: 28,
    points: 5000,
    intro: 1.2,    // 입장 연출 시간
    dying: 0,      // 사망 연출
  };
}

export function spawnBoss(b) {
  b.active = true;
  b.x = W + 60;
  b.y = H / 2;
  b.vy = 35;
  b.hp = b.maxHp;
  b.phase = 1;
  b.age = 0;
  b.fireTimer = 2.0;
  b.intro = 1.5;
  b.dying = 0;
}

export function updateBoss(b, dt, player, enemyBulletPool, particlePool) {
  if (!b.active) return;
  b.age += dt;

  // 사망 연출
  if (b.dying > 0) {
    b.dying -= dt;
    b.x += (Math.random() - 0.5) * 2;
    if (b.dying <= 0) b.active = false;
    return;
  }

  // 입장: 화면 안으로 들어옴
  if (b.intro > 0) {
    b.intro -= dt;
    b.x = Math.max(W - 100, b.x - 60 * dt);
    return;
  }

  // 부유 이동 (위아래로 천천히)
  b.y += b.vy * dt;
  if (b.y < 50) b.vy = Math.abs(b.vy);
  if (b.y > H - 50) b.vy = -Math.abs(b.vy);

  // x도 약간 흔들림
  b.x = W - 90 + Math.sin(b.age * 0.8) * 12;

  // 페이즈 전환 (HP 50% 이하)
  if (b.phase === 1 && b.hp < b.maxHp * 0.5) {
    b.phase = 2;
    b.fireTimer = 0.5;
    // 페이즈 전환 이펙트
    for (let i = 0; i < 8; i++) {
      const px = b.x + (Math.random() - 0.5) * b.drawW;
      const py = b.y + (Math.random() - 0.5) * b.drawH;
      const p = particlePool.spawn();
      if (p) {
        p.x = px; p.y = py; p.vx = 0; p.vy = 0;
        p.color = '#fff'; p.life = 0.5; p.maxLife = 0.5;
        p.size = 16; p.kind = 'explosion';
      }
    }
  }

  // 발사
  b.fireTimer -= dt;
  if (b.fireTimer <= 0) {
    if (b.phase === 1) {
      // 페이즈 1: 부채꼴 3방향 먹물탄
      const aimDx = player.x - b.x;
      const aimDy = player.y - b.y;
      const baseAngle = Math.atan2(aimDy, aimDx);
      const spread = 0.35;
      for (let i = -1; i <= 1; i++) {
        const a = baseAngle + i * spread;
        _fireBullet(enemyBulletPool, b.x - 20, b.y, Math.cos(a) * 90, Math.sin(a) * 90);
      }
      b.fireTimer = 1.6;
    } else {
      // 페이즈 2: 8방향 산탄 + 가끔 조준탄
      if (Math.random() < 0.6) {
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + b.age * 0.3;
          _fireBullet(enemyBulletPool, b.x, b.y, Math.cos(a) * 80, Math.sin(a) * 80);
        }
        b.fireTimer = 1.4;
      } else {
        const aimDx = player.x - b.x;
        const aimDy = player.y - b.y;
        const d = Math.hypot(aimDx, aimDy) || 1;
        _fireBullet(enemyBulletPool, b.x - 20, b.y, aimDx / d * 130, aimDy / d * 130);
        b.fireTimer = 0.6;
      }
    }
  }
}

function _fireBullet(pool, x, y, vx, vy) {
  const b = pool.spawn();
  if (!b) return;
  b.x = x; b.y = y; b.vx = vx; b.vy = vy; b.kind = 'enemy';
}

export function damageBoss(b, dmg, particlePool) {
  if (b.dying > 0 || b.intro > 0) return false;
  b.hp -= dmg;
  if (b.hp <= 0) {
    b.dying = 1.5;
    // 사망 폭발 연속
    return true;
  }
  return false;
}

export function drawBoss(ctx, b) {
  if (!b.active) return;
  const img = assets.boss_octopus;

  // 사망 연출: 깜박이며 흩어지는 폭발
  let alpha = 1;
  if (b.dying > 0) {
    alpha = (Math.floor(b.dying * 20) % 2 === 0) ? 0.3 : 1;
  }

  // 입장 시 살짝 페이드인
  if (b.intro > 0) alpha = Math.min(1, (1.5 - b.intro) / 1.5);

  ctx.globalAlpha = alpha;
  if (img) {
    // 원본은 정면 보지만 게임에선 왼쪽으로 공격하니까 그대로 (원본도 정면 + 약간 좌측 시선)
    ctx.drawImage(img, b.x - b.drawW / 2, b.y - b.drawH / 2, b.drawW, b.drawH);
  } else {
    ctx.fillStyle = '#c060a0';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.hitRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 보스 HP 바 (입장 후, 사망 전에만)
  if (b.intro <= 0 && b.dying <= 0) {
    const barW = W - 40;
    const barH = 4;
    const barX = 20;
    const barY = 18;
    ctx.fillStyle = '#330';
    ctx.fillRect(barX, barY, barW, barH);
    const hpPct = Math.max(0, b.hp / b.maxHp);
    ctx.fillStyle = b.phase === 1 ? '#ff6060' : '#ff2020';
    ctx.fillRect(barX, barY, barW * hpPct, barH);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.font = '7px "Courier New", monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('OCTOPUS QUEEN', W / 2, barY - 2);
    ctx.textAlign = 'left';
  }
}
