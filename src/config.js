// 내부 렌더 해상도 (CSS로 확대 표시)
export const W = 320;
export const H = 240;

// 게임 루프
export const FIXED_DT = 1 / 60; // 60Hz 고정 timestep

// 플레이어
export const PLAYER = {
  speed: 110,      // px/sec
  fireRate: 0.12,  // sec between shots
  hitRadius: 3,
  startX: 60,
  startY: 120,
};

// 탄
export const BULLET = {
  speed: 280,
  radius: 2,
  poolSize: 64,
};

// 적 풀 크기
export const POOL = {
  enemy: 32,
  enemyBullet: 96,
  particle: 64,
  powerup: 8,
  option: 4,
};

// 불가사리 색 사이클 (분홍 → 빨강 → 노랑 → 파랑 → 초록 → 다시 분홍)
export const STARFISH_COLORS = ['pink', 'red', 'yellow', 'blue', 'green'];
export const STARFISH_CYCLE_INTERVAL = 1.0; // sec
export const STARFISH_SPEED = 35;

// 색별 효과 라벨 (디버그/HUD용)
export const STARFISH_EFFECT = {
  pink:   { label: '1000pt' },
  red:    { label: 'POWER UP' },
  yellow: { label: 'OPTION' },
  blue:   { label: 'SHIELD' },
  green:  { label: 'BOMB' },
};

// 옵션(미니 동료)
export const OPTION = {
  trailDelay: 14, // 플레이어 과거 좌표 큐 인덱스 간격 (프레임 수)
  maxCount: 2,
};

// 무적 시간
export const SHIELD_DURATION = 5.0;
