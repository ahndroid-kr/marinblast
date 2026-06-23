// 스테이지 4: 거미게/초롱아귀/메로 → 보스 바다 마녀
import { W, H, BULLET, POOL, PLAYER, SHIELD_DURATION, POWER_DURATION, OPTION_DRAW, QA_MODE } from '../config.js';
import { Pool } from '../pool.js';
import { Terrain } from '../terrain.js';
import { Parallax4 } from '../parallax4.js';
import { makeBullet, updateBullet, drawBullet } from '../entities/bullet.js';
import { makePlayer, updatePlayer, tryFire, drawPlayer } from '../entities/player.js';
import { makeEnemy4, resetEnemy4, updateEnemy4, drawEnemy4 } from '../entities/enemy4.js';
import { makeStarfish, resetStarfish, updateStarfish, drawStarfish, hitStarfish, currentColor } from '../entities/powerup.js';
import { makeOption, resetOption, updateOption, drawOption } from '../entities/option.js';
import { makeParticle, updateParticle, drawParticle, explodeSmall, explodeBig } from '../entities/particle.js';
import { makeLifeItem, resetLifeItem, updateLifeItem, drawLifeItem } from '../entities/lifeitem.js';
import { makeBossSeawitch, spawnBossSeawitch, updateBossSeawitch, drawBossSeawitch, damageBossSeawitch, getSlamY4, isSlamActive4 } from '../entities/boss_seawitch.js';
import { STAGE4 } from '../stages/stage4.js';
import { audio } from '../audio.js';

const PHASE_MOB='mob', PHASE_BOSS_WARN='boss_warn', PHASE_BOSS='boss', PHASE_CLEAR='clear';

export class Game4Scene {
  constructor(score, lives, onGameOver) {
    this.onGameOver = onGameOver;
    this.player = makePlayer();
    this.score = score||0; this.lives = lives || (QA_MODE ? 99 : 3);
    this.bullets    = new Pool(makeBullet,   BULLET.poolSize);
    this.enemyBullets = new Pool(makeBullet, POOL.enemyBullet);
    this.enemies    = new Pool(makeEnemy4,   POOL.enemy);
    this.starfish   = new Pool(makeStarfish, POOL.powerup);
    this.options    = new Pool(makeOption,   POOL.option);
    this.particles  = new Pool(makeParticle, POOL.particle);
    this.lifeItems  = new Pool(makeLifeItem, 3);
    this.boss       = makeBossSeawitch();
    this.terrain    = new Terrain(STAGE4.terrain, STAGE4.terrain[STAGE4.terrain.length-1].x);
    this.parallax   = new Parallax4();
    this.cameraX=0; this.stageTime=0; this.timelineCursor=0;
    this.screenShake=0; this.flashTime=0; this.bombFlash=0;
    this.gameOverDelay=0; this.done=false; this.optionCount=0;
    this.message=''; this.messageTime=0;
    this.phase=PHASE_MOB; this.bossWarnTimer=0; this.clearTimer=0;
    this.paused=false; this._pauseBtn=null; this._bgmBtn=null;
    this._audioStarted=false;
  }

  showMessage(t,d=1.5){this.message=t;this.messageTime=d;}

  update(dt, input) {
    if (this.done) return;
    if (!this._audioStarted) { this._audioStarted=true; audio.play('main'); }
    if (input.pauseEdge && this.player.alive && this.phase!==PHASE_CLEAR) {
      this.paused=!this.paused;
      if (this.paused) audio.pause(); else audio.resume();
    }
    if (this.paused) return;

    if (this.phase===PHASE_MOB||this.phase===PHASE_BOSS_WARN) this.cameraX+=STAGE4.scrollSpeed*dt;
    this.stageTime+=dt;

    if (this.phase===PHASE_MOB && this.stageTime>=STAGE4.mobDuration) {
      this.phase=PHASE_BOSS_WARN; this.bossWarnTimer=STAGE4.bossWarnTime;
      this.showMessage('!! WARNING !!', STAGE4.bossWarnTime);
    }
    if (this.phase===PHASE_BOSS_WARN) {
      this.bossWarnTimer-=dt;
      if (this.bossWarnTimer<=0) { this.phase=PHASE_BOSS; spawnBossSeawitch(this.boss); audio.play('boss'); }
    }
    if (this.phase===PHASE_MOB) {
      while (this.timelineCursor<STAGE4.timeline.length && STAGE4.timeline[this.timelineCursor].t<=this.stageTime) {
        const ev=STAGE4.timeline[this.timelineCursor];
        for (const y of ev.ys) { const e=this.enemies.spawn(); if(e) resetEnemy4(e,ev.kind,W+50,y); }
        this.timelineCursor++;
      }
    }

    updatePlayer(this.player,input,dt);
    tryFire(this.player,input,this.bullets,this.options.items);
    this.options.forEach(o=>updateOption(o,this.player));
    this.bullets.forEach(b=>updateBullet(b,dt));
    this.enemyBullets.forEach(b=>updateBullet(b,dt));
    this.enemies.forEach(e=>updateEnemy4(e,dt,this.player,this.enemyBullets));
    this.starfish.forEach(s=>updateStarfish(s,dt));
    this.particles.forEach(p=>updateParticle(p,dt));
    this.lifeItems.forEach(item=>updateLifeItem(item,dt));

    if (this.player.alive) {
      this.lifeItems.forEach(item=>{
        if (!item.active) return;
        const dx=item.x-this.player.x, dy=item.y-this.player.y;
        if (dx*dx+dy*dy<=(12+PLAYER.hitRadius)**2) {
          item.active=false; this.lives+=1;
          this.showMessage('EXTRA LIFE!',1.5);
          explodeSmall(this.particles,item.x,item.y,'#cc44aa');
        }
      });
    }

    if (this.phase===PHASE_BOSS||this.boss.dying>0) {
      updateBossSeawitch(this.boss,dt,this.player,this.enemyBullets,this.particles);
      if (!this.boss.active && this.phase===PHASE_BOSS) {
        this.phase=PHASE_CLEAR; this.score+=this.boss.points;
        this.clearTimer=4.0; this.showMessage('ALL CLEAR!!',4.0);
        audio.stop();
        const li=this.lifeItems.spawn(); if(li) resetLifeItem(li,this.boss.x,this.boss.y);
      }
    }

    this._collisions();

    // 지형 충돌
    if (this.player.alive&&this.player.invulnAfterHit<=0&&this.player.shieldTime<=0)
      if (this.terrain.collides(this.cameraX+this.player.x,this.player.y,PLAYER.hitRadius)) this._hitPlayer();
    this.enemies.forEach(e=>{ if(this.terrain.collides(this.cameraX+e.x,e.y,e.radius*0.5)) e.active=false; });

    // 슬램 피격
    if (this.phase===PHASE_BOSS && this.player.alive && this.player.shieldTime<=0 && isSlamActive4(this.boss)) {
      const sy=getSlamY4(this.boss);
      if (sy!==null && Math.abs(this.player.y-sy)<PLAYER.hitRadius+8) this._hitPlayer();
    }

    if (this.screenShake>0) this.screenShake=Math.max(0,this.screenShake-dt*4);
    if (this.flashTime>0)   this.flashTime=Math.max(0,this.flashTime-dt*2);
    if (this.bombFlash>0)   this.bombFlash=Math.max(0,this.bombFlash-dt*1.5);
    if (this.messageTime>0) this.messageTime-=dt;

    if (!this.player.alive) {
      this.gameOverDelay+=dt;
      if (this.gameOverDelay>1.8) { this.done=true; this.onGameOver(this.score,0); }
    }
    if (this.phase===PHASE_CLEAR) {
      this.clearTimer-=dt;
      if (this.clearTimer<=0) { this.done=true; this.onGameOver(this.score,this.lives); }
    }
  }

  _collisions() {
    const p=this.player;
    this.bullets.forEach(b=>{
      if (!b.active) return;
      this.enemies.forEach(e=>{
        if (!e.active) return;
        const dx=b.x-e.x,dy=b.y-e.y;
        if (dx*dx+dy*dy>(e.radius+BULLET.radius)**2) return;
        b.active=false; e.hp--;
        if (e.hp<=0) {
          e.active=false; this.score+=e.points;
          explodeSmall(this.particles,e.x,e.y,'#ffcc66');
          if (Math.random()<e.dropChance) { const s=this.starfish.spawn(); if(s) resetStarfish(s,e.x,e.y); }
        }
      });
      if (this.boss.active&&this.boss.dying<=0&&this.boss.intro<=0) {
        const dx=b.x-this.boss.x,dy=b.y-this.boss.y;
        if (dx*dx+dy*dy<=(this.boss.hitRadius+BULLET.radius)**2) {
          b.active=false;
          if (damageBossSeawitch(this.boss,1,this.particles)) {
            this.score+=this.boss.points; explodeBig(this.particles,this.boss.x,this.boss.y); this.screenShake=2.0;
          }
        }
      }
      this.starfish.forEach(s=>{
        if (!s.active) return;
        const dx=b.x-s.x,dy=b.y-s.y;
        if (dx*dx+dy*dy<=(8+BULLET.radius)**2) { b.active=false; hitStarfish(s); }
      });
    });

    if (p.alive&&p.invulnAfterHit<=0) {
      this.enemyBullets.forEach(b=>{
        if (!b.active) return;
        const dx=b.x-p.x,dy=b.y-p.y;
        if (dx*dx+dy*dy<=(PLAYER.hitRadius+BULLET.radius)**2) {
          b.active=false;
          if (p.shieldTime<=0) this._hitPlayer();
          else { p.shieldTime=0; explodeSmall(this.particles,b.x,b.y,'#88ccff'); this.showMessage('SHIELD BREAK!',0.8); }
        }
      });
    }
    if (p.alive&&p.invulnAfterHit<=0&&p.shieldTime<=0) {
      this.enemies.forEach(e=>{
        if (!e.active) return;
        const dx=e.x-p.x,dy=e.y-p.y;
        if (dx*dx+dy*dy<=(e.radius+PLAYER.hitRadius)**2) { e.active=false; explodeSmall(this.particles,e.x,e.y,'#ffcc66'); this._hitPlayer(); }
      });
      if (this.boss.active&&this.boss.intro<=0) {
        const dx=this.boss.x-p.x,dy=this.boss.y-p.y;
        if (dx*dx+dy*dy<=(this.boss.hitRadius+PLAYER.hitRadius)**2) this._hitPlayer();
      }
    }
    if (p.alive) {
      this.starfish.forEach(s=>{
        if (!s.active) return;
        const dx=s.x-p.x,dy=s.y-p.y;
        if (dx*dx+dy*dy<=(9+PLAYER.hitRadius)**2) { s.active=false; this._applyEffect(currentColor(s)); }
      });
    }
  }

  _hitPlayer() {
    this.lives--; this.screenShake=1.0; this.flashTime=1.0;
    explodeSmall(this.particles,this.player.x,this.player.y,'#ff6060');
    this.player.invulnAfterHit=1.8; this.player.power=0; this.player.powerTime=0; this.player.shieldTime=0;
    this.options.clear(); this.optionCount=0;
    if (this.lives<=0) { this.player.alive=false; this.gameOverDelay=0; }
  }

  _applyEffect(color) {
    const p=this.player;
    switch(color) {
      case 'pink': this.score+=1000; this.showMessage('+1000',1.0); break;
      case 'red':  p.power=1; p.powerTime+=POWER_DURATION; this.showMessage('POWER UP',1.0); break;
      case 'yellow':
        if (this.optionCount<OPTION_DRAW.maxCount) { const o=this.options.spawn(); if(o){resetOption(o,this.optionCount);this.optionCount++;this.showMessage('OPTION',1.0);} }
        else { this.score+=500; this.showMessage('OPTION MAX +500',1.0); }
        break;
      case 'blue': p.shieldTime+=SHIELD_DURATION; this.showMessage('SHIELD',1.0); break;
      case 'green':
        this.bombFlash=1.0;
        this.enemies.forEach(e=>{this.score+=e.points;explodeSmall(this.particles,e.x,e.y,'#80ff80');e.active=false;});
        this.enemyBullets.clear();
        if (this.boss.active&&this.boss.dying<=0) { if(damageBossSeawitch(this.boss,25,this.particles)){this.score+=this.boss.points;explodeBig(this.particles,this.boss.x,this.boss.y);} }
        this.showMessage('BOMB!',1.0); break;
    }
  }

  draw(ctx) {
    const sx=this.screenShake>0?(Math.random()-0.5)*4*this.screenShake:0;
    const sy=this.screenShake>0?(Math.random()-0.5)*4*this.screenShake:0;
    ctx.save(); ctx.translate(sx,sy);
    this.parallax.draw(ctx,this.cameraX,this.stageTime);
    this.terrain.draw(ctx,this.cameraX);
    drawBossSeawitch(ctx,this.boss);
    this.enemies.forEach(e=>drawEnemy4(ctx,e));
    this.starfish.forEach(s=>drawStarfish(ctx,s));
    this.lifeItems.forEach(item=>drawLifeItem(ctx,item));
    this.options.forEach(o=>drawOption(ctx,o));
    drawPlayer(ctx,this.player);
    this.bullets.forEach(b=>drawBullet(ctx,b));
    this.enemyBullets.forEach(b=>drawBullet(ctx,b));
    this.particles.forEach(p=>drawParticle(ctx,p));
    if (this.flashTime>0){ctx.fillStyle=`rgba(255,60,60,${this.flashTime*0.4})`;ctx.fillRect(0,0,W,H);}
    if (this.bombFlash>0){ctx.fillStyle=`rgba(180,255,180,${this.bombFlash*0.6})`;ctx.fillRect(0,0,W,H);}
    ctx.restore();
    this._drawHUD(ctx);
    this._drawPauseButton(ctx);
    if (this.messageTime>0) {
      const isWarn=this.phase===PHASE_BOSS_WARN, isClear=this.phase===PHASE_CLEAR;
      ctx.font=`bold ${isClear?18:14}px "Courier New",monospace`;
      ctx.fillStyle=isWarn?'#ff4040':isClear?'#ffdd40':'#fff';
      ctx.strokeStyle='#000';ctx.lineWidth=3;ctx.textAlign='center';
      ctx.strokeText(this.message,W/2,H/2);ctx.fillText(this.message,W/2,H/2);
      ctx.textAlign='left';
    }
    if (this.paused) {
      ctx.fillStyle='rgba(0,12,28,0.75)';ctx.fillRect(0,0,W,H);
      ctx.textAlign='center';ctx.strokeStyle='#000';ctx.lineWidth=3;
      ctx.font='bold 20px "Courier New",monospace';ctx.fillStyle='#80e0ff';
      ctx.strokeText('PAUSED',W/2,H/2-36);ctx.fillText('PAUSED',W/2,H/2-36);
      const bgmLabel=audio.isMuted()?'[  BGM : OFF ]':'[  BGM : ON  ]';
      ctx.font='11px "Courier New",monospace';
      ctx.fillStyle=audio.isMuted()?'#888':'#ffe060';
      ctx.strokeText(bgmLabel,W/2,H/2+2);ctx.fillText(bgmLabel,W/2,H/2+2);
      this._bgmBtn={x:W/2-58,y:H/2-14,w:116,h:22};
      ctx.fillStyle='#80ff80';
      ctx.strokeText('[ RESUME ]',W/2,H/2+30);ctx.fillText('[ RESUME ]',W/2,H/2+30);
      ctx.font='7px "Courier New",monospace';ctx.fillStyle='#668899';
      ctx.fillText('tap BGM to toggle  /  P or ESC to resume',W/2,H/2+50);
      ctx.textAlign='left';
    }
  }

  _drawHUD(ctx) {
    ctx.fillStyle='rgba(0,16,32,0.55)';ctx.fillRect(0,0,W,32);
    ctx.font='bold 11px "Courier New",monospace';
    ctx.fillStyle='#fff';ctx.strokeStyle='#000';ctx.lineWidth=2;
    const dt=(s,x,y)=>{ctx.strokeText(s,x,y);ctx.fillText(s,x,y);};
    dt(`SCORE ${String(this.score).padStart(6,'0')}`,26,13);
    dt('LIFE',26,25);
    this._drawHearts(ctx,60,21,this.lives);
    ctx.textAlign='right';
    dt('STAGE 4',W-6,13);
    if (this.player.power>=1&&this.player.powerTime>0){ctx.fillStyle='#ff8080';dt('PWR',W-6,25);ctx.fillStyle='#fff';}
    if (this.player.shieldTime>0){ctx.fillStyle='#80ccff';dt('SHIELD',W-40,25);ctx.fillStyle='#fff';}
    ctx.textAlign='left';
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
  _drawPauseButton(ctx){
    const bx=5,by=4,bw=16,bh=16;this._pauseBtn={x:bx,y:by,w:bw,h:bh};
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(bx,by,bw,bh);
    ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.strokeRect(bx,by,bw,bh);
    ctx.fillStyle='#fff';
    if(this.paused){ctx.beginPath();ctx.moveTo(bx+5,by+4);ctx.lineTo(bx+12,by+8);ctx.lineTo(bx+5,by+12);ctx.closePath();ctx.fill();}
    else{ctx.fillRect(bx+5,by+4,2,8);ctx.fillRect(bx+9,by+4,2,8);}
  }
  hitBgmButton(cx,cy){const b=this._bgmBtn;return b&&this.paused&&cx>=b.x&&cx<=b.x+b.w&&cy>=b.y&&cy<=b.y+b.h;}
  hitResumeButton(cx,cy){if(!this.paused)return false;return cx>=W/2-55&&cx<=W/2+55&&cy>=H/2+18&&cy<=H/2+42;}
  hitPauseButton(cx,cy){const b=this._pauseBtn;return b&&cx>=b.x&&cx<=b.x+b.w&&cy>=b.y&&cy<=b.y+b.h;}
}
