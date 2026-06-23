// 보스 범고래. 패턴:
// 페이즈 1: 조준탄 + 소나파(가로 충격파)
// 페이즈 2: 돌진 + 소나파 동시 + 작은 물고기 소환
import { W, H } from '../config.js';
import { assets } from '../assetManager.js';

export function makeBossOrca() {
  return {
    active: false,
    x: W + 120, y: H / 2,
    vx: 0, vy: 22,
    hp: 400, maxHp: 400,
    phase: 1,
    age: 0,
    fireTimer: 2.0,
    sonarTimer: 4.0,   // 소나파 타이머
    sonarActive: 0,    // 소나파 지속 시간
    sonarY: 0,
    sonarW: 0,         // 현재 소나파 폭 (확장)
    dashTimer: 5.0,
    isDashing: false,
    spawnTimer: 7.0,
    drawW: 190, drawH: 100,
    hitRadius: 65,
    points: 15000,
    intro: 2.2,
    dying: 0,
  };
}

export function spawnBossOrca(b) {
  b.active = true;
  b.x = W + 200; b.y = H / 2;
  b.vx = 0; b.vy = 22;
  b.hp = b.maxHp;
  b.phase = 1;
  b.age = 0;
  b.fireTimer = 2.0;
  b.sonarTimer = 4.0;
  b.sonarActive = 0;
  b.dashTimer = 6.0;
  b.isDashing = false;
  b.spawnTimer = 8.0;
  b.intro = 3.2;
  b.dying = 0;
}

export function updateBossOrca(b, dt, player, pool, particles) {
  if (!b.active) return;
  b.age += dt;

  if (b.dying > 0) {
    b.dying -= dt;
    if (Math.random() < 0.5) {
      const px = b.x + (Math.random()-0.5)*b.drawW*0.9;
      const py = b.y + (Math.random()-0.5)*b.drawH*0.9;
      const p = particles.spawn();
      if (p) { p.x=px; p.y=py; p.vx=0; p.vy=0; p.color='#fff'; p.life=0.45; p.maxLife=0.45; p.size=30; p.kind='explosion'; }
    }
    if (b.dying <= 0) b.active = false;
    return;
  }

  if (b.intro > 0) {
    b.intro -= dt;
    b.x = Math.max(W - 180, b.x - 28*dt);
    return;
  }

  // 페이즈 전환
  if (b.phase === 1 && b.hp < b.maxHp * 0.5) {
    b.phase = 2;
    b.sonarTimer = 2.0;
    b.dashTimer = 2.5;
    b.fireTimer = 0.8;
    for (let i = 0; i < 10; i++) {
      const p = particles.spawn();
      if (!p) continue;
      p.x = b.x+(Math.random()-0.5)*b.drawW;
      p.y = b.y+(Math.random()-0.5)*b.drawH;
      p.vx=0; p.vy=0; p.color='#40a0ff'; p.life=0.6; p.maxLife=0.6; p.size=24; p.kind='explosion';
    }
  }

  // 소나파 업데이트
  if (b.sonarActive > 0) {
    b.sonarActive -= dt;
    b.sonarW = (1 - b.sonarActive / 0.9) * W * 1.2; // 오른쪽에서 왼쪽으로 확장
  }

  if (b.isDashing) {
    b.x += b.vx * dt;
    if (b.x < -b.drawW || b.x > W + b.drawW) {
      b.isDashing = false;
      b.vx = 0;
      b.x = W - 180;
      b.dashTimer = b.phase === 1 ? 5.0 : 3.5;
    }
  } else {
    // 상하 부유
    b.y += b.vy * dt;
    if (b.y < 80)  b.vy =  Math.abs(b.vy);
    if (b.y > H-80) b.vy = -Math.abs(b.vy);
    b.x = W - 180 + Math.sin(b.age * 0.5) * 16;

    // 조준탄
    b.fireTimer -= dt;
    if (b.fireTimer <= 0 && player.alive) {
      b.fireTimer = b.phase === 1 ? 1.8 : 1.2;
      if (b.phase === 1) {
        _fire(pool, b.x - 50, b.y, player, 115);
      } else {
        const dx = player.x - b.x, dy = player.y - b.y;
        const base = Math.atan2(dy, dx);
        for (let i = -2; i <= 2; i++) {
          const blt = pool.spawn();
          if (!blt) continue;
          const a = base + i * 0.3;
          blt.x = b.x-50; blt.y = b.y;
          blt.vx = Math.cos(a)*120; blt.vy = Math.sin(a)*120;
          blt.kind = 'enemy';
        }
      }
    }

    // 소나파
    b.sonarTimer -= dt;
    if (b.sonarTimer <= 0) {
      b.sonarTimer = b.phase === 1 ? 5.5 : 3.5;
      b.sonarActive = 0.9;
      b.sonarY = b.y + (Math.random()-0.5)*60;
      b.sonarW = 0;
    }

    // 페이즈 2: 돌진
    if (b.phase === 2) {
      b.dashTimer -= dt;
      if (b.dashTimer <= 0) {
        b.isDashing = true;
        b.vx = -520;
      }
      // 작은 물고기 소환
      b.spawnTimer -= dt;
      if (b.spawnTimer <= 0) {
        b.spawnTimer = 5.5;
        for (let i = 0; i < 4; i++) {
          const blt = pool.spawn();
          if (!blt) continue;
          blt.x = W + 10;
          blt.y = 50 + Math.random()*(H-100);
          blt.vx = -90 - Math.random()*50;
          blt.vy = (Math.random()-0.5)*40;
          blt.kind = 'enemy';
        }
      }
    }
  }
}

function _fire(pool, x, y, player, speed) {
  if (!player.alive) return;
  const b = pool.spawn();
  if (!b) return;
  const dx = player.x-x, dy = player.y-y;
  const d = Math.hypot(dx,dy)||1;
  b.x=x; b.y=y; b.vx=dx/d*speed; b.vy=dy/d*speed; b.kind='enemy';
}

export function damageBossOrca(b, dmg, particles) {
  if (b.dying>0 || b.intro>0 || b.isDashing) return false;
  b.hp -= dmg;
  if (b.hp <= 0) {
    b.dying = 2.5;
    return true;
  }
  return false;
}

export function getSonarY(b) { return b.sonarActive > 0 ? b.sonarY : null; }

export function drawBossOrca(ctx, b) {
  if (!b.active) return;
  const img = (b.dying > 0)
    ? (assets.boss_orca_dead || assets.boss_orca)
    : assets.boss_orca;

  let alpha = 1;
  if (b.dying > 0) alpha = Math.min(1, b.dying / 2.0);
  if (b.intro > 0) alpha = Math.min(1, (2.2 - b.intro) / 2.2);
  if (b.isDashing) alpha = 0.9;

  // 소나파 그리기
  if (b.sonarActive > 0) {
    const t = b.sonarActive / 0.9;
    ctx.save();
    ctx.globalAlpha = t * 0.7;
    ctx.strokeStyle = '#40cfff';
    ctx.lineWidth = 6 * t;
    ctx.shadowColor = '#80e8ff';
    ctx.shadowBlur = 12;
    // 수평 충격파 라인
    for (let offset of [-12, 0, 12]) {
      ctx.beginPath();
      ctx.moveTo(W, b.sonarY + offset);
      ctx.lineTo(Math.max(0, W - b.sonarW), b.sonarY + offset);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  ctx.globalAlpha = alpha;
  if (img) {
    ctx.drawImage(img, b.x - b.drawW/2, b.y - b.drawH/2, b.drawW, b.drawH);
  } else {
    ctx.fillStyle = '#181818';
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, b.drawW/2, b.drawH/2, 0, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // HP 바
  if (b.intro<=0 && b.dying<=0) {
    const barW=W-40, barH=5, barX=20, barY=20;
    ctx.fillStyle = '#330';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = b.phase===1 ? '#40cfff' : '#ff3030';
    ctx.fillRect(barX, barY, barW*Math.max(0,b.hp/b.maxHp), barH);
    ctx.strokeStyle = '#fff'; ctx.lineWidth=1;
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.font='bold 8px "Courier New",monospace';
    ctx.fillStyle='#fff'; ctx.textAlign='center';
    ctx.fillText(b.phase===1 ? 'ORCA ADMIRAL' : 'ORCA ADMIRAL ★', W/2, barY-3);
    ctx.textAlign='left';
  }
}
