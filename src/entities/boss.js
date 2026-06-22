// 보스 문어. HP 증가, 크기 키움, 페이즈 2단계.
import { W, H } from '../config.js';
import { assets } from '../assetManager.js';

export function makeBoss() {
  return {
    active: false,
    x: W - 130, y: H / 2,
    vy: 25,
    hp: 250, maxHp: 250,
    phase: 1,
    age: 0,
    fireTimer: 1.5,
    drawW: 220, drawH: 158,
    hitRadius: 70,
    points: 8000,
    intro: 1.5,
    dying: 0,
  };
}

export function spawnBoss(b) {
  b.active = true;
  b.x = W + 120;
  b.y = H / 2;
  b.vy = 28;
  b.hp = b.maxHp;
  b.phase = 1;
  b.age = 0;
  b.fireTimer = 2.0;
  b.intro = 1.8;
  b.dying = 0;
}

export function updateBoss(b, dt, player, enemyBulletPool, particlePool) {
  if (!b.active) return;
  b.age += dt;

  if (b.dying > 0) {
    b.dying -= dt;
    b.x += (Math.random() - 0.5) * 3;
    // 사망 중 연속 폭발
    if (Math.random() < 0.4) {
      const px = b.x + (Math.random() - 0.5) * b.drawW * 0.8;
      const py = b.y + (Math.random() - 0.5) * b.drawH * 0.8;
      const p = particlePool.spawn();
      if (p) {
        p.x = px; p.y = py; p.vx = 0; p.vy = 0;
        p.color = '#fff'; p.life = 0.4; p.maxLife = 0.4;
        p.size = 30; p.kind = 'explosion';
      }
    }
    if (b.dying <= 0) b.active = false;
    return;
  }

  if (b.intro > 0) {
    b.intro -= dt;
    b.x = Math.max(W - 150, b.x - 50 * dt);
    return;
  }

  // 위아래 부유
  b.y += b.vy * dt;
  if (b.y < 90) b.vy = Math.abs(b.vy);
  if (b.y > H - 90) b.vy = -Math.abs(b.vy);

  // x 흔들림
  b.x = W - 130 + Math.sin(b.age * 0.8) * 20;

  // 페이즈 전환
  if (b.phase === 1 && b.hp < b.maxHp * 0.5) {
    b.phase = 2;
    b.fireTimer = 0.5;
    for (let i = 0; i < 10; i++) {
      const px = b.x + (Math.random() - 0.5) * b.drawW;
      const py = b.y + (Math.random() - 0.5) * b.drawH;
      const p = particlePool.spawn();
      if (p) {
        p.x = px; p.y = py; p.vx = 0; p.vy = 0;
        p.color = '#fff'; p.life = 0.5; p.maxLife = 0.5;
        p.size = 22; p.kind = 'explosion';
      }
    }
  }

  // 발사
  b.fireTimer -= dt;
  if (b.fireTimer <= 0) {
    if (b.phase === 1) {
      // 페이즈 1: 5방향 부채꼴
      const aimDx = player.x - b.x;
      const aimDy = player.y - b.y;
      const baseAngle = Math.atan2(aimDy, aimDx);
      const spread = 0.3;
      for (let i = -2; i <= 2; i++) {
        const a = baseAngle + i * spread;
        _fireBullet(enemyBulletPool, b.x - 30, b.y, Math.cos(a) * 100, Math.sin(a) * 100);
      }
      b.fireTimer = 1.5;
    } else {
      // 페이즈 2: 12방향 원형 + 가끔 빠른 조준탄
      if (Math.random() < 0.6) {
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 + b.age * 0.3;
          _fireBullet(enemyBulletPool, b.x, b.y, Math.cos(a) * 85, Math.sin(a) * 85);
        }
        b.fireTimer = 1.3;
      } else {
        const aimDx = player.x - b.x;
        const aimDy = player.y - b.y;
        const d = Math.hypot(aimDx, aimDy) || 1;
        _fireBullet(enemyBulletPool, b.x - 30, b.y, aimDx / d * 140, aimDy / d * 140);
        b.fireTimer = 0.5;
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
    b.dying = 3.5; // 더 긴 사망 연출
    return true;
  }
  return false;
}

export function drawBoss(ctx, b) {
  if (!b.active) return;
  const img = (b.dying > 0) ? assets.boss_octopus_dead : assets.boss_octopus;
  let alpha = 1;
  if (b.dying > 0) {
    // 앞 2초: 깜박임, 마지막 1.5초: 페이드아웃
    if (b.dying > 1.5) {
      alpha = (Math.floor(b.dying * 12) % 2 === 0) ? 0.3 : 1;
    } else {
      alpha = b.dying / 1.5;
    }
  }
  if (b.intro > 0) alpha = Math.min(1, (1.8 - b.intro) / 1.8);

  ctx.globalAlpha = alpha;
  if (img) {
    ctx.drawImage(img, b.x - b.drawW / 2, b.y - b.drawH / 2, b.drawW, b.drawH);
  } else {
    ctx.fillStyle = '#c060a0';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.hitRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // HP 바
  if (b.intro <= 0 && b.dying <= 0) {
    const barW = W - 40;
    const barH = 5;
    const barX = 20;
    const barY = 20;
    ctx.fillStyle = '#330';
    ctx.fillRect(barX, barY, barW, barH);
    const hpPct = Math.max(0, b.hp / b.maxHp);
    ctx.fillStyle = b.phase === 1 ? '#ff6060' : '#ff2020';
    ctx.fillRect(barX, barY, barW * hpPct, barH);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.font = 'bold 8px "Courier New", monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('OCTOPUS QUEEN', W / 2, barY - 3);
    ctx.textAlign = 'left';
  }
}
