// 보스 상어. 문어와 다른 패턴:
// 페이즈 1: 화면 밖에서 돌진 (빠른 가로질러 지나감)
// 페이즈 2: 중앙 위치 + 레이저 + 새끼 상어 소환
import { W, H } from '../config.js';
import { assets } from '../assetManager.js';

const DASH_SPEED = 600;  // 돌진 속도

export function makeBossShark() {
  return {
    active: false,
    x: W + 100, y: H / 2,
    vx: 0, vy: 20,
    hp: 300, maxHp: 300,
    phase: 1,
    age: 0,
    fireTimer: 2.0,
    dashTimer: 3.0,  // 첫 돌진까지 대기
    isDashing: false,
    dashDir: 1,
    drawW: 157, drawH: 92,
    hitRadius: 55,
    points: 10000,
    intro: 2.0,
    dying: 0,
    laserTimer: 0,   // 페이즈 2 레이저
    laserActive: 0,  // 레이저 지속 시간
    laserY: 0,
    // 새끼 소환용
    spawnTimer: 0,
  };
}

export function spawnBossShark(b) {
  b.active = true;
  b.x = W + 100; b.y = H / 2;
  b.vx = 0; b.vy = 20;
  b.hp = b.maxHp;
  b.phase = 1;
  b.age = 0;
  b.fireTimer = 1.5;
  b.dashTimer = 2.5;
  b.isDashing = false;
  b.intro = 2.0;
  b.dying = 0;
  b.laserActive = 0;
  b.laserTimer = 5.0;
  b.spawnTimer = 8.0;
}

export function updateBossShark(b, dt, player, enemyBulletPool, particlePool) {
  if (!b.active) return;
  b.age += dt;

  // 사망 연출
  if (b.dying > 0) {
    b.dying -= dt;
    if (Math.random() < 0.4) {
      const px = b.x + (Math.random()-0.5)*b.drawW*0.8;
      const py = b.y + (Math.random()-0.5)*b.drawH*0.8;
      const p = particlePool.spawn();
      if (p) { p.x=px; p.y=py; p.vx=0; p.vy=0; p.color='#fff'; p.life=0.4; p.maxLife=0.4; p.size=28; p.kind='explosion'; }
    }
    if (b.dying <= 0) b.active = false;
    return;
  }

  // 입장
  if (b.intro > 0) {
    b.intro -= dt;
    b.x = Math.max(W - 160, b.x - 55 * dt);
    return;
  }

  // 페이즈 전환
  if (b.phase === 1 && b.hp < b.maxHp * 0.5) {
    b.phase = 2;
    b.dashTimer = 1.0;
    b.laserTimer = 3.0;
    b.spawnTimer = 4.0;
    // 페이즈 전환 폭발
    for (let i = 0; i < 8; i++) {
      const p = particlePool.spawn();
      if (!p) continue;
      p.x = b.x+(Math.random()-0.5)*b.drawW; p.y = b.y+(Math.random()-0.5)*b.drawH;
      p.vx=0; p.vy=0; p.color='#fff'; p.life=0.5; p.maxLife=0.5; p.size=20; p.kind='explosion';
    }
  }

  // 레이저 지속 업데이트
  if (b.laserActive > 0) b.laserActive -= dt;

  if (b.isDashing) {
    // 돌진 중
    b.x += b.vx * dt;
    // 화면 반대편 도달하면 돌진 종료
    if ((b.vx < 0 && b.x < -b.drawW) || (b.vx > 0 && b.x > W + b.drawW)) {
      b.isDashing = false;
      b.vx = 0;
      // 돌진 종료 후 원위치 복귀
      b.x = b.vx < 0 ? W - 160 : W - 160;
      b.x = W - 160;
      b.dashTimer = b.phase === 1 ? 3.5 : 2.5;
    }
  } else {
    // 상하 부유
    b.y += b.vy * dt;
    if (b.y < 70) b.vy = Math.abs(b.vy);
    if (b.y > H - 70) b.vy = -Math.abs(b.vy);
    b.x = W - 160 + Math.sin(b.age * 0.6) * 14;

    // 페이즈 1: 돌진 패턴
    b.dashTimer -= dt;
    if (b.dashTimer <= 0 && !b.isDashing) {
      b.isDashing = true;
      b.vx = -DASH_SPEED; // 왼쪽으로 돌진
    }

    // 기본 탄 발사
    b.fireTimer -= dt;
    if (b.fireTimer <= 0 && player.alive) {
      b.fireTimer = b.phase === 1 ? 1.8 : 1.2;
      if (b.phase === 1) {
        // 페이즈 1: 조준탄 2발 위아래
        _fire(enemyBulletPool, b.x - 40, b.y - 15, player, 110);
        _fire(enemyBulletPool, b.x - 40, b.y + 15, player, 110);
      } else {
        // 페이즈 2: 5방향 부채꼴
        const dx = player.x - b.x, dy = player.y - b.y;
        const base = Math.atan2(dy, dx);
        for (let i = -2; i <= 2; i++) {
          const blt = enemyBulletPool.spawn();
          if (!blt) continue;
          const a = base + i * 0.28;
          blt.x = b.x - 40; blt.y = b.y;
          blt.vx = Math.cos(a) * 115; blt.vy = Math.sin(a) * 115;
          blt.kind = 'enemy';
        }
      }
    }

    // 페이즈 2 전용: 레이저
    if (b.phase === 2) {
      b.laserTimer -= dt;
      if (b.laserTimer <= 0) {
        b.laserTimer = 4.5;
        b.laserActive = 0.8;
        b.laserY = b.y;
      }
      // 레이저 활성 중 탄환 행으로 대체 (실제 레이저는 draw에서)
      if (b.laserActive > 0 && player.alive) {
        // 레이저 히트 체크는 game2.js에서 처리
      }

      // 새끼 상어 소환 (탄환으로 표현)
      b.spawnTimer -= dt;
      if (b.spawnTimer <= 0) {
        b.spawnTimer = 6.0;
        for (let i = 0; i < 3; i++) {
          const blt = enemyBulletPool.spawn();
          if (!blt) continue;
          blt.x = W + 10;
          blt.y = 60 + Math.random() * (H - 120);
          blt.vx = -80 - Math.random() * 40;
          blt.vy = (Math.random() - 0.5) * 30;
          blt.kind = 'enemy';
        }
      }
    }
  }
}

function _fire(pool, x, y, player, speed) {
  const b = pool.spawn();
  if (!b || !player.alive) return;
  const dx = player.x - x, dy = player.y - y;
  const d = Math.hypot(dx, dy) || 1;
  b.x = x; b.y = y;
  b.vx = dx/d*speed; b.vy = dy/d*speed;
  b.kind = 'enemy';
}

export function damageBossShark(b, dmg, particlePool) {
  if (b.dying > 0 || b.intro > 0 || b.isDashing) return false;
  b.hp -= dmg;
  if (b.hp <= 0) {
    b.dying = 2.2;
    return true;
  }
  return false;
}

export function drawBossShark(ctx, b) {
  if (!b.active) return;
  const img = (b.dying > 0)
    ? (assets.boss_shark_dead || assets.boss_shark)
    : assets.boss_shark;

  let alpha = 1;
  if (b.dying > 0) alpha = Math.min(1, b.dying / 1.5);
  if (b.intro > 0) alpha = Math.min(1, (2.0 - b.intro) / 2.0);
  // 돌진 중 약간 반투명
  if (b.isDashing) alpha = 0.85;

  ctx.globalAlpha = alpha;
  if (img) {
    ctx.drawImage(img, b.x - b.drawW/2, b.y - b.drawH/2, b.drawW, b.drawH);
  } else {
    ctx.fillStyle = '#80b0c0';
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, b.drawW/2, b.drawH/2, 0, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 레이저 (페이즈 2)
  if (b.laserActive > 0 && b.phase === 2) {
    const t = b.laserActive;
    ctx.globalAlpha = Math.min(1, t * 3);
    ctx.strokeStyle = '#ff4040';
    ctx.lineWidth = 3 * Math.min(1, t * 2);
    ctx.shadowColor = '#ff8080';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(b.x - b.drawW/2, b.laserY);
    ctx.lineTo(0, b.laserY);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 1;
  }

  // HP 바
  if (b.intro <= 0 && b.dying <= 0) {
    const barW = W - 40, barH = 5, barX = 20, barY = 20;
    ctx.fillStyle = '#330';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = b.phase === 1 ? '#40c0ff' : '#ff4040';
    ctx.fillRect(barX, barY, barW * Math.max(0, b.hp/b.maxHp), barH);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.font = 'bold 8px "Courier New", monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(b.phase === 1 ? 'GREAT WHITE' : 'GREAT WHITE ★', W/2, barY - 3);
    ctx.textAlign = 'left';
  }
}
