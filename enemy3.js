// 스테이지 2 씬 — 구조는 game.js와 동일, 적/보스만 교체
import { W, H, BULLET, POOL, PLAYER, SHIELD_DURATION, POWER_DURATION, OPTION_DRAW, QA_MODE } from '../config.js';
import { Pool } from '../pool.js';
import { Terrain } from '../terrain.js';
import { Parallax } from '../parallax.js';
import { makeBullet, updateBullet, drawBullet } from '../entities/bullet.js';
import { makePlayer, updatePlayer, tryFire, drawPlayer } from '../entities/player.js';
import { makeEnemy2, resetEnemy2, updateEnemy2, drawEnemy2, canDamageEnemy2 } from '../entities/enemy2.js';
import { makeStarfish, resetStarfish, updateStarfish, drawStarfish, hitStarfish, currentColor } from '../entities/powerup.js';
import { makeOption, resetOption, updateOption, drawOption } from '../entities/option.js';
import { makeParticle, updateParticle, drawParticle, explodeSmall, explodeBig } from '../entities/particle.js';
import { makeLifeItem, resetLifeItem, updateLifeItem, drawLifeItem } from '../entities/lifeitem.js';
import { makeBossShark, spawnBossShark, updateBossShark, drawBossShark, damageBossShark } from '../entities/boss_shark.js';
import { STAGE2 } from '../stages/stage2.js';
import { audio } from '../audio.js';

const PHASE_MOB = 'mob';
const PHASE_BOSS_WARN = 'boss_warn';
const PHASE_BOSS = 'boss';
const PHASE_CLEAR = 'clear';

export class Game2Scene {
  constructor(score, lives, onGameOver) {
    this.onGameOver = onGameOver;
    this.player = makePlayer();
    // 스테이지 1에서 이어온 점수/라이프 반영
    this.score = score || 0;
    this.lives = lives || 3;

    this.bullets = new Pool(makeBullet, BULLET.poolSize);
    this.enemyBullets = new Pool(makeBullet, POOL.enemyBullet);
    this.enemies = new Pool(makeEnemy2, POOL.enemy);
    this.starfish = new Pool(makeStarfish, POOL.powerup);
    this.options = new Pool(makeOption, POOL.option);
    this.particles = new Pool(makeParticle, POOL.particle);
    this.lifeItems = new Pool(makeLifeItem, 3);
    this.boss = makeBossShark();

    this.terrain = new Terrain(STAGE2.terrain, STAGE2.terrain[STAGE2.terrain.length-1].x);
    this.parallax = new Parallax();

    this.cameraX = 0;
    this.stageTime = 0;
    this.timelineCursor = 0;
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
    this._pauseBtn = null;
  }

  showMessage(text, duration = 1.5) {
    this.message = text;
    this.messageTime = duration;
  }

  update(dt, input) {
    if (this.done) return;
    // 첫 프레임에 BGM 재시도 (타이틀에서 autoplay 실패 대비)
    if (!this._audioStarted) { this._audioStarted = true; audio.play('main'); }
    if (input.pauseEdge && this.player.alive && this.phase !== PHASE_CLEAR) {
      this.paused = !this.paused;
      if (this.paused) audio.pause();
      else audio.resume();
    }
    if (this.paused) return;

    if (this.phase === PHASE_MOB || this.phase === PHASE_BOSS_WARN) {
      this.cameraX += STAGE2.scrollSpeed * dt;
    }
    this.stageTime += dt;

    if (this.phase === PHASE_MOB && this.stageTime >= STAGE2.mobDuration) {
      this.phase = PHASE_BOSS_WARN;
      this.bossWarnTimer = STAGE2.bossWarnTime;
      this.showMessage('!! WARNING !!', STAGE2.bossWarnTime);
    }
    if (this.phase === PHASE_BOSS_WARN) {
      this.bossWarnTimer -= dt;
      if (this.bossWarnTimer <= 0) {
        this.phase = PHASE_BOSS;
        spawnBossShark(this.boss);
        audio.play('boss');
      }
    }

    if (this.phase === PHASE_MOB) {
      while (this.timelineCursor < STAGE2.timeline.length &&
             STAGE2.timeline[this.timelineCursor].t <= this.stageTime) {
        const ev = STAGE2.timeline[this.timelineCursor];
        for (const y of ev.ys) {
          const e = this.enemies.spawn();
          if (e) resetEnemy2(e, ev.kind, W + 50, y);
        }
        this.timelineCursor++;
      }
    }

    updatePlayer(this.player, input, dt);
    tryFire(this.player, input, this.bullets, this.options.items);
    this.options.forEach(o => updateOption(o, this.player));
    this.bullets.forEach(b => updateBullet(b, dt));
    this.enemyBullets.forEach(b => updateBullet(b, dt));
    this.enemies.forEach(e => updateEnemy2(e, dt, this.player, this.enemyBullets));
    this.starfish.forEach(s => updateStarfish(s, dt));
    this.particles.forEach(p => updateParticle(p, dt));
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

    if (this.phase === PHASE_BOSS || this.boss.dying > 0) {
      updateBossShark(this.boss, dt, this.player, this.enemyBullets, this.particles);
      if (!this.boss.active && this.phase === PHASE_BOSS) {
        this.phase = PHASE_CLEAR;
        this.score += this.boss.points;
        this.clearTimer = 3.0;
        this.showMessage('STAGE 2 CLEAR!', 3.0);
        audio.play('main');
        const li = this.lifeItems.spawn();
        if (li) resetLifeItem(li, this.boss.x, this.boss.y);
      }
    }

    this._collisions();

    // 지형 충돌
    if (this.player.alive && this.player.invulnAfterHit <= 0 && this.player.shieldTime <= 0) {
      if (this.terrain.collides(this.cameraX + this.player.x, this.player.y, PLAYER.hitRadius)) {
        this._hitPlayer();
      }
    }
    this.enemies.forEach(e => {
      if (this.terrain.collides(this.cameraX + e.x, e.y, e.radius * 0.5)) e.active = false;
    });

    // 레이저 히트 체크 (페이즈 2)
    if (this.boss.phase === 2 && this.boss.laserActive > 0 && this.player.alive && this.player.shieldTime <= 0) {
      if (Math.abs(this.player.y - this.boss.laserY) < PLAYER.hitRadius + 4) {
        this._hitPlayer();
      }
    }

    if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 4);
    if (this.flashTime > 0) this.flashTime = Math.max(0, this.flashTime - dt * 2);
    if (this.bombFlash > 0) this.bombFlash = Math.max(0, this.bombFlash - dt * 1.5);
    if (this.messageTime > 0) this.messageTime -= dt;

    if (!this.player.alive) {
      this.gameOverDelay += dt;
      if (this.gameOverDelay > 1.8) {
        this.done = true;
        this.onGameOver(this.score, 0);
      }
    }
    if (this.phase === PHASE_CLEAR) {
      this.clearTimer -= dt;
      if (this.clearTimer <= 0) {
        this.done = true;
        this.onGameOver(this.score, this.lives); // lives 전달 → 스테이지 3
      }
    }
  }

  _collisions() {
    const p = this.player;

    this.bullets.forEach(b => {
      if (!b.active) return;
      // vs 적
      this.enemies.forEach(e => {
        if (!e.active) return;
        if (!canDamageEnemy2(e)) return; // 조개 닫힘 무적
        const dx = b.x - e.x, dy = b.y - e.y;
        if (dx*dx + dy*dy <= (e.radius + BULLET.radius)**2) {
          b.active = false;
          e.hp--;
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
      // vs 보스
      if (this.boss.active && this.boss.dying <= 0 && this.boss.intro <= 0 && !this.boss.isDashing) {
        const dx = b.x - this.boss.x, dy = b.y - this.boss.y;
        if (dx*dx + dy*dy <= (this.boss.hitRadius + BULLET.radius)**2) {
          b.active = false;
          const died = damageBossShark(this.boss, 1, this.particles);
          if (died) {
            this.score += this.boss.points;
            explodeBig(this.particles, this.boss.x, this.boss.y);
            this.screenShake = 1.5;
          }
        }
      }
      // vs 불가사리
      this.starfish.forEach(s => {
        if (!s.active) return;
        const dx = b.x - s.x, dy = b.y - s.y;
        if (dx*dx + dy*dy <= (8 + BULLET.radius)**2) {
          b.active = false;
          hitStarfish(s);
        }
      });
    });

    // 적탄 vs 플레이어
    if (p.alive && p.invulnAfterHit <= 0) {
      this.enemyBullets.forEach(b => {
        if (!b.active) return;
        const dx = b.x - p.x, dy = b.y - p.y;
        if (dx*dx + dy*dy <= (PLAYER.hitRadius + BULLET.radius)**2) {
          b.active = false;
          if (p.shieldTime <= 0) {
            this._hitPlayer();
          } else {
            p.shieldTime = 0;
            explodeSmall(this.particles, b.x, b.y, '#88ccff');
            this.showMessage('SHIELD BREAK!', 0.8);
          }
        }
      });
    }

    // 적 몸통 vs 플레이어
    if (p.alive && p.invulnAfterHit <= 0 && p.shieldTime <= 0) {
      this.enemies.forEach(e => {
        if (!e.active) return;
        const dx = e.x - p.x, dy = e.y - p.y;
        if (dx*dx + dy*dy <= (e.radius + PLAYER.hitRadius)**2) {
          e.active = false;
          explodeSmall(this.particles, e.x, e.y, '#ffcc66');
          this._hitPlayer();
        }
      });
      // 보스 돌진 피격
      if (this.boss.active && this.boss.isDashing) {
        const dx = this.boss.x - p.x, dy = this.boss.y - p.y;
        if (dx*dx + dy*dy <= (this.boss.hitRadius + PLAYER.hitRadius)**2) {
          this._hitPlayer();
        }
      }
    }

    // 불가사리 먹기
    if (p.alive) {
      this.starfish.forEach(s => {
        if (!s.active) return;
        const dx = s.x - p.x, dy = s.y - p.y;
        if (dx*dx + dy*dy <= (9 + PLAYER.hitRadius)**2) {
          s.active = false;
          this._applyEffect(currentColor(s));
        }
      });
    }
  }

  _hitPlayer() {
    this.lives--;
    this.screenShake = 1.0;
    this.flashTime = 1.0;
    explodeSmall(this.particles, this.player.x, this.player.y, '#ff6060');
    this.player.invulnAfterHit = 1.8;
    this.player.power = 0;
    this.player.powerTime = 0;
    this.player.shieldTime = 0;
    this.options.clear();
    this.optionCount = 0;
    if (this.lives <= 0) { this.player.alive = false; this.gameOverDelay = 0; }
  }

  _applyEffect(color) {
    const p = this.player;
    switch (color) {
      case 'pink': this.score += 1000; this.showMessage('+1000', 1.0); break;
      case 'red':
        p.power = 1; p.powerTime += POWER_DURATION;
        this.showMessage('POWER UP', 1.0); break;
      case 'yellow':
        if (this.optionCount < OPTION_DRAW.maxCount) {
          const o = this.options.spawn();
          if (o) { resetOption(o, this.optionCount); this.optionCount++; this.showMessage('OPTION', 1.0); }
        } else { this.score += 500; this.showMessage('OPTION MAX +500', 1.0); }
        break;
      case 'blue':
        p.shieldTime += SHIELD_DURATION;
        this.showMessage('SHIELD', 1.0); break;
      case 'green':
        this.bombFlash = 1.0;
        this.enemies.forEach(e => { this.score += e.points; explodeSmall(this.particles, e.x, e.y, '#80ff80'); e.active = false; });
        this.enemyBullets.clear();
        if (this.boss.active && this.boss.dying <= 0) {
          if (damageBossShark(this.boss, 15, this.particles)) {
            this.score += this.boss.points;
            explodeBig(this.particles, this.boss.x, this.boss.y);
          }
        }
        this.showMessage('BOMB!', 1.0);
        break;
    }
  }

  draw(ctx) {
    const sx = this.screenShake > 0 ? (Math.random()-0.5)*4*this.screenShake : 0;
    const sy = this.screenShake > 0 ? (Math.random()-0.5)*4*this.screenShake : 0;
    ctx.save();
    ctx.translate(sx, sy);

    this.parallax.draw(ctx, this.cameraX, this.stageTime);
    this.terrain.draw(ctx, this.cameraX);

    drawBossShark(ctx, this.boss);
    this.enemies.forEach(e => drawEnemy2(ctx, e));
    this.starfish.forEach(s => drawStarfish(ctx, s));
    this.lifeItems.forEach(item => drawLifeItem(ctx, item));
    this.options.forEach(o => drawOption(ctx, o));
    drawPlayer(ctx, this.player);
    this.bullets.forEach(b => drawBullet(ctx, b));
    this.enemyBullets.forEach(b => drawBullet(ctx, b));
    this.particles.forEach(p => drawParticle(ctx, p));

    if (this.flashTime > 0) { ctx.fillStyle = `rgba(255,60,60,${this.flashTime*0.4})`; ctx.fillRect(0,0,W,H); }
    if (this.bombFlash > 0) { ctx.fillStyle = `rgba(180,255,180,${this.bombFlash*0.6})`; ctx.fillRect(0,0,W,H); }
    ctx.restore();

    this._drawHUD(ctx);
    this._drawPauseButton(ctx);

    if (this.messageTime > 0) {
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.fillStyle = this.phase === PHASE_BOSS_WARN ? '#ff4040' : '#fff';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.strokeText(this.message, W/2, H/2);
      ctx.fillText(this.message, W/2, H/2);
      ctx.textAlign = 'left';
    }
    if (this.paused) {
      ctx.fillStyle = 'rgba(0,12,28,0.75)'; ctx.fillRect(0,0,W,H);
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
      // PAUSED
      ctx.font = 'bold 20px "Courier New", monospace';
      ctx.fillStyle = '#80e0ff';
      ctx.strokeText('PAUSED', W/2, H/2 - 36);
      ctx.fillText('PAUSED', W/2, H/2 - 36);
      // BGM 버튼
      const bgmLabel = audio.isMuted() ? '[  BGM : OFF ]' : '[  BGM : ON  ]';
      ctx.font = '11px "Courier New", monospace';
      ctx.fillStyle = audio.isMuted() ? '#888' : '#ffe060';
      ctx.strokeText(bgmLabel, W/2, H/2 + 2);
      ctx.fillText(bgmLabel, W/2, H/2 + 2);
      this._bgmBtn = { x: W/2 - 58, y: H/2 - 14, w: 116, h: 22 };
      // RESUME
      ctx.fillStyle = '#80ff80';
      ctx.strokeText('[ RESUME ]', W/2, H/2 + 30);
      ctx.fillText('[ RESUME ]', W/2, H/2 + 30);
      // 안내
      ctx.font = '7px "Courier New", monospace';
      ctx.fillStyle = '#668899';
      ctx.fillText('tap BGM to toggle  /  P or ESC to resume', W/2, H/2 + 50);
      ctx.textAlign = 'left';
    }
  }

  _drawHUD(ctx) {
    ctx.fillStyle = 'rgba(0,16,32,0.55)'; ctx.fillRect(0,0,W,32);
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    const dt = (s,x,y) => { ctx.strokeText(s,x,y); ctx.fillText(s,x,y); };
    dt(`SCORE ${String(this.score).padStart(6,'0')}`, 26, 13);
    dt('LIFE', 26, 25);
    this._drawHearts(ctx, 60, 21, this.lives);
    ctx.textAlign = 'right';
    dt('STAGE 2', W-6, 13);
    if (this.player.power >= 1 && this.player.powerTime > 0) {
      ctx.fillStyle = '#ff8080'; dt('PWR', W-6, 25); ctx.fillStyle = '#fff';
    }
    if (this.player.shieldTime > 0) {
      ctx.fillStyle = '#80ccff'; dt('SHIELD', W-56, 25); ctx.fillStyle = '#fff';
    }
    ctx.textAlign = 'left';
  }

  _drawHearts(ctx, x, yCenter, count) {
    for (let i = 0; i < count; i++) this._drawHeart(ctx, x+i*11, yCenter, 8, '#ff5070');
  }

  _drawHeart(ctx, cx, cy, size, color) {
    ctx.fillStyle = color;
    const s = size/8;
    const pattern = [[0,1,1,0,0,1,1,0],[1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,0],[0,0,1,1,1,1,0,0],[0,0,0,1,1,0,0,0]];
    const ox = -size/2, oy = -(pattern.length*s)/2;
    for (let py = 0; py < pattern.length; py++)
      for (let px = 0; px < pattern[py].length; px++)
        if (pattern[py][px]) ctx.fillRect(cx+px*s+ox, cy+py*s+oy, s, s);
  }

  _drawPauseButton(ctx) {
    const bx=5,by=4,bw=16,bh=16;
    this._pauseBtn = {x:bx,y:by,w:bw,h:bh};
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(bx,by,bw,bh);
    ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.strokeRect(bx,by,bw,bh);
    ctx.fillStyle='#fff';
    if (this.paused) {
      ctx.beginPath(); ctx.moveTo(bx+5,by+4); ctx.lineTo(bx+12,by+8); ctx.lineTo(bx+5,by+12); ctx.closePath(); ctx.fill();
    } else {
      ctx.fillRect(bx+5,by+4,2,8); ctx.fillRect(bx+9,by+4,2,8);
    }
  }

  hitResumeButton(cx, cy) {
    if (!this.paused) return false;
    return cx >= W/2 - 55 && cx <= W/2 + 55 && cy >= H/2 + 18 && cy <= H/2 + 42;
  }
  hitBgmButton(cx, cy) {
    const b = this._bgmBtn;
    return b && this.paused && cx>=b.x && cx<=b.x+b.w && cy>=b.y && cy<=b.y+b.h;
  }
  hitPauseButton(cx, cy) {
    const b = this._pauseBtn;
    return b && cx>=b.x && cx<=b.x+b.w && cy>=b.y && cy<=b.y+b.h;
  }
}
