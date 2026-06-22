import playerUrl from './assets/player.png';
import optionUrl from './assets/option.png';
import bgUrl from './assets/background.png';
import midUrl from './assets/parallax_mid.png';
import bossUrl from './assets/boss_octopus.png';
import bossDeadUrl from './assets/boss_octopus_dead.png';
import starPinkUrl from './assets/star_pink.png';
import starRedUrl from './assets/star_red.png';
import starYellowUrl from './assets/star_yellow.png';
import starBlueUrl from './assets/star_blue.png';
import starGreenUrl from './assets/star_green.png';
import anchovyUrl from './assets/enemy_anchovy.png';
import shrimpUrl from './assets/enemy_shrimp.png';
import mackerelUrl from './assets/enemy_mackerel.png';
// 스테이지 2 에셋
import bossSharkUrl from './assets/boss_shark.png';
import bossSharkDeadUrl from './assets/boss_shark_dead.png';
import mirugaiUrl from './assets/enemy_mirugai.png';
import hirameUrl from './assets/enemy_hirame.png';
import buriUrl from './assets/enemy_buri.png';
import energyPotionUrl from './assets/energy_potion.png';
import plant00 from './assets/plant_00.png';
import plant01 from './assets/plant_01.png';
import plant02 from './assets/plant_02.png';
import plant03 from './assets/plant_03.png';
import plant04 from './assets/plant_04.png';
import plant05 from './assets/plant_05.png';
import plant06 from './assets/plant_06.png';
import plant07 from './assets/plant_07.png';
import plant08 from './assets/plant_08.png';
import plant09 from './assets/plant_09.png';
import plant10 from './assets/plant_10.png';
import plant11 from './assets/plant_11.png';

const URLS = {
  player: playerUrl, option: optionUrl,
  background: bgUrl, parallax_mid: midUrl,
  boss_octopus: bossUrl,
  boss_octopus_dead: bossDeadUrl,
  boss_shark: bossSharkUrl,
  boss_shark_dead: bossSharkDeadUrl,
  energy_potion: energyPotionUrl,
  star_pink: starPinkUrl, star_red: starRedUrl,
  star_yellow: starYellowUrl, star_blue: starBlueUrl, star_green: starGreenUrl,
  enemy_anchovy: anchovyUrl, enemy_shrimp: shrimpUrl, enemy_mackerel: mackerelUrl,
  enemy_mirugai: mirugaiUrl, enemy_hirame: hirameUrl, enemy_buri: buriUrl,
  plant_00:plant00, plant_01:plant01, plant_02:plant02,
  plant_03:plant03, plant_04:plant04, plant_05:plant05,
  plant_06:plant06, plant_07:plant07, plant_08:plant08,
  plant_09:plant09, plant_10:plant10, plant_11:plant11,
};

const FLIP_KEYS = ['player', 'option'];
export const assets = {};
export const flipped = {};

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`이미지 로드 실패: ${url}`));
    img.src = url;
  });
}

function makeFlippedCanvas(img) {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const cx = c.getContext('2d');
  cx.imageSmoothingEnabled = false;
  cx.translate(c.width, 0); cx.scale(-1, 1);
  cx.drawImage(img, 0, 0);
  return c;
}

export async function loadAssets(onProgress) {
  const entries = Object.entries(URLS);
  let done = 0;
  await Promise.all(entries.map(async ([key, url]) => {
    const img = await loadImage(url);
    assets[key] = img;
    if (FLIP_KEYS.includes(key)) flipped[key] = makeFlippedCanvas(img);
    done++;
    if (onProgress) onProgress(done, entries.length);
  }));
}
