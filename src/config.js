// 내부 렌더 해상도
export const W = 400;
export const H = 240;

export const FIXED_DT = 1 / 60;

// 플레이어 (가장 큰 캐릭터 중 하나로)
export const PLAYER = {
  speed: 150,
  fireRate: 0.12,
  hitRadius: 6,
  startX: 80,
  startY: 120,
  drawW: 78,
  drawH: 52,
};

// 옵션 (잠수함의 절반)
export const OPTION_DRAW = { w: 38, h: 25, trailDelay: 14, maxCount: 2 };

// 탄
export const BULLET = {
  speed: 340,
  radius: 3,
  poolSize: 80,
};

export const POOL = {
  enemy: 36,
  enemyBullet: 120,
  particle: 80,
  powerup: 8,
  option: 4,
};

// 불가사리 (옵션과 비슷)
export const STARFISH_COLORS = ['pink', 'red', 'yellow', 'blue', 'green'];
export const STARFISH_CYCLE_INTERVAL = 1.0;
export const STARFISH_SPEED = 35;
export const STARFISH_DRAW_SIZE = 21;

export const STARFISH_EFFECT = {
  pink:   { label: '1000pt' },
  red:    { label: 'POWER UP' },
  yellow: { label: 'OPTION' },
  blue:   { label: 'SHIELD' },
  green:  { label: 'BOMB' },
};

// =============================================
// QA 모드 — true면 파워업 시간제한 없음, 라이프 무한
// 테스트 끝나면 false로만 바꾸면 원복
export const QA_MODE = true;
export const QA_LIVES = 99;   // QA 중 시작 라이프
// =============================================

export const SHIELD_DURATION = 5.0;
export const POWER_DURATION = 10.0;

export const LEADERBOARD_LIMIT = 10;

export const PLANT_COUNT = 12;

export const OPTION = { trailDelay: OPTION_DRAW.trailDelay, maxCount: OPTION_DRAW.maxCount };
