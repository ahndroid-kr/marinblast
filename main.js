import { STARFISH_COLORS, STARFISH_CYCLE_INTERVAL, STARFISH_SPEED, STARFISH_DRAW_SIZE, H } from '../config.js';
import { assets } from '../assetManager.js';

export function makeStarfish() {
  return {
    active: false, x: 0, y: 0,
    vx: -STARFISH_SPEED, vy: 0,
    colorIndex: 0, cycleTimer: STARFISH_CYCLE_INTERVAL, rot: 0,
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
  s.vy += Math.sin(s.x * 0.05) * 5 * dt;
  s.vy *= 0.96;
  s.cycleTimer -= dt;
  if (s.cycleTimer <= 0) {
    s.cycleTimer = STARFISH_CYCLE_INTERVAL;
    s.colorIndex = (s.colorIndex + 1) % STARFISH_COLORS.length;
  }
  if (s.x < -30 || s.y < -20 || s.y > H + 20) s.active = false;
}

export function hitStarfish(s) {
  s.colorIndex = (s.colorIndex + 1) % STARFISH_COLORS.length;
  s.cycleTimer = STARFISH_CYCLE_INTERVAL;
}

export function currentColor(s) {
  return STARFISH_COLORS[s.colorIndex];
}

export function drawStarfish(ctx, s) {
  const color = currentColor(s);
  const img = assets[`star_${color}`];
  if (img) {
    const bob = 1 + Math.sin(s.rot * 2) * 0.08;
    const w = STARFISH_DRAW_SIZE * bob;
    const h = STARFISH_DRAW_SIZE * bob;
    ctx.drawImage(img, s.x - w / 2, s.y - h / 2, w, h);
  } else {
    ctx.fillStyle = '#ff80c0';
    ctx.fillRect(s.x - 10, s.y - 10, 20, 20);
  }
}
