// BGM 매니저 — main / boss 두 트랙
import mainUrl from './assets/bgm_main.mp3';
import bossUrl from './assets/bgm_boss.mp3';

const bgms = {
  main: new Audio(mainUrl),
  boss: new Audio(bossUrl),
};
bgms.main.loop = true;
bgms.boss.loop = true;

let current = null;
let muted = false;

export const audio = {
  play(name) {
    if (current === name) return;
    if (current) bgms[current].pause();
    current = name;
    if (!muted) {
      bgms[name].currentTime = 0;
      bgms[name].play().catch(() => {});
    }
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
