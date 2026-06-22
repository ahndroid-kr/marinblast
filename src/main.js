// 진입점. 캔버스 셋업, 고정 timestep 루프, 씬 전환, 리더보드 UI 연결.

import { W, H, FIXED_DT } from './config.js';
import { Input } from './input.js';
import { TitleScene } from './scenes/title.js';
import { GameScene } from './scenes/game.js';
import { submitScore, getTopScores, isRemoteEnabled } from './leaderboard.js';

// 캔버스 셋업 + 반응형 스케일
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
canvas.width = W;
canvas.height = H;
ctx.imageSmoothingEnabled = false;

function resize() {
  const sw = window.innerWidth;
  const sh = window.innerHeight;
  const scale = Math.max(1, Math.floor(Math.min(sw / W, sh / H)));
  // 가능한 가장 큰 정수배 스케일
  let s = scale;
  // 화면이 작아 정수배가 안 맞으면 분수 허용
  if (sw / W < 1 || sh / H < 1) s = Math.min(sw / W, sh / H);
  else s = Math.max(s, Math.min(sw / W, sh / H));
  const cssW = Math.floor(W * s);
  const cssH = Math.floor(H * s);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  document.getElementById('stage').style.width = cssW + 'px';
  document.getElementById('stage').style.height = cssH + 'px';
}
window.addEventListener('resize', resize);
resize();

const input = new Input(canvas);

// 씬 전환
let currentScene = null;

function startTitle() {
  currentScene = new TitleScene(() => startGame());
}
function startGame() {
  currentScene = new GameScene((score) => onGameOver(score));
}
function onGameOver(score) {
  showNameModal(score);
}

// 리더보드 모달
const modalName = document.getElementById('modal-name');
const modalBoard = document.getElementById('modal-board');
const finalScoreEl = document.getElementById('final-score');
const playerNameEl = document.getElementById('player-name');
const submitBtn = document.getElementById('submit-score');
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

  const scores = await getTopScores(20);
  if (!scores.length) {
    boardListEl.textContent = '아직 기록이 없습니다.';
    return;
  }
  boardListEl.innerHTML = '';
  scores.forEach((row, i) => {
    const div = document.createElement('div');
    div.className = 'row' + (row.name === playerName ? ' you' : '');
    div.innerHTML = `<span>${i + 1}. ${escapeHtml(row.name)}</span><span>${row.score}</span>`;
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

restartBtn.addEventListener('click', () => {
  modalBoard.classList.remove('show');
  startTitle();
});

// 고정 timestep 루프 - 최대 0.25초까지 누적 가능 (탭 전환 후 복귀 시 폭주 방지)
let lastTime = performance.now();
let accumulator = 0;

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

startTitle();
requestAnimationFrame((t) => { lastTime = t; frame(t); });
