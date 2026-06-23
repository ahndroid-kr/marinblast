// 메인 게임 씬. 잡몹 구간 → 보스 등장 → 클리어.
import { W, H, BULLET, POOL, PLAYER, SHIELD_DURATION, POWER_DURATION, OPTION_DRAW, QA_MODE } from '../config.js';
import { Pool } from '../pool.js';
import { Terrain } from '../terrain.js';
import { Parallax } from '../parallax.js';
import { makeBullet, updateBullet, drawBullet } from '../entities/bullet.js';
import { makePlayer, updatePlayer, tryFire, drawPlayer } from '../entities/player.js';
import { makeEnemy, resetEnemy, updateEnemy, drawEnemy } from '../entities/enemy.js';
import { makeStarfish, resetStarfish, updateStarfish, drawStarfish, hitStarfish, currentColor } from '../entities/powerup.js';
import { makeOption, resetOption, updateOption, drawOption } from '../entities/option.js';
import { makeParticle, updateParticle, drawParticle, explodeSmall, explodeBig } from '../entities/particle.js';
import { makeLifeItem, resetLifeItem, updateLifeItem, drawLifeItem } from '../entities/lifeitem.js';
import { makeBoss, spawnBoss, updateBoss, drawBoss, damageBoss } from '../entities/boss.js';
import { STAGE1 } from '../stages/stage1.js';
import { audio } from '../audio.js';

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
    this.lifeItems = new Pool(makeLifeItem, 3);
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
    this._audioStarted = false;
  }

  showMessage(text, duration = 1.5) {
    this.message = text;
    this.messageTime = duration;
  }

  update(dt, input) {
    if (this.done) return;

    // 일시정지 토글 (사망/클리어 중에는 토글 불가)
    // 첫 프레임에 BGM 재시도 (타이틀에서 autoplay 실패 대비)
    if (!this._audioStarted) { this._audioStarted = true; audio.play('main'); }
    if (input.pauseEdge && this.player.alive && this.phase !== PHASE_CLEAR) {
      this.paused = !this.paused;
      if (this.paused) audio.pause();
      else audio.resume();
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
        audio.play('boss');
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

    // 라이프 아이템
    this.lifeItems.forEach(item => updateLifeItem(item, dt));
    if (this.player.alive) {
      this.lifeItems.forEach(item => {
        if (!item.active) return;
        const dx = item.x - this.player.x, dy = item.y - this.player.y;
        if (dx*dx + dy*dy <= (12 + PLAYER.hitRadius)**2) {
          item.active = false;
          this.lives += 1;
          this.showMessage('EXTRA LIFE!', 1.5);
          explodeSmall(this.particles, item.x, item.y, '#cc44aa');
        }
      });
    }

    // 보스
    if (this.phase === PHASE_BOSS || this.boss.dying > 0) {
      updateBoss(this.boss, dt, this.player, this.enemyBullets, this.particles);
      if (!this.boss.active && this.phase === PHASE_BOSS) {
        this.phase = PHASE_CLEAR;
        this.score += this.boss.points;
        this.clearTimer = 3.0;
        this.showMessage('STAGE CLEAR!', 3.0);
        audio.play('main');
        // 라이프 아이템 드랍
        const li = this.lifeItems.spawn();
        if (li) resetLifeItem(li, this.boss.x, this.boss.y);
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
        this.onGameOver(this.score, 0); // lives=0 → 게임오버
      }
    }

    // 클리어 후 스테이지 2로
    if (this.phase === PHASE_CLEAR) {
      this.clearTimer -= dt;
      if (this.clearTimer <= 0) {
        this.done = true;
        this.onGameOver(this.score, this.lives); // lives 넘겨서 스테이지 2 이어서 플레이
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
          if (p.shieldTime <= 0) {
            this._hitPlayer();
          } else {
            // 실드가 공격 1회 흡수 후 소멸
            p.shieldTime = 0;
            explodeSmall(this.particles, b.x, b.y, '#88ccff');
            this.showMessage('SHIELD BREAK!', 0.8);
          }
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
    this.player.powerTime = 0;
    this.player.shieldTime = 0;  // 피격 시 실드도 사라짐
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
        this.player.powerTime += POWER_DURATION;
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
        // 누적 연장 (덮어쓰기 X)
        this.player.shieldTime += SHIELD_DURATION;
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
    this.lifeItems.forEach(item => drawLifeItem(ctx, item));
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
      ctx.fillStyle = 'rgba(0, 12, 28, 0.75)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
      ctx.font = 'bold 20px "Courier New", monospace';
      ctx.fillStyle = '#80e0ff';
      ctx.strokeText('PAUSED', W/2, H/2 - 36);
      ctx.fillText('PAUSED', W/2, H/2 - 36);
      const bgmLabel = audio.isMuted() ? '[  BGM : OFF ]' : '[  BGM : ON  ]';
      ctx.font = '11px "Courier New", monospace';
      ctx.fillStyle = audio.isMuted() ? '#888' : '#ffe060';
      ctx.strokeText(bgmLabel, W/2, H/2 + 2);
      ctx.fillText(bgmLabel, W/2, H/2 + 2);
      this._bgmBtn = { x: W/2 - 58, y: H/2 - 14, w: 116, h: 22 };
      ctx.fillStyle = '#80ff80';
      ctx.strokeText('[ RESUME ]', W/2, H/2 + 30);
      ctx.fillText('[ RESUME ]', W/2, H/2 + 30);
      ctx.font = '7px "Courier New", monospace';
      ctx.fillStyle = '#668899';
      ctx.fillText('tap BGM to toggle  /  P or ESC to resume', W/2, H/2 + 50);
      ctx.textAlign = 'left';
    }
  }

  _drawPauseButton(ctx) {
    const bx = 5, by = 4, bw = 16, bh = 16;
    this._pauseBtn = { x: bx, y: by, w: bw, h: bh };
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = '#fff';
    if (this.paused) {
      ctx.beginPath();
      ctx.moveTo(bx + 5, by + 4);
      ctx.lineTo(bx + 12, by + 8);
      ctx.lineTo(bx + 5, by + 12);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(bx + 5, by + 4, 2, 8);
      ctx.fillRect(bx + 9, by + 4, 2, 8);
    }
  }

  hitResumeButton(cx, cy) {
    if (!this.paused) return false;
    return cx >= W/2 - 55 && cx <= W/2 + 55 && cy >= H/2 + 18 && cy <= H/2 + 42;
  }
  hitBgmButton(cx, cy) {
    const b = this._bgmBtn;
    return b && this.paused && cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h;
  }

  hitPauseButton(cx, cy) {
    const b = this._pauseBtn;
    if (!b) return false;
    return cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h;
  }

  _drawHUD(ctx) {
    // HUD 배경 (가독성)
    ctx.fillStyle = 'rgba(0, 16, 32, 0.55)';
    ctx.fillRect(0, 0, W, 32);

    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    const drawText = (s, x, y) => { ctx.strokeText(s, x, y); ctx.fillText(s, x, y); };

    // 좌측: SCORE / LIFE (일시정지 버튼 옆)
    drawText(`SCORE ${String(this.score).padStart(6, '0')}`, 26, 13);

    // LIFE — 텍스트 + 하트 (세로 중앙 정렬)
    const lifeY = 25; // 텍스트 베이스라인
    drawText('LIFE', 26, lifeY);
    // 하트 중심 y를 텍스트 시각 중앙에 맞춤 (11px 폰트의 중심은 약 y-3)
    this._drawHearts(ctx, 60, lifeY - 4, this.lives);

    // 우측: STAGE / PWR / SHIELD (textAlign right)
    ctx.textAlign = 'right';
    drawText('STAGE 1', W - 6, 13);
    // 효과 표시
    const effectParts = [];
    if (this.player.power >= 1 && this.player.powerTime > 0) {
      effectParts.push({ text: 'PWR', color: '#ff8080' });
    }
    if (this.player.shieldTime > 0) {
      effectParts.push({ text: 'SHIELD', color: '#80ccff' });
    }
    let rightX = W - 6;
    for (const part of effectParts) {
      ctx.fillStyle = part.color;
      drawText(part.text, rightX, 25);
      rightX -= ctx.measureText(part.text).width + 10;
      ctx.fillStyle = '#fff';
    }
    ctx.textAlign = 'left';
  }

_drawHearts(ctx, x, yCenter, count) {
  const visible = Math.min(count, 5);

  for (let i = 0; i < visible; i++) {
    this._drawHeart(ctx, x + i * 11, yCenter, 8, '#ff5070');
  }

  if (count > 5) {
    ctx.fillStyle = '#fff';
    ctx.fillText(`+${count - 5}`, x + visible * 11 + 4, yCenter + 4);
  }
}
  _drawHeart(ctx, cx, cy, size, color) {
    ctx.fillStyle = color;
    const s = size / 8;
    const pattern = [
      [0,1,1,0,0,1,1,0],
      [1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,0],
      [0,0,1,1,1,1,0,0],
      [0,0,0,1,1,0,0,0],
    ];
    const offsetX = -size / 2;
    const offsetY = -(pattern.length * s) / 2;
    for (let py = 0; py < pattern.length; py++) {
      for (let px = 0; px < pattern[py].length; px++) {
        if (pattern[py][px]) {
          ctx.fillRect(cx + px * s + offsetX, cy + py * s + offsetY, s, s);
        }
      }
    }
  }
}
