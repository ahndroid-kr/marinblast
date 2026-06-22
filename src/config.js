// 내부 렌더 해상도 (CSS로 확대 표시)
export const W = 400;
export const H = 240;

export const FIXED_DT = 1 / 60;

// 플레이어 (전체적으로 50% 정도 키움)
export const PLAYER = {
  speed: 140,
  fireRate: 0.12,
  hitRadius: 5,
  startX: 80,
  startY: 120,
  drawW: 50,
  drawH: 33,
};

// 옵션
export const OPTION_DRAW = { w: 28, h: 18, trailDelay: 14, maxCount: 2 };

// 탄
export const BULLET = {
  speed: 340,
  radius: 3,
  poolSize: 80,
};

// 적 풀
export const POOL = {
  enemy: 36,
  enemyBullet: 120,
  particle: 80,
  powerup: 8,
  option: 4,
};

// 불가사리
export const STARFISH_COLORS = ['pink', 'red', 'yellow', 'blue', 'green'];
export const STARFISH_CYCLE_INTERVAL = 1.0;
export const STARFISH_SPEED = 35;
export const STARFISH_DRAW_SIZE = 22;

export const STARFISH_EFFECT = {
  pink:   { label: '1000pt' },
  red:    { label: 'POWER UP' },
  yellow: { label: 'OPTION' },
  blue:   { label: 'SHIELD' },
  green:  { label: 'BOMB' },
};

export const SHIELD_DURATION = 5.0;

export const LEADERBOARD_LIMIT = 10;

// 식물 타일 개수 (assets/plant_00.png ~ plant_11.png)
export const PLANT_COUNT = 12;

export const OPTION = { trailDelay: OPTION_DRAW.trailDelay, maxCount: OPTION_DRAW.maxCount };
