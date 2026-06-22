// 메인 게임 씬. 스테이지 1을 실행한다.
// 풀, 충돌, 스폰 타임라인, 점수, 효과 적용을 모두 처리.

import { W, H, BULLET, POOL, PLAYER, STARFISH_COLORS, SHIELD_DURATION, OPTION } from '../config.js';
import { Pool } from '../pool.js';
import { Terrain } from '../terrain.js';
import { Parallax } from '../parallax.js';
import { makeBullet, updateBullet, drawBullet } from '../entities/bullet.js';
import { makePlayer, updatePlayer, tryFire, drawPlayer } from '../entities/player.js';
import { makeEnemy, resetEnemy, updateEnemy, drawEnemy } from '../entities/enemy.js';
import { makeStarfish, resetStarfish, updateStarfish, drawStarfish, hitStarfish, currentColor } from '../entities/powerup.js';
import { makeOption, resetOption, updateOption, drawOption } from '../entities/option.js';
import { makeParticle, updateParticle, drawParticle, explode } from '../entities/particle.js';
import { STAGE1 } from '../stages/stage1.js';

export class GameScene {
  constructor(onGameOver) {
    this.onGameOver = onGameOver;
    this.player = makePlayer();
    this.bullets = new Pool(makeBullet, BULLET.poolSize);
    this.enemyBullets = new Pool(makeBullet, POOL.enemyBullet);
    this.enemies = new Pool(makeEnemy, POOL.enemy);
    this.starfish = new Pool(makeStarfish, POOL.powerup);
    this.options = new Pool(makeOption, POOL.option);
    this.particles = new Pool(makeParticle, POOL.particle);

    this.terrain = new Terrain(STAGE1.terrain, STAGE1.terrain[STAGE1.terrain.length - 1].x);
    this.parallax = new Parallax();

    this.cameraX = 0;
    this.stageTime = 0;
    this.timelineCursor = 0;
    this.score = 0;
    this.lives = 3;
    this.bombs = 0;
    this.screenShake = 0;
    this.flashTime = 0;
    this.bombFlash = 0;
    this.gameOverDelay = 0;
    this.done = false;
    this.optionCount = 0;
    this.message = '';
    this.messageTime = 0;
  }

  showMessage(text, duration = 1.5) {
    this.message = text;
    this.messageTime = duration;
  }

  update(dt, input) {
    if (this.done) return;

    // 카메라 자동 스크롤
    this.cameraX += STAGE1.scrollSpeed * dt;
    this.stageTime += dt;

    // 타임라인 스폰
    while (this.timelineCursor < STAGE1.timeline.length &&
           STAGE1.timeline[this.timelineCursor].t <= this.stageTime) {
      const ev = STAGE1.timeline[this.timelineCursor];
      this._spawnEvent(ev);
      this.timelineCursor++;
    }

    // 플레이어
    updatePlayer(this.player, input, dt);
    tryFire(this.player, input, this.bullets, this.options.items);

    // 옵션 업데이트
    this.options.forEach(o => updateOption(o, this.player));

    // 탄
    this.bullets.forEach(b => updateBullet(b, dt));
    this.enemyBullets.forEach(b => updateBullet(b, dt));

    // 적
    this.enemies.forEach(e => updateEnemy(e, dt, this.player, this.enemyBullets));

    // 불가사리
    this.starfish.forEach(s => updateStarfish(s, dt));

    // 파티클
    this.particles.forEach(p => updateParticle(p, dt));

    // 충돌
    this._collisions();

    // 지형 충돌
    if (this.player.alive && this.player.invulnAfterHit <= 0 && this.player.shieldTime <= 0) {
      if (this.terrain.collides(this.cameraX + this.player.x, this.player.y, PLAYER.hitRadius)) {
        this._hitPlayer();
      }
    }
    // 적도 지형에 닿으면 사라짐 (시각적 정리)
    this.enemies.forEach(e => {
      if (this.terrain.collides(this.cameraX + e.x, e.y, e.radius * 0.7)) {
        e.active = false;
      }
    });

    // 화면 흔들기·플래시 감쇠
    if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 4);
    if (this.flashTime > 0) this.flashTime = Math.max(0, this.flashTime - dt * 2);
    if (this.bombFlash > 0) this.bombFlash = Math.max(0, this.bombFlash - dt * 1.5);
    if (this.messageTime > 0) this.messageTime -= dt;

    // 게임오버 처리
    if (!this.player.alive) {
      this.gameOverDelay += dt;
      if (this.gameOverDelay > 1.5) {
        this.done = true;
        this.onGameOver(this.score);
      }
    }

    // 스테이지 클리어 (프로토타입에선 잡몹 구간 끝나면 종료)
    // 보스가 아직 없으니 일단 클리어 처리 후 게임오버 플로우로 진입
    if (this.stageTime > STAGE1.duration && this.player.alive) {
      this.score += 10000;
      this.player.alive = false;
      this.showMessage('STAGE CLEAR! BOSS COMING SOON...', 2.0);
      this.gameOverDelay = 0;
    }
  }

  _spawnEvent(ev) {
    const xSpawn = W + 10; // 화면 오른쪽 밖에서 등장
    for (const y of ev.ys) {
      const e = this.enemies.spawn();
      if (e) resetEnemy(e, ev.kind, xSpawn, y);
    }
  }

  _collisions() {
    const p = this.player;

    // 플레이어 탄 ↔ 적
    this.bullets.forEach(b => {
      if (!b.active) return;
      this.enemies.forEach(e => {
        if (!e.active) return;
        const dx = b.x - e.x, dy = b.y - e.y;
        if (dx * dx + dy * dy <= (e.radius + BULLET.radius) ** 2) {
          b.active = false;
          e.hp -= 1;
          if (e.hp <= 0) {
            e.active = false;
            this.score += e.points;
            explode(this.particles, e.x, e.y, '#ffcc66', 6);
            // 불가사리 드랍
            if (Math.random() < e.dropChance) {
              const s = this.starfish.spawn();
              if (s) resetStarfish(s, e.x, e.y);
            }
          } else {
            explode(this.particles, b.x, b.y, '#fff', 3);
          }
        }
      });

      // 플레이어 탄 ↔ 불가사리 (색 바꿈)
      this.starfish.forEach(s => {
        if (!s.active) return;
        const dx = b.x - s.x, dy = b.y - s.y;
        if (dx * dx + dy * dy <= (6 + BULLET.radius) ** 2) {
          b.active = false;
          hitStarfish(s);
          explode(this.particles, s.x, s.y, '#ffffff', 3);
        }
      });
    });

    // 적탄 ↔ 플레이어
    if (p.alive && p.invulnAfterHit <= 0) {
      this.enemyBullets.forEach(b => {
        if (!b.active) return;
        const dx = b.x - p.x, dy = b.y - p.y;
        if (dx * dx + dy * dy <= (PLAYER.hitRadius + BULLET.radius) ** 2) {
          b.active = false;
          if (p.shieldTime <= 0) this._hitPlayer();
          else explode(this.particles, b.x, b.y, '#88ccff', 4);
        }
      });
    }

    // 적 ↔ 플레이어 (몸통박치기)
    if (p.alive && p.invulnAfterHit <= 0 && p.shieldTime <= 0) {
      this.enemies.forEach(e => {
        if (!e.active) return;
        const dx = e.x - p.x, dy = e.y - p.y;
        if (dx * dx + dy * dy <= (e.radius + PLAYER.hitRadius) ** 2) {
          e.active = false;
          explode(this.particles, e.x, e.y, '#ffcc66', 5);
          this._hitPlayer();
        }
      });
    }

    // 플레이어 ↔ 불가사리 (먹기)
    if (p.alive) {
      this.starfish.forEach(s => {
        if (!s.active) return;
        const dx = s.x - p.x, dy = s.y - p.y;
        if (dx * dx + dy * dy <= (7 + PLAYER.hitRadius) ** 2) {
          s.active = false;
          this._applyStarfishEffect(currentColor(s));
        }
      });
    }
  }

  _hitPlayer() {
    this.lives -= 1;
    this.screenShake = 1.0;
    this.flashTime = 1.0;
    explode(this.particles, this.player.x, this.player.y, '#ff6060', 16);
    this.player.invulnAfterHit = 1.5;
    // 파워다운
    this.player.power = 0;
    // 옵션 제거
    this.options.clear();
    this.optionCount = 0;
    if (this.lives <= 0) {
      this.player.alive = false;
      this.gameOverDelay = 0;
    }
  }

  _applyStarfishEffect(color) {
    switch (color) {
      case 'pink':
        this.score += 1000;
        this.showMessage('+1000');
        break;
      case 'red':
        this.player.power = 1;
        this.showMessage('POWER UP');
        break;
      case 'yellow': {
        if (this.optionCount < OPTION.maxCount) {
          const o = this.options.spawn();
          if (o) {
            resetOption(o, this.optionCount);
            this.optionCount++;
            this.showMessage('OPTION');
          }
        } else {
          this.score += 500;
          this.showMessage('OPTION MAX +500');
        }
        break;
      }
      case 'blue':
        this.player.shieldTime = SHIELD_DURATION;
        this.showMessage('SHIELD');
        break;
      case 'green':
        // 폭탄: 화면 내 모든 적 제거
        this.bombFlash = 1.0;
        this.enemies.forEach(e => {
          this.score += e.points;
          explode(this.particles, e.x, e.y, '#80ff80', 4);
          e.active = false;
        });
        this.enemyBullets.clear();
        this.showMessage('BOMB!');
        break;
    }
  }

  draw(ctx) {
    // 화면 흔들기
    const sx = (this.screenShake > 0) ? (Math.random() - 0.5) * 4 * this.screenShake : 0;
    const sy = (this.screenShake > 0) ? (Math.random() - 0.5) * 4 * this.screenShake : 0;
    ctx.save();
    ctx.translate(sx, sy);

    this.parallax.draw(ctx, this.cameraX, this.stageTime);
    this.terrain.draw(ctx, this.cameraX);

    // 적
    this.enemies.forEach(e => drawEnemy(ctx, e));
    // 불가사리
    this.starfish.forEach(s => drawStarfish(ctx, s));
    // 옵션
    this.options.forEach(o => drawOption(ctx, o));
    // 플레이어
    drawPlayer(ctx, this.player);
    // 탄
    this.bullets.forEach(b => drawBullet(ctx, b));
    this.enemyBullets.forEach(b => drawBullet(ctx, b));
    // 파티클
    this.particles.forEach(p => drawParticle(ctx, p));

    // 피격 플래시
    if (this.flashTime > 0) {
      ctx.fillStyle = `rgba(255, 60, 60, ${this.flashTime * 0.4})`;
      ctx.fillRect(0, 0, W, H);
    }
    // 봄 플래시
    if (this.bombFlash > 0) {
      ctx.fillStyle = `rgba(180, 255, 180, ${this.bombFlash * 0.6})`;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.restore();

    // HUD (흔들기 영향 안 받음)
    this._drawHUD(ctx);

    // 메시지
    if (this.messageTime > 0) {
      ctx.font = '10px "Courier New", monospace';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(this.message, W / 2, H / 2);
      ctx.textAlign = 'left';
    }
  }

  _drawHUD(ctx) {
    ctx.font = '8px "Courier New", monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(`SCORE  ${String(this.score).padStart(6, '0')}`, 4, 10);
    ctx.fillText(`LIFE   ${this.lives}`, 4, 20);
    ctx.fillText(`STAGE 1  ${this.stageTime.toFixed(1)}s`, W - 100, 10);
    if (this.player.power >= 1) {
      ctx.fillStyle = '#ff6060';
      ctx.fillText('PWR', W - 100, 20);
    }
    if (this.player.shieldTime > 0) {
      ctx.fillStyle = '#60aaff';
      ctx.fillText(`SHIELD ${this.player.shieldTime.toFixed(1)}`, W - 60, 20);
    }
  }
}
