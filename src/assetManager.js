// 모든 이미지 에셋을 한 번에 로드하고, 좌우 반전 버전도 미리 만들어 캐싱.
// drawImage()는 캔버스도 받을 수 있으므로 반전 캐시를 그대로 그리면 됨.

import playerUrl from './assets/player.png';
import optionUrl from './assets/option.png';
import bgUrl from './assets/background.png';
import midUrl from './assets/parallax_mid.png';
import terrainUrl from './assets/terrain.png';
import bossUrl from './assets/boss_octopus.png';
import effectsUrl from './assets/effects.png';

import starPinkUrl from './assets/star_pink.png';
import starRedUrl from './assets/star_red.png';
import starYellowUrl from './assets/star_yellow.png';
import starBlueUrl from './assets/star_blue.png';
import starGreenUrl from './assets/star_green.png';

import anchovyUrl from './assets/enemy_anchovy.png';
import shrimpUrl from './assets/enemy_shrimp.png';
import mackerelUrl from './assets/enemy_mackerel.png';

const URLS = {
  player: playerUrl,
  option: optionUrl,
  background: bgUrl,
  parallax_mid: midUrl,
  terrain: terrainUrl,
  boss_octopus: bossUrl,
  effects: effectsUrl,
  star_pink: starPinkUrl,
  star_red: starRedUrl,
  star_yellow: starYellowUrl,
  star_blue: starBlueUrl,
  star_green: starGreenUrl,
  enemy_anchovy: anchovyUrl,
  enemy_shrimp: shrimpUrl,
  enemy_mackerel: mackerelUrl,
};

// 좌우 반전이 필요한 이미지 키 (오른쪽을 보도록)
const FLIP_KEYS = ['player', 'option'];

export const assets = {};        // key -> HTMLImageElement
export const flipped = {};       // key -> HTMLCanvasElement (좌우 반전)

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`이미지 로드 실패: ${url}`));
    img.src = url;
  });
}

function makeFlippedCanvas(img) {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const cx = c.getContext('2d');
  cx.imageSmoothingEnabled = false;
  cx.translate(c.width, 0);
  cx.scale(-1, 1);
  cx.drawImage(img, 0, 0);
  return c;
}

export async function loadAssets(onProgress) {
  const entries = Object.entries(URLS);
  let done = 0;
  await Promise.all(entries.map(async ([key, url]) => {
    const img = await loadImage(url);
    assets[key] = img;
    if (FLIP_KEYS.includes(key)) {
      flipped[key] = makeFlippedCanvas(img);
    }
    done++;
    if (onProgress) onProgress(done, entries.length);
  }));
}
