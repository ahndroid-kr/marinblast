import mainUrl from './assets/bgm_main.mp3';
import bossUrl from './assets/bgm_boss.mp3';

function preload(url) {
  const a = new Audio(url);
  a.preload = 'auto';
  a.load();
  a.loop = true;
  return a;
}

const bgms = {
  main: preload(mainUrl),
  boss: preload(bossUrl),
};

let current = null;
let muted = false;

export const audio = {
  play(name) {
    // 같은 트랙이고 이미 재생 중이면 무시
    if (current === name && !bgms[name].paused) return;

    // 다른 트랙 재생 중이면 멈추고 처음으로
    if (current && current !== name) {
      bgms[current].pause();
      bgms[current].currentTime = 0;
    }

    current = name;
    if (!muted) {
      // 이어서 재생 (끊겼던 경우) or 처음부터
      bgms[name].play().catch(() => {});
    }
  },

  stop() {
    if (current) {
      bgms[current].pause();
      bgms[current].currentTime = 0;
    }
    current = null;
  },

  pause() {
    if (current) bgms[current].pause();
  },

  resume() {
    if (current && !muted) bgms[current].play().catch(() => {});
  },

  toggleMute() {
    muted = !muted;
    if (muted) {
      if (current) bgms[current].pause();
    } else {
      if (current) bgms[current].play().catch(() => {});
    }
    return muted;
  },

  isMuted() { return muted; },
};
