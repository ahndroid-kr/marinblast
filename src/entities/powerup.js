import { STARFISH_COLORS, STARFISH_CYCLE_INTERVAL, STARFISH_SPEED, W, H } from '../config.js';

const COLOR_MAP = {
  pink:   '#ff80c0',
  red:    '#ff3030',
  yellow: '#ffe060',
  blue:   '#4080ff',
  green:  '#40ff80',
};

export function makeStarfish() {
  return {
    active: false,
    x: 0, y: 0,
    vx: -STARFISH_SPEED,
    vy: 0,
    colorIndex: 0,
    cycleTimer: STARFISH_CYCLE_INTERVAL,
    rot: 0,
  };
}

export function resetStarfish(s, x, y) {
  s.x = x; s.y = y;
  s.vx = -STARFISH_SPEED;
  s.vy = (Math.random() - 0.5) * 20;
  s.colorIndex = 0;
  s.cycleTimer = STARFISH_CYCLE_INTERVAL;
  s.rot = 0;
}

export function updateStarfish(s, dt) {
  s.x += s.vx * dt;
  s.y += s.vy * dt;
  s.rot += dt * 1.5;
  // 천천히 떠다님 - y는 약간의 사인
  s.vy += Math.sin(s.x * 0.05) * 5 * dt;
  s.vy *= 0.96;

  // 색 사이클
  s.cycleTimer -= dt;
  if (s.cycleTimer <= 0) {
    s.cycleTimer = STARFISH_CYCLE_INTERVAL;
    s.colorIndex = (s.colorIndex + 1) % STARFISH_COLORS.length;
  }

  // 화면 밖
  if (s.x < -20 || s.y < -10 || s.y > H + 10) s.active = false;
}

// 탄에 맞으면 색이 바뀜 (적과 같은 충돌 처리에서 호출)
export function hitStarfish(s) {
  s.colorIndex = (s.colorIndex + 1) % STARFISH_COLORS.length;
  s.cycleTimer = STARFISH_CYCLE_INTERVAL;
}

export function currentColor(s) {
  return STARFISH_COLORS[s.colorIndex];
}

export function drawStarfish(ctx, s) {
  const color = COLOR_MAP[currentColor(s)];
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.rot);
  ctx.fillStyle = color;
  // 5각 별
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 6 : 2.5;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  // 중앙 점
  ctx.fillStyle = '#fff';
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}
