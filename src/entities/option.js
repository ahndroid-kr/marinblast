import { OPTION } from '../config.js';

// 옵션은 플레이어의 과거 좌표를 따라다닌다.
// 각 옵션은 historyIndex 만큼 지연된 위치를 점유.

export function makeOption() {
  return { active: false, x: 0, y: 0, historyIndex: 0 };
}

export function resetOption(o, slot /* 0-based */) {
  // slot 0은 14프레임 지연, slot 1은 28프레임 지연
  o.historyIndex = (slot + 1) * OPTION.trailDelay;
  o.x = 0; o.y = 0;
}

export function updateOption(o, player) {
  if (!player.history.length) return;
  const idx = Math.min(o.historyIndex, player.history.length - 1);
  const target = player.history[idx];
  o.x = target.x;
  o.y = target.y;
}

export function drawOption(ctx, o) {
  // 작은 노란 미니어처
  ctx.fillStyle = '#ffe060';
  ctx.beginPath();
  ctx.moveTo(o.x + 5, o.y);
  ctx.lineTo(o.x - 3, o.y - 3);
  ctx.lineTo(o.x - 1, o.y);
  ctx.lineTo(o.x - 3, o.y + 3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff8800';
  ctx.fillRect(o.x - 3, o.y, 1, 1);
}
