// 메인 게임 씬. 잡몹 구간 → 보스 등장 → 클리어.
import { W, H, BULLET, POOL, PLAYER, SHIELD_DURATION, OPTION_DRAW } from '../config.js';
import { Pool } from '../pool.js';
import { Terrain } from '../terrain.js';
import { Parallax } from '../parallax.js';
import { makeBullet, updateBullet, drawBullet } from '../entities/bullet.js';
import { makePlayer, updatePlayer, tryFire, drawPlayer } from '../entities/player.js';
import { makeEnemy, resetEnemy, updateEnemy, drawEnemy } from '../entities/enemy.js';
import { makeStarfish, resetStarfish, updateStarfish, drawStarfish, hitStarfish, currentColor } from '../entities/powerup.js';
import { makeOption, resetOption, updateOption, drawOption } from '../entities/option.js';
import { makeParticle, updateParticle, drawParticle, explodeSmall, explodeBig } from '../entities/particle.js';
import { makeBoss, spawnBoss, updateBoss, drawBoss, damageBoss } from '../entities/boss.js';
import { STAGE1 } from '../stages/stage1.js';

const PHASE_MOB = 'mob';
const PHASE_BOSS_WARN = 'boss_warn';
const PHASE_BOSS = 'boss';
const PHASE_CLEAR = 'clear';

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
    this.boss = makeBoss();

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
    this.phase = PHASE_MOB;
    this.bossWarnTimer = 0;
    this.clearTimer = 0;
    this.paused = false;
  }

  showMessage(text, duration = 1.5) {
    this.message = text;
    this.messageTime = duration;
  }

  update(dt, input) {
    if (this.done) return;

    // 일시정지 토글 (사망/클리어 중에는 토글 불가)
    if (input.pauseEdge && this.player.alive && this.phase !== PHASE_CLEAR) {
      this.paused = !this.paused;
    }
    if (this.paused) return;

    // 카메라 스크롤 (보스 페이즈에서는 정지)
    if (this.phase === PHASE_MOB || this.phase === PHASE_BOSS_WARN) {
      this.cameraX += STAGE1.scrollSpeed * dt;
    }
    this.stageTime += dt;

    // 페이즈 전환
    if (this.phase === PHASE_MOB && this.stageTime >= STAGE1.mobDuration) {
      this.phase = PHASE_BOSS_WARN;
      this.bossWarnTimer = STAGE1.bossWarnTime;
      this.showMessage('!! WARNING !!', STAGE1.bossWarnTime);
    }
    if (this.phase === PHASE_BOSS_WARN) {
      this.bossWarnTimer -= dt;
      if (this.bossWarnTimer <= 0) {
        this.phase = PHASE_BOSS;
        spawnBoss(this.boss);
      }
    }

    // 잡몹 타임라인 스폰 (잡몹 페이즈에서만)
    if (this.phase === PHASE_MOB) {
      while (this.timelineCursor < STAGE1.timeline.length &&
             STAGE1.timeline[this.timelineCursor].t <= this.stageTime) {
        const ev = STAGE1.timeline[this.timelineCursor];
        this._spawnEvent(ev);
        this.timelineCursor++;
      }
    }

    // 플레이어
    updatePlayer(this.player, input, dt);
    tryFire(this.player, input, this.bullets, this.options.items);
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

    // 보스
    if (this.phase === PHASE_BOSS || this.boss.dying > 0) {
      updateBoss(this.boss, dt, this.player, this.enemyBullets, this.particles);
      // 보스 사망 처리
      if (!this.boss.active && this.phase === PHASE_BOSS) {
        this.phase = PHASE_CLEAR;
        this.score += this.boss.points;
        this.clearTimer = 3.0;
        this.showMessage('STAGE CLEAR!', 3.0);
      }
    }

    // 충돌
    this._collisions();

    // 지형 충돌 (보스전에서도 천장/바닥은 유효)
    if (this.player.alive && this.player.invulnAfterHit <= 0 && this.player.shieldTime <= 0) {
      if (this.terrain.collides(this.cameraX + this.player.x, this.player.y, PLAYER.hitRadius)) {
        this._hitPlayer();
      }
    }
    this.enemies.forEach(e => {
      if (this.terrain.collides(this.cameraX + e.x, e.y, e.radius * 0.7)) {
        e.active = false;
      }
    });

    // 화면 효과 감쇠
    if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 4);
    if (this.flashTime > 0) this.flashTime = Math.max(0, this.flashTime - dt * 2);
    if (this.bombFlash > 0) this.bombFlash = Math.max(0, this.bombFlash - dt * 1.5);
    if (this.messageTime > 0) this.messageTime -= dt;

    // 게임오버
    if (!this.player.alive) {
      this.gameOverDelay += dt;
      if (this.gameOverDelay > 1.8) {
        this.done = true;
        this.onGameOver(this.score);
      }
    }

    // 클리어 후 점수 등록 화면으로
    if (this.phase === PHASE_CLEAR) {
      this.clearTimer -= dt;
      if (this.clearTimer <= 0) {
        this.done = true;
        this.onGameOver(this.score);
      }
    }
  }

  _spawnEvent(ev) {
    const xSpawn = W + 50; // 더 멀리서 등장 (화면 가장자리에 갑자기 나타나는 것 방지)
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
            explodeSmall(this.particles, e.x, e.y, '#ffcc66');
            if (Math.random() < e.dropChance) {
              const s = this.starfish.spawn();
              if (s) resetStarfish(s, e.x, e.y);
            }
          }
        }
      });

      // 플레이어 탄 ↔ 보스
      if (this.boss.active && this.boss.dying <= 0 && this.boss.intro <= 0) {
        const dx = b.x - this.boss.x, dy = b.y - this.boss.y;
        if (dx * dx + dy * dy <= (this.boss.hitRadius + BULLET.radius) ** 2) {
          b.active = false;
          const died = damageBoss(this.boss, 1, this.particles);
          if (died) {
            this.score += this.boss.points;
            explodeBig(this.particles, this.boss.x, this.boss.y);
            this.screenShake = 1.5;
          } else {
            // 작은 피격 이펙트
            const part = this.particles.spawn();
            if (part) {
              part.x = b.x; part.y = b.y; part.vx = 0; part.vy = 0;
              part.color = '#fff'; part.life = 0.2; part.maxLife = 0.2;
              part.size = 8; part.kind = 'sparkle';
            }
          }
        }
      }

      // 플레이어 탄 ↔ 불가사리 (색 바꿈)
      this.starfish.forEach(s => {
        if (!s.active) return;
        const dx = b.x - s.x, dy = b.y - s.y;
        if (dx * dx + dy * dy <= (8 + BULLET.radius) ** 2) {
          b.active = false;
          hitStarfish(s);
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
          else explodeSmall(this.particles, b.x, b.y, '#88ccff');
        }
      });
    }

    // 적 ↔ 플레이어
    if (p.alive && p.invulnAfterHit <= 0 && p.shieldTime <= 0) {
      this.enemies.forEach(e => {
        if (!e.active) return;
        const dx = e.x - p.x, dy = e.y - p.y;
        if (dx * dx + dy * dy <= (e.radius + PLAYER.hitRadius) ** 2) {
          e.active = false;
          explodeSmall(this.particles, e.x, e.y, '#ffcc66');
          this._hitPlayer();
        }
      });
      // 보스 본체와의 접촉
      if (this.boss.active && this.boss.dying <= 0 && this.boss.intro <= 0) {
        const dx = this.boss.x - p.x, dy = this.boss.y - p.y;
        if (dx * dx + dy * dy <= (this.boss.hitRadius + PLAYER.hitRadius) ** 2) {
          this._hitPlayer();
        }
      }
    }

    // 플레이어 ↔ 불가사리 (먹기)
    if (p.alive) {
      this.starfish.forEach(s => {
        if (!s.active) return;
        const dx = s.x - p.x, dy = s.y - p.y;
        if (dx * dx + dy * dy <= (9 + PLAYER.hitRadius) ** 2) {
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
    explodeSmall(this.particles, this.player.x, this.player.y, '#ff6060');
    this.player.invulnAfterHit = 1.8;
    this.player.power = 0;
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
        this.showMessage('+1000', 1.0);
        break;
      case 'red':
        this.player.power = 1;
        this.showMessage('POWER UP', 1.0);
        break;
      case 'yellow': {
        if (this.optionCount < OPTION_DRAW.maxCount) {
          const o = this.options.spawn();
          if (o) {
            resetOption(o, this.optionCount);
            this.optionCount++;
            this.showMessage('OPTION', 1.0);
          }
        } else {
          this.score += 500;
          this.showMessage('OPTION MAX +500', 1.0);
        }
        break;
      }
      case 'blue':
        this.player.shieldTime = SHIELD_DURATION;
        this.showMessage('SHIELD', 1.0);
        break;
      case 'green':
        this.bombFlash = 1.0;
        this.enemies.forEach(e => {
          this.score += e.points;
          explodeSmall(this.particles, e.x, e.y, '#80ff80');
          e.active = false;
        });
        this.enemyBullets.clear();
        // 보스에게도 데미지
        if (this.boss.active && this.boss.dying <= 0) {
          const died = damageBoss(this.boss, 10, this.particles);
          if (died) {
            this.score += this.boss.points;
            explodeBig(this.particles, this.boss.x, this.boss.y);
          }
        }
        this.showMessage('BOMB!', 1.0);
        break;
    }
  }

  draw(ctx) {
    const sx = (this.screenShake > 0) ? (Math.random() - 0.5) * 4 * this.screenShake : 0;
    const sy = (this.screenShake > 0) ? (Math.random() - 0.5) * 4 * this.screenShake : 0;
    ctx.save();
    ctx.translate(sx, sy);

    this.parallax.draw(ctx, this.cameraX, this.stageTime);
    this.terrain.draw(ctx, this.cameraX);

    // 보스 (적 뒤에)
    drawBoss(ctx, this.boss);

    this.enemies.forEach(e => drawEnemy(ctx, e));
    this.starfish.forEach(s => drawStarfish(ctx, s));
    this.options.forEach(o => drawOption(ctx, o));
    drawPlayer(ctx, this.player);
    this.bullets.forEach(b => drawBullet(ctx, b));
    this.enemyBullets.forEach(b => drawBullet(ctx, b));
    this.particles.forEach(p => drawParticle(ctx, p));

    if (this.flashTime > 0) {
      ctx.fillStyle = `rgba(255, 60, 60, ${this.flashTime * 0.4})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (this.bombFlash > 0) {
      ctx.fillStyle = `rgba(180, 255, 180, ${this.bombFlash * 0.6})`;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.restore();

    this._drawHUD(ctx);

    // 일시정지 버튼 (우측 상단)
    this._drawPauseButton(ctx);

    if (this.messageTime > 0) {
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.fillStyle = this.phase === PHASE_BOSS_WARN ? '#ff4040' : '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.strokeText(this.message, W / 2, H / 2);
      ctx.fillText(this.message, W / 2, H / 2);
      ctx.textAlign = 'left';
    }

    // 일시정지 오버레이
    if (this.paused) {
      ctx.fillStyle = 'rgba(0, 12, 28, 0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.font = 'bold 28px "Courier New", monospace';
      ctx.fillStyle = '#80e0ff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.textAlign = 'center';
      ctx.strokeText('PAUSED', W / 2, H / 2);
      ctx.fillText('PAUSED', W / 2, H / 2);
      ctx.font = '10px "Courier New", monospace';
      ctx.fillStyle = '#fff';
      ctx.strokeText('P / ESC / TAP TO RESUME', W / 2, H / 2 + 24);
      ctx.fillText('P / ESC / TAP TO RESUME', W / 2, H / 2 + 24);
      ctx.textAlign = 'left';
    }
  }

  // 우측 상단 일시정지 아이콘 (탭하면 일시정지)
  _drawPauseButton(ctx) {
    // 화면 우측 상단에 작은 II 아이콘
    const bx = W - 18, by = 4, bw = 14, bh = 14;
    // 영역 저장 (탭 감지용)
    this._pauseBtn = { x: bx, y: by, w: bw, h: bh };
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);
    // 일시정지 또는 재생 아이콘
    ctx.fillStyle = '#fff';
    if (this.paused) {
      // 재생 삼각형
      ctx.beginPath();
      ctx.moveTo(bx + 4, by + 3);
      ctx.lineTo(bx + 11, by + 7);
      ctx.lineTo(bx + 4, by + 11);
      ctx.closePath();
      ctx.fill();
    } else {
      // 일시정지 || 두 줄
      ctx.fillRect(bx + 4, by + 3, 2, 8);
      ctx.fillRect(bx + 8, by + 3, 2, 8);
    }
  }

  // 캔버스 좌표(터치)가 일시정지 버튼 위에 있는지
  hitPauseButton(cx, cy) {
    const b = this._pauseBtn;
    if (!b) return false;
    return cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h;
  }

  _drawHUD(ctx) {
    // HUD 배경 (가독성)
    ctx.fillStyle = 'rgba(0, 16, 32, 0.55)';
    ctx.fillRect(0, 0, W, 30);

    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    const drawText = (s, x, y) => { ctx.strokeText(s, x, y); ctx.fillText(s, x, y); };

    // SCORE
    drawText(`SCORE ${String(this.score).padStart(6, '0')}`, 6, 13);

    // LIFE — 하트 아이콘으로
    drawText('LIFE', 6, 25);
    this._drawHearts(ctx, 42, 18, this.lives);

    // STAGE
    ctx.textAlign = 'right';
    drawText('STAGE 1', W - 6, 13);

    // 파워업 상태
    if (this.player.power >= 1) {
      ctx.fillStyle = '#ff8080';
      drawText('PWR', W - 6, 25);
      ctx.fillStyle = '#fff';
    }
    if (this.player.shieldTime > 0) {
      ctx.fillStyle = '#80ccff';
      drawText(`SHIELD ${this.player.shieldTime.toFixed(1)}`, W - 50, 25);
      ctx.fillStyle = '#fff';
    }
    ctx.textAlign = 'left';
  }

  _drawHearts(ctx, x, y, count) {
    for (let i = 0; i < count; i++) {
      this._drawHeart(ctx, x + i * 12, y, 8, '#ff5070');
    }
  }

  _drawHeart(ctx, cx, cy, size, color) {
    // 픽셀풍 하트 — 작은 사각형 조합
    ctx.fillStyle = color;
    const s = size / 8;
    // 8x7 픽셀 하트 패턴
    const pattern = [
      [0,1,1,0,0,1,1,0],
      [1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,0],
      [0,0,1,1,1,1,0,0],
      [0,0,0,1,1,0,0,0],
    ];
    for (let py = 0; py < pattern.length; py++) {
      for (let px = 0; px < pattern[py].length; px++) {
        if (pattern[py][px]) {
          ctx.fillRect(cx + px * s - size/2, cy + py * s - size/2, s, s);
        }
      }
    }
  }
}
