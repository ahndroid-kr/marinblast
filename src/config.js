// 내부 렌더 해상도 (CSS로 확대 표시)
// 태블릿/폰 가로 모드 대응을 위해 5:3 와이드 비율 사용
export const W = 400;
export const H = 240;

// 게임 루프
export const FIXED_DT = 1 / 60;

// 플레이어
export const PLAYER = {
  speed: 130,
  fireRate: 0.12,
  hitRadius: 3,
  startX: 70,
  startY: 120,
  drawW: 28,
  drawH: 18,
};

// 옵션 (미니 동료)
export const OPTION_DRAW = { w: 16, h: 10, trailDelay: 14, maxCount: 2 };

// 탄
export const BULLET = {
  speed: 320,
  radius: 2,
  poolSize: 80,
};

// 적 풀 크기
export const POOL = {
  enemy: 36,
  enemyBullet: 120,
  particle: 80,
  powerup: 8,
  option: 4,
};

// 불가사리 색 사이클
export const STARFISH_COLORS = ['pink', 'red', 'yellow', 'blue', 'green'];
export const STARFISH_CYCLE_INTERVAL = 1.0;
export const STARFISH_SPEED = 35;

export const STARFISH_EFFECT = {
  pink:   { label: '1000pt' },
  red:    { label: 'POWER UP' },
  yellow: { label: 'OPTION' },
  blue:   { label: 'SHIELD' },
  green:  { label: 'BOMB' },
};

export const SHIELD_DURATION = 5.0;

// 랭킹 표시 인원
export const LEADERBOARD_LIMIT = 10;

// 옵션 호환성용 (구 코드에서 OPTION import하는 경우)
export const OPTION = { trailDelay: OPTION_DRAW.trailDelay, maxCount: OPTION_DRAW.maxCount };
