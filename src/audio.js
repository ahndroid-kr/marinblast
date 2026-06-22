import mainUrl from './assets/bgm_main.mp3';
import bossUrl from './assets/bgm_boss.mp3';

// 게임 로딩 시 미리 fetch해서 버퍼링
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
    if (current === name && !bgms[name].paused) return;
    if (current && current !== name) {
      bgms[current].pause();
      bgms[current].currentTime = 0;
    }
    current = name;
    if (!muted) bgms[name].play().catch(() => {});
  },
  stop() {
    if (current) { bgms[current].pause(); bgms[current].currentTime = 0; }
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
    if (muted) { if (current) bgms[current].pause(); }
    else        { if (current) bgms[current].play().catch(() => {}); }
    return muted;
  },
  isMuted() { return muted; },
};
