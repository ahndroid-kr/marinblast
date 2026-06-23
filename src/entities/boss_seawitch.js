// 보스 바다 마녀. 패턴:
// 페이즈 1: 마법탄 + 촉수 슬램(가로 위험지대)
// 페이즈 2: 나선 탄막 + 마법 포탄 + 분신 소환
import { W, H } from '../config.js';
import { assets } from '../assetManager.js';

export function makeBossSeawitch() {
  return {
    active: false,
    x: W + 120, y: H / 2,
    vy: 20,
    hp: 500, maxHp: 500,
    phase: 1,
    age: 0,
    fireTimer: 2.0,
    slamTimer: 5.0,    // 촉수 슬램 타이머
    slamActive: 0,     // 슬램 경고/이펙트 지속
    slamY: 0,
    slamWarning: 0,    // 경고 선 표시 시간
    spiralAngle: 0,    // 페이즈 2 나선 각도
    spiralTimer: 0,
    drawW: 160, drawH: 97,
    hitRadius: 48,
    points: 20000,
    intro: 3.2,
    dying: 0,
  };
}

export function spawnBossSeawitch(b) {
  b.active = true;
  b.x = W + 120; b.y = H / 2;
  b.vy = 20;
  b.hp = b.maxHp;
  b.phase = 1;
  b.age = 0;
  b.fireTimer = 2.0;
  b.slamTimer = 5.0;
  b.slamActive = 0;
  b.slamWarning = 0;
  b.spiralTimer = 0;
  b.spiralAngle = 0;
  b.intro = 3.2;
  b.dying = 0;
}

export function updateBossSeawitch(b, dt, player, pool, particles) {
  if (!b.active) return;
  b.age += dt;

  // 사망 연출
  if (b.dying > 0) {
    b.dying -= dt;
    if (Math.random() < 0.45) {
      const px = b.x + (Math.random()-0.5)*b.drawW*0.8;
      const py = b.y + (Math.random()-0.5)*b.drawH*0.6;
      const p = particles.spawn();
      if (p) { p.x=px; p.y=py; p.vx=0; p.vy=0; p.color='#cc44ff'; p.life=0.5; p.maxLife=0.5; p.size=28; p.kind='explosion'; }
    }
    if (b.dying <= 0) b.active = false;
    return;
  }

  // 입장
  if (b.intro > 0) {
    b.intro -= dt;
    b.x = Math.max(W - 150, b.x - 28 * dt);
    return;
  }

  // 페이즈 전환
  if (b.phase === 1 && b.hp < b.maxHp * 0.5) {
    b.phase = 2;
    b.fireTimer = 0.8;
    b.slamTimer = 3.0;
    b.spiralTimer = 0;
    for (let i = 0; i < 10; i++) {
      const p = particles.spawn();
      if (!p) continue;
      p.x = b.x+(Math.random()-0.5)*b.drawW;
      p.y = b.y+(Math.random()-0.5)*b.drawH;
      p.vx=0; p.vy=0; p.color='#cc44ff'; p.life=0.6; p.maxLife=0.6; p.size=22; p.kind='explosion';
    }
  }

  // 상하 부유
  b.y += b.vy * dt;
  if (b.y < 80)  b.vy =  Math.abs(b.vy);
  if (b.y > H-80) b.vy = -Math.abs(b.vy);
  b.x = W - 150 + Math.sin(b.age * 0.6) * 14;

  // 슬램 경고/이펙트 감쇠
  if (b.slamWarning > 0) b.slamWarning -= dt;
  if (b.slamActive > 0)  b.slamActive -= dt;

  // 촉수 슬램 타이머
  b.slamTimer -= dt;
  if (b.slamTimer <= 0) {
    b.slamTimer = b.phase === 1 ? 5.5 : 3.5;
    b.slamY = 50 + Math.random() * (H - 100);
    b.slamWarning = 1.2; // 1.2초 경고
    setTimeout(() => { b.slamActive = 0.7; }, 1200);
  }

  // 기본 마법탄
  b.fireTimer -= dt;
  if (b.fireTimer <= 0 && player.alive) {
    b.fireTimer = b.phase === 1 ? 1.8 : 1.2;
    if (b.phase === 1) {
      // 조준탄 2발
      _fire(pool, b.x - 30, b.y - 20, player, 110);
      _fire(pool, b.x - 30, b.y + 20, player, 110);
    } else {
      // 5방향
      const dx = player.x - b.x, dy = player.y - b.y;
      const base = Math.atan2(dy, dx);
      for (let i = -2; i <= 2; i++) {
        const blt = pool.spawn();
        if (!blt) continue;
        const a = base + i * 0.3;
        blt.x = b.x-30; blt.y = b.y;
        blt.vx = Math.cos(a)*120; blt.vy = Math.sin(a)*120;
        blt.kind = 'enemy';
      }
    }
  }

  // 페이즈 2: 나선 탄막
  if (b.phase === 2) {
    b.spiralTimer -= dt;
    if (b.spiralTimer <= 0) {
      b.spiralTimer = 0.12;
      b.spiralAngle += 0.45;
      for (let i = 0; i < 3; i++) {
        const blt = pool.spawn();
        if (!blt) continue;
        const a = b.spiralAngle + (i / 3) * Math.PI * 2;
        blt.x = b.x; blt.y = b.y;
        blt.vx = Math.cos(a) * 75; blt.vy = Math.sin(a) * 75;
        blt.kind = 'enemy';
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

export function getSlamY4(b) {
  return (b.slamActive > 0 || b.slamWarning > 0) ? b.slamY : null;
}
export function isSlamActive4(b) { return b.slamActive > 0; }

export function damageBossSeawitch(b, dmg, particles) {
  if (b.dying > 0 || b.intro > 0) return false;
  b.hp -= dmg;
  if (b.hp <= 0) {
    b.dying = 3.5;
    return true;
  }
  return false;
}

export function drawBossSeawitch(ctx, b) {
  if (!b.active) return;
  const img = (b.dying > 0)
    ? (assets.boss_seawitch_dead || assets.boss_seawitch)
    : assets.boss_seawitch;

  let alpha = 1;
  if (b.dying > 0) {
    if (b.dying > 1.5) alpha = (Math.floor(b.dying * 12) % 2 === 0) ? 0.3 : 1;
    else alpha = b.dying / 1.5;
  }
  if (b.intro > 0) alpha = Math.min(1, (3.2 - b.intro) / 3.2);

  // 촉수 슬램 — 경고선(노랑) + 이펙트(보라)
  if (b.slamWarning > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, b.slamWarning) * 0.7;
    ctx.strokeStyle = '#ffdd00';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(0, b.slamY);
    ctx.lineTo(W, b.slamY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
  if (b.slamActive > 0) {
    ctx.save();
    ctx.globalAlpha = b.slamActive / 0.7;
    ctx.strokeStyle = '#cc44ff';
    ctx.lineWidth = 5;
    ctx.shadowColor = '#aa00ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, b.slamY);
    ctx.lineTo(W, b.slamY);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // 페이즈 2: 눈 이펙트 (붉은 글로우 오버레이)
  if (b.phase === 2 && b.intro <= 0 && b.dying <= 0) {
    const eyePulse = 0.5 + Math.sin(b.age * 8) * 0.5;
    ctx.save();
    ctx.globalAlpha = 0.35 * eyePulse;
    ctx.fillStyle = '#ff4400';
    ctx.beginPath();
    ctx.arc(b.x - 18, b.y - 10, 12, 0, Math.PI * 2);
    ctx.arc(b.x + 18, b.y - 10, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.globalAlpha = alpha;
  if (img) {
    ctx.drawImage(img, b.x - b.drawW/2, b.y - b.drawH/2, b.drawW, b.drawH);
  } else {
    ctx.fillStyle = '#3d1566';
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, b.drawW/2, b.drawH/2, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#cc44ff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SEAWITCH', b.x, b.y);
    ctx.textAlign = 'left';
  }
  ctx.globalAlpha = 1;

  // HP 바
  if (b.intro <= 0 && b.dying <= 0) {
    const barW=W-40, barH=5, barX=20, barY=20;
    ctx.fillStyle = '#330';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = b.phase===1 ? '#cc44ff' : '#ff2080';
    ctx.fillRect(barX, barY, barW*Math.max(0,b.hp/b.maxHp), barH);
    ctx.strokeStyle='#fff'; ctx.lineWidth=1;
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.font='bold 8px "Courier New",monospace';
    ctx.fillStyle='#fff'; ctx.textAlign='center';
    ctx.fillText(b.phase===1 ? 'SEA WITCH' : 'SEA WITCH ★', W/2, barY-3);
    ctx.textAlign='left';
  }
}
