// 키보드 + 터치 드래그 통합 입력.
// 키보드: WASD / 방향키 + Z(발사) + X(폭탄 수동, 디버그용)
// 터치: 화면 어디든 드래그하면 비행기가 손가락 위치로 부드럽게 추적. 발사는 자동.

import { W, H } from './config.js';

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.fire = false;       // 자동/수동 통합 발사 플래그
    this.bomb = false;       // 디버그용
    this.touchActive = false;
    this.touchTarget = { x: 0, y: 0 }; // 캔버스 내부 좌표
    this.anyKeyEdge = false;

    this._bindKeys();
    this._bindTouch();
  }

  _bindKeys() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'KeyZ' || e.code === 'Space') this.fire = true;
      if (e.code === 'KeyX') this.bomb = true;
      this.anyKeyEdge = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
        e.preventDefault();
      }
    }, { passive: false });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      if (e.code === 'KeyZ' || e.code === 'Space') this.fire = false;
    });
  }

  _bindTouch() {
    const setPos = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * W;
      const y = ((clientY - rect.top) / rect.height) * H;
      this.touchTarget.x = Math.max(0, Math.min(W, x));
      this.touchTarget.y = Math.max(0, Math.min(H, y));
    };

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      setPos(t.clientX, t.clientY);
      this.touchActive = true;
      this.fire = true;
      this.anyKeyEdge = true;
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      setPos(t.clientX, t.clientY);
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.touchActive = false;
      this.fire = false;
    }, { passive: false });

    // 마우스로도 디버그 가능
    this.canvas.addEventListener('mousedown', (e) => {
      setPos(e.clientX, e.clientY);
      this.touchActive = true;
      this.fire = true;
      this.anyKeyEdge = true;
    });
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.touchActive) setPos(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', () => {
      this.touchActive = false;
      this.fire = false;
    });
  }

  // 매 프레임 후 호출하여 edge 플래그 리셋
  endFrame() {
    this.anyKeyEdge = false;
    this.bomb = false;
  }

  // 키보드 방향 입력 (-1, 0, 1)
  axisX() {
    let x = 0;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) x -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) x += 1;
    return x;
  }
  axisY() {
    let y = 0;
    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) y -= 1;
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) y += 1;
    return y;
  }
}
