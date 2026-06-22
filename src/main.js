// 진입점. 캔버스 셋업, 반응형 스케일, 에셋 로드, 씬 전환, 리더보드 UI.

import { W, H, FIXED_DT } from './config.js';
import { Input } from './input.js';
import { TitleScene } from './scenes/title.js';
import { GameScene } from './scenes/game.js';
import { Game2Scene } from './scenes/game2.js';
import { Game3Scene } from './scenes/game3.js';
import { submitScore, getTopScores, isRemoteEnabled } from './leaderboard.js';
import { loadAssets } from './assetManager.js';
import { audio } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
canvas.width = W;
canvas.height = H;
ctx.imageSmoothingEnabled = false;

// 반응형 스케일링 — 화면을 최대한 채우되 캔버스 비율 유지
function resize() {
  const sw = window.innerWidth;
  const sh = window.innerHeight;
  // 비율 유지 최대 스케일 (분수 허용해서 빈 공간 최소화)
  const scale = Math.min(sw / W, sh / H);
  const cssW = Math.floor(W * scale);
  const cssH = Math.floor(H * scale);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  const stage = document.getElementById('stage');
  stage.style.width = cssW + 'px';
  stage.style.height = cssH + 'px';
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 100));
resize();

const input = new Input(canvas);

// 캔버스 클릭/터치 시작 시점에 일시정지 버튼 위에 있는지 확인
function checkPauseButtonHit(clientX, clientY) {
  if (!currentScene || !currentScene.hitPauseButton) return false;
  const rect = canvas.getBoundingClientRect();
  const cx = ((clientX - rect.left) / rect.width) * W;
  const cy = ((clientY - rect.top) / rect.height) * H;
  if (currentScene.hitBgmButton && currentScene.hitBgmButton(cx, cy)) {
    audio.toggleMute();
    return true;
  }
  if (currentScene.hitPauseButton(cx, cy)) {
    input.triggerPause();
    return true;
  }
  return false;
}

canvas.addEventListener('touchstart', (e) => {
  if (e.touches[0] && checkPauseButtonHit(e.touches[0].clientX, e.touches[0].clientY)) {
    e.preventDefault();
    e.stopPropagation();
  }
}, { capture: true, passive: false });

canvas.addEventListener('mousedown', (e) => {
  if (checkPauseButtonHit(e.clientX, e.clientY)) {
    e.preventDefault();
    e.stopPropagation();
  }
}, { capture: true });

let currentScene = null;

function startTitle() {
  currentScene = new TitleScene(() => startGame());
}
function startGame() {
  currentScene = new GameScene((score, lives) => {
    // 스테이지 1 클리어 → 스테이지 2로 (게임오버면 lives=0)
    if (lives > 0) {
      startGame2(score, lives);
    } else {
      onGameOver(score);
    }
  });
}
function startGame2(score, lives) {
  currentScene = new Game2Scene(score, lives, (finalScore, remainLives) => {
    if (remainLives > 0) {
      startGame3(finalScore, remainLives);
    } else {
      onGameOver(finalScore);
    }
  });
}
function startGame3(score, lives) {
  currentScene = new Game3Scene(score, lives, (finalScore) => onGameOver(finalScore));
}
function onGameOver(score) {
  showNameModal(score);
}

// 모달 요소
const loadingEl = document.getElementById('loading');
const modalName = document.getElementById('modal-name');
const modalBoard = document.getElementById('modal-board');
const finalScoreEl = document.getElementById('final-score');
const playerNameEl = document.getElementById('player-name');
const submitBtn = document.getElementById('submit-score');
const skipBtn = document.getElementById('skip-score');
const boardListEl = document.getElementById('board-list');
const restartBtn = document.getElementById('board-restart');

function showNameModal(score) {
  finalScoreEl.textContent = score;
  modalName.classList.add('show');
  playerNameEl.value = localStorage.getItem('marine_blast_last_name') || '';
  setTimeout(() => playerNameEl.focus(), 100);
}

async function showLeaderboard(playerName) {
  modalName.classList.remove('show');
  modalBoard.classList.add('show');
  boardListEl.textContent = '로딩 중...';

  const scores = await getTopScores(10);
  if (!scores.length) {
    boardListEl.textContent = '아직 기록이 없습니다.';
    return;
  }
  boardListEl.innerHTML = '';
  scores.forEach((row, i) => {
    const div = document.createElement('div');
    div.className = 'row' + (row.name === playerName ? ' you' : '');
    div.innerHTML =
      `<span class="rank">${i + 1}.</span>` +
      `<span class="name">${escapeHtml(row.name)}</span>` +
      `<span class="score">${row.score}</span>`;
    boardListEl.appendChild(div);
  });
  if (!isRemoteEnabled()) {
    const note = document.createElement('div');
    note.style.cssText = 'text-align:center; color:#888; font-size:10px; margin-top:8px;';
    note.textContent = '※ 로컬 저장 (서버 미연결)';
    boardListEl.appendChild(note);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

submitBtn.addEventListener('click', async () => {
  const name = playerNameEl.value.trim() || 'Player';
  localStorage.setItem('marine_blast_last_name', name);
  submitBtn.disabled = true;
  submitBtn.textContent = '등록 중...';
  await submitScore(name, parseInt(finalScoreEl.textContent, 10));
  submitBtn.disabled = false;
  submitBtn.textContent = '기록 등록';
  await showLeaderboard(name);
});

skipBtn.addEventListener('click', () => {
  modalName.classList.remove('show');
  startTitle();
});

restartBtn.addEventListener('click', () => {
  modalBoard.classList.remove('show');
  startTitle();
});

// 고정 timestep 루프
let lastTime = 0;
let accumulator = 0;
let started = false;

function frame(now) {
  const realDt = Math.min(0.25, (now - lastTime) / 1000);
  lastTime = now;
  accumulator += realDt;

  while (accumulator >= FIXED_DT) {
    if (currentScene) currentScene.update(FIXED_DT, input);
    input.endFrame();
    accumulator -= FIXED_DT;
  }
  if (currentScene) currentScene.draw(ctx);
  requestAnimationFrame(frame);
}

// 에셋 로드 후 게임 시작
loadAssets((done, total) => {
  const pct = Math.floor((done / total) * 100);
  loadingEl.textContent = `LOADING... ${pct}%`;
}).then(() => {
  loadingEl.classList.add('hidden');
  startTitle();
  lastTime = performance.now();
  requestAnimationFrame(frame);
}).catch(err => {
  loadingEl.textContent = '에셋 로드 실패: ' + err.message;
  console.error(err);
});
