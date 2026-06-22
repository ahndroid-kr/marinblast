import { OPTION_DRAW } from '../config.js';
import { flipped } from '../assetManager.js';

export function makeOption() {
  return { active: false, x: 0, y: 0, historyIndex: 0 };
}

export function resetOption(o, slot) {
  o.historyIndex = (slot + 1) * OPTION_DRAW.trailDelay;
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
  const img = flipped.option;
  if (img) {
    ctx.drawImage(img, o.x - OPTION_DRAW.w / 2, o.y - OPTION_DRAW.h / 2, OPTION_DRAW.w, OPTION_DRAW.h);
  } else {
    ctx.fillStyle = '#ffe060';
    ctx.fillRect(o.x - 6, o.y - 4, 12, 8);
  }
}
