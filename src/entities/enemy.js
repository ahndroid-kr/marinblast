// 적 정의. 종류별로 생성/이동/발사 패턴을 분리해서 데이터로 관리.
// 1스테이지 잡몹: 멸치(anchovy), 새우(shrimp), 고등어(mackerel)
// 보스 문어는 별도 파일로 분리 예정 (프로토타입에선 placeholder)

import { W, H } from '../config.js';

// 적 인스턴스의 공통 필드
export function makeEnemy() {
  return {
    active: false,
    kind: 'anchovy',
    x: 0, y: 0,
    vx: 0, vy: 0,
    hp: 1,
    age: 0,         // 생성 후 경과 시간 (이동 패턴 계산용)
    spawnY: 0,      // 등장 시점 y (사인파 기준점)
    spawnVx: -60,   // 기본 좌측 이동 속도
    radius: 5,
    fireTimer: 0,
    fireInterval: 999, // 발사 안 함이 기본
    points: 100,
    dropChance: 0,  // 죽었을 때 불가사리 드랍 확률
  };
}

// 종류별 프리셋
export const ENEMY_PRESETS = {
  // 멸치: 작고 빠름. 사인파. 무발사. 떼로 등장.
  anchovy: {
    hp: 1, spawnVx: -80, radius: 4, fireInterval: 999,
    points: 100, dropChance: 0.1,
  },
  // 새우: 바닥 근처에서 튐. 단발 조준탄.
  shrimp: {
    hp: 2, spawnVx: -50, radius: 5, fireInterval: 2.0,
    points: 200, dropChance: 0.25,
  },
  // 고등어: 빠른 직선 + 큰 체력. 무발사 / 또는 가끔 발사.
  mackerel: {
    hp: 3, spawnVx: -120, radius: 6, fireInterval: 3.0,
    points: 300, dropChance: 0.35,
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
  e.fireTimer = p.fireInterval; // 처음 발사까지 대기
  e.fireInterval = p.fireInterval;
  e.points = p.points;
  e.dropChance = p.dropChance;
}

export function updateEnemy(e, dt, player, enemyBulletPool) {
  e.age += dt;

  switch (e.kind) {
    case 'anchovy': {
      // 사인파 이동
      e.x += e.spawnVx * dt;
      e.y = e.spawnY + Math.sin(e.age * 4) * 14;
      break;
    }
    case 'shrimp': {
      // 호를 그리며 하강 후 상승
      e.x += e.spawnVx * dt;
      e.y = e.spawnY + Math.sin(e.age * 1.5) * 30;
      // 발사
      e.fireTimer -= dt;
      if (e.fireTimer <= 0 && e.x < W - 10) {
        e.fireTimer = e.fireInterval;
        _fireAimed(e, player, enemyBulletPool, 90);
      }
      break;
    }
    case 'mackerel': {
      // 빠른 직선. 가끔 발사.
      e.x += e.spawnVx * dt;
      e.fireTimer -= dt;
      if (e.fireTimer <= 0 && e.x < W - 20 && e.x > 20) {
        e.fireTimer = e.fireInterval;
        _fireAimed(e, player, enemyBulletPool, 100);
      }
      break;
    }
  }

  // 화면 밖으로 나가면 비활성
  if (e.x < -20 || e.y < -20 || e.y > H + 20) e.active = false;
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
  switch (e.kind) {
    case 'anchovy':
      ctx.fillStyle = '#88aacc';
      ctx.beginPath();
      ctx.ellipse(e.x, e.y, 6, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#445566';
      ctx.fillRect(e.x - 6, e.y - 1, 2, 2); // 꼬리
      ctx.fillStyle = '#000';
      ctx.fillRect(e.x + 3, e.y - 1, 1, 1); // 눈
      break;
    case 'shrimp':
      ctx.fillStyle = '#ffb070';
      ctx.beginPath();
      ctx.arc(e.x, e.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cc7040';
      ctx.fillRect(e.x - 5, e.y - 1, 2, 1);
      ctx.fillRect(e.x - 6, e.y, 2, 1);
      ctx.fillRect(e.x + 3, e.y - 3, 1, 2); // 더듬이
      ctx.fillRect(e.x + 4, e.y - 4, 1, 2);
      break;
    case 'mackerel':
      ctx.fillStyle = '#5577aa';
      ctx.beginPath();
      ctx.ellipse(e.x, e.y, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#334477';
      ctx.fillRect(e.x - 4, e.y - 3, 6, 1); // 등 줄무늬
      ctx.fillRect(e.x - 3, e.y - 2, 5, 1);
      ctx.fillStyle = '#223355';
      ctx.beginPath();
      ctx.moveTo(e.x - 7, e.y);
      ctx.lineTo(e.x - 10, e.y - 4);
      ctx.lineTo(e.x - 10, e.y + 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.fillRect(e.x + 4, e.y - 1, 1, 1);
      break;
  }
}
