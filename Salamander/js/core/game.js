/**
 * Salamander Main Game Engine
 */
import { InputManager } from './input.js';
import { Collision } from './collision.js';
import { Player } from '../entities/player.js';
import { PowerUpCapsule } from '../entities/powerups.js';
import { Stage1 } from '../stages/stage1.js';
import { Stage2 } from '../stages/stage2.js';
import { Renderer } from '../render/renderer.js';
import { ParticleSystem } from '../render/particles.js';
import { sfx } from '../audio/soundEffects.js';
import { bgm } from '../audio/chiptuneBgm.js';

export const GameState = {
    TITLE: 'TITLE',
    PLAYING: 'PLAYING',
    STAGE_TRANSITION: 'STAGE_TRANSITION',
    GAME_OVER: 'GAME_OVER',
    VICTORY: 'VICTORY',
    PAUSED: 'PAUSED'
};

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.input = new InputManager();
        this.particles = new ParticleSystem();

        this.state = GameState.TITLE;
        this.shipSelection = 'vic_viper'; // 'vic_viper' | 'lord_british'
        this.player = new Player(this.shipSelection);

        this.stageIndex = 1;
        this.stage = null;

        this.enemies = [];
        this.playerBullets = [];
        this.enemyBullets = [];
        this.powerups = [];

        // Track wave kills for red powerup carriers
        this.waveKills = new Map(); // waveId -> count

        // High score in LocalStorage
        this.highScore = parseInt(localStorage.getItem('salamander_high_score') || '10000', 10);

        this.transitionTimer = 0;
        this.gameOverTimer = 0;
        this.lastTime = performance.now();

        // Konami Code handler
        this.input.onKonamiTriggered = () => {
            this.triggerKonamiCode();
        };

        this.initDOMControls();
    }

    initDOMControls() {
        // Toggle sound
        const soundBtn = document.getElementById('btn-sound');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                sfx.setMuted(!sfx.enabled);
                bgm.setMuted(!bgm.enabled);
                soundBtn.textContent = sfx.enabled ? '🔊 音效: 開' : '🔇 音效: 關';
            });
        }

        // Toggle scanlines
        const scanlineBtn = document.getElementById('btn-scanline');
        if (scanlineBtn) {
            scanlineBtn.addEventListener('click', () => {
                this.renderer.scanlinesEnabled = !this.renderer.scanlinesEnabled;
                scanlineBtn.textContent = this.renderer.scanlinesEnabled ? '📺 CRT: 開' : '📺 CRT: 關';
            });
        }

        // Toggle Fullscreen
        const fsBtn = document.getElementById('btn-fullscreen');
        if (fsBtn) {
            fsBtn.addEventListener('click', () => {
                const gameContainer = document.getElementById('game-container');
                if (!document.fullscreenElement) {
                    gameContainer.requestFullscreen().catch(() => {});
                } else {
                    document.exitFullscreen().catch(() => {});
                }
            });
        }

        // Virtual Touch Controls
        this.initTouchControls();
    }

    initTouchControls() {
        const dpad = document.getElementById('touch-dpad');
        const stick = document.getElementById('touch-stick');
        const btnFire = document.getElementById('touch-btn-fire');
        const btnAuto = document.getElementById('touch-btn-auto');

        if (!dpad || !stick) return;

        let touchId = null;
        let dpadCenter = { x: 0, y: 0 };
        const maxRadius = 40;

        dpad.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            touchId = touch.identifier;
            const rect = dpad.getBoundingClientRect();
            dpadCenter = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
            this.updateTouchStick(touch.clientX, touch.clientY, dpadCenter, maxRadius, stick);
        }, { passive: false });

        dpad.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === touchId) {
                    this.updateTouchStick(touch.clientX, touch.clientY, dpadCenter, maxRadius, stick);
                    break;
                }
            }
        }, { passive: false });

        const resetTouchStick = (e) => {
            e.preventDefault();
            touchId = null;
            this.input.touchMove = { x: 0, y: 0 };
            stick.style.transform = 'translate(-50%, -50%)';
        };

        dpad.addEventListener('touchend', resetTouchStick);
        dpad.addEventListener('touchcancel', resetTouchStick);

        // Touch Fire
        if (btnFire) {
            btnFire.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.input.touchShoot = true;
                if (this.state === GameState.TITLE || this.state === GameState.GAME_OVER) {
                    this.handleStartAction();
                }
            }, { passive: false });

            btnFire.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.input.touchShoot = false;
            });
        }

        // Touch Auto-Fire Toggle
        if (btnAuto) {
            btnAuto.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.input.autoFire = !this.input.autoFire;
                btnAuto.classList.toggle('active', this.input.autoFire);
            }, { passive: false });
        }
    }

    updateTouchStick(touchX, touchY, center, maxRadius, stickElem) {
        let dx = touchX - center.x;
        let dy = touchY - center.y;
        const dist = Math.hypot(dx, dy);

        if (dist > maxRadius) {
            dx = (dx / dist) * maxRadius;
            dy = (dy / dist) * maxRadius;
        }

        this.input.touchMove = {
            x: dx / maxRadius,
            y: dy / maxRadius
        };

        stickElem.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }

    triggerKonamiCode() {
        if (this.state === GameState.PLAYING) {
            this.player.applyKonamiCode();
            this.showMessage('30 LIVES & FULL WEAPONS!');
        } else if (this.state === GameState.TITLE) {
            sfx.playKonamiFanfare();
            this.player.lives = 30;
            this.showMessage('KONAMI CODE: 30 LIVES ARMED!');
        }
    }

    showMessage(text) {
        const banner = document.getElementById('center-banner');
        if (banner) {
            banner.textContent = text;
            banner.style.display = 'block';
            setTimeout(() => {
                banner.style.display = 'none';
            }, 3000);
        }
    }

    startNewGame() {
        this.stageIndex = 1;
        this.player = new Player(this.shipSelection);
        this.loadStage(1);
        this.state = GameState.PLAYING;
    }

    loadStage(index) {
        this.stageIndex = index;
        this.enemies = [];
        this.playerBullets = [];
        this.enemyBullets = [];
        this.powerups = [];
        this.waveKills.clear();

        if (index === 1) {
            this.stage = new Stage1();
        } else if (index === 2) {
            this.stage = new Stage2();
        }
        this.stage.start();
    }

    handleStartAction() {
        if (this.state === GameState.TITLE) {
            sfx.init();
            bgm.init();
            this.startNewGame();
        } else if (this.state === GameState.GAME_OVER || this.state === GameState.VICTORY) {
            this.state = GameState.TITLE;
            bgm.play('title');
        }
    }

    update(now) {
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;

        // Auto fire toggle key
        if (this.input.isAutoFireToggleJustPressed()) {
            this.input.autoFire = !this.input.autoFire;
            const btnAuto = document.getElementById('touch-btn-auto');
            if (btnAuto) btnAuto.classList.toggle('active', this.input.autoFire);
        }

        // Pause toggle
        if (this.input.isPauseJustPressed()) {
            if (this.state === GameState.PLAYING) {
                this.state = GameState.PAUSED;
                bgm.stop();
            } else if (this.state === GameState.PAUSED) {
                this.state = GameState.PLAYING;
                if (this.stage && this.stage.boss && this.stage.boss.alive) {
                    bgm.play('boss');
                } else {
                    bgm.play(this.stageIndex === 1 ? 'stage1' : 'stage2');
                }
            }
        }

        // State machine
        if (this.state === GameState.TITLE) {
            if (this.input.isStartJustPressed()) {
                this.handleStartAction();
            }
            // Toggle ship selector on Left/Right
            if (this.input.isJustPressed('ArrowLeft') || this.input.isJustPressed('ArrowRight')) {
                this.shipSelection = this.shipSelection === 'vic_viper' ? 'lord_british' : 'vic_viper';
                this.player.shipType = this.shipSelection;
            }
        } else if (this.state === GameState.PLAYING) {
            this.updatePlaying(dt);
        } else if (this.state === GameState.STAGE_TRANSITION) {
            this.updateStageTransition();
        } else if (this.state === GameState.GAME_OVER) {
            this.gameOverTimer++;
            if (this.gameOverTimer > 90 && this.input.isStartJustPressed()) {
                this.handleStartAction();
            }
        } else if (this.state === GameState.VICTORY) {
            if (this.input.isStartJustPressed()) {
                this.handleStartAction();
            }
        }

        this.particles.update();
        this.input.update();
    }

    updatePlaying(dt) {
        // 1. Update Player
        this.player.update(this.input, this.particles);

        // Player shooting
        if (this.input.isShooting()) {
            this.player.shoot(this.playerBullets);
        }

        // 2. Update Stage
        this.stage.update(dt, this.enemies, this.enemyBullets, this.powerups, this.particles, this.player);

        // Check if stage is cleared!
        if (this.stage.cleared && this.stage.clearTimer <= 0) {
            if (this.stageIndex === 1) {
                this.state = GameState.STAGE_TRANSITION;
                this.transitionTimer = 180;
            } else {
                this.state = GameState.VICTORY;
                this.updateHighScore();
            }
            return;
        }

        // 3. Update Player Bullets
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const b = this.playerBullets[i];
            if (b.isMissile) {
                // Missile checks terrain
                const { ceilingY, floorY } = this.stage.getTerrainAt(b.x + this.stage.scrollDist);
                b.update(ceilingY, floorY);
            } else {
                b.update();
            }
            if (!b.alive) {
                this.playerBullets.splice(i, 1);
            }
        }

        // 4. Update Enemy Bullets
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const eb = this.enemyBullets[i];
            eb.update();
            if (!eb.alive) {
                this.enemyBullets.splice(i, 1);
            }
        }

        // 5. Update Enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(this.player, this.enemyBullets);
            if (!e.alive) {
                this.enemies.splice(i, 1);
            }
        }

        // 6. Update Power-ups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            p.update();
            if (!p.alive) {
                this.powerups.splice(i, 1);
            }
        }

        // 7. Collisions: Player Bullets vs Enemies & Boss
        this.checkBulletEnemyCollisions();

        // 8. Collisions: Enemy Bullets & Enemies vs Player
        this.checkPlayerCollisions();

        // 9. Collisions: Player vs Power-ups
        this.checkPowerUpCollisions();

        // 10. Check Player vs Cavern Walls (Stage 1)
        if (this.player.alive && this.stageIndex === 1) {
            const { ceilingY, floorY } = this.stage.getTerrainAt(this.player.x + this.stage.scrollDist);
            if (this.player.y - this.player.radius < ceilingY || this.player.y + this.player.radius > floorY) {
                this.handlePlayerDeath();
            }
        }

        // Update High Score
        if (this.player.score > this.highScore) {
            this.highScore = this.player.score;
        }
    }

    checkBulletEnemyCollisions() {
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const b = this.playerBullets[i];

            // A. Check hit on normal enemies
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const e = this.enemies[j];
                if (!e.alive) continue;

                if (Collision.circleCircle({ x: b.x, y: b.y, radius: b.radius || 4 }, e)) {
                    // Check piercing logic
                    if (b.canDamage && !b.canDamage(e)) continue;

                    const killed = e.takeDamage(b.damage || 1);
                    if (b.recordHit) b.recordHit(e);
                    if (!b.piercing) b.alive = false;

                    this.particles.emitSpark(b.x, b.y, '#ffffaa');

                    if (killed) {
                        this.player.score += e.score;
                        this.particles.emitExplosion(e.x, e.y, e.radius > 15 ? 20 : 12);
                        sfx.playExplosion(e.radius > 15 ? 'medium' : 'small');

                        // Check if red carrier wave cleared!
                        if (e.isRed && e.waveId) {
                            const kills = (this.waveKills.get(e.waveId) || 0) + 1;
                            this.waveKills.set(e.waveId, kills);
                            if (kills >= 5) {
                                // Entire squad destroyed! Drop capsule!
                                const dropType = this.stage.getNextPowerUpType();
                                this.powerups.push(new PowerUpCapsule(e.x, e.y, dropType));
                            }
                        }
                    }
                    if (!b.alive) break;
                }
            }

            // B. Check hit on Boss
            if (b.alive && this.stage.boss && this.stage.boss.alive) {
                const boss = this.stage.boss;
                const hit = boss.checkHit(b, this.particles);
                if (hit) {
                    if (!b.piercing) {
                        b.alive = false;
                    }
                    if (boss.dying && !boss.scoreAwarded) {
                        this.player.score += boss.score;
                        boss.scoreAwarded = true;
                    }
                }
            }
        }
    }

    checkPlayerCollisions() {
        if (!this.player.alive || this.player.invincibleTimer > 0) return;

        // A. Enemy Bullets vs Player
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const eb = this.enemyBullets[i];
            if (Collision.circleCircle(eb, { x: this.player.x, y: this.player.y, radius: this.player.radius })) {
                eb.alive = false;
                const died = this.player.takeDamage(this.particles);
                if (died) {
                    this.handlePlayerDeath();
                    break;
                }
            }
        }

        if (!this.player.alive) return;

        // B. Ramming Enemies vs Player
        for (let e of this.enemies) {
            if (!e.alive) continue;
            if (Collision.circleCircle(e, { x: this.player.x, y: this.player.y, radius: this.player.radius })) {
                const died = this.player.takeDamage(this.particles);
                if (died) {
                    this.handlePlayerDeath();
                    break;
                }
            }
        }

        if (!this.player.alive) return;

        // C. Boss vs Player
        if (this.stage.boss && this.stage.boss.alive && !this.stage.boss.dying) {
            const boss = this.stage.boss;
            if (Collision.circleCircle(
                { x: boss.x, y: boss.y, radius: boss.radius },
                { x: this.player.x, y: this.player.y, radius: this.player.radius }
            )) {
                const died = this.player.takeDamage(this.particles);
                if (died) {
                    this.handlePlayerDeath();
                }
            }
        }
    }

    checkPowerUpCollisions() {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            if (Collision.circleCircle(p, { x: this.player.x, y: this.player.y, radius: 18 })) {
                p.alive = false;
                this.player.applyPowerUp(p.type);
                this.player.score += 500;
                this.particles.emitSpark(p.x, p.y, '#ffff00');
            }
        }
    }

    handlePlayerDeath() {
        this.player.alive = false;
        this.player.lives--;
        sfx.playPlayerDeath();
        this.particles.emitExplosion(this.player.x, this.player.y, 30, ['#ff4400', '#ffff00', '#ffffff', '#00e5ff']);

        if (this.player.lives <= 0) {
            this.state = GameState.GAME_OVER;
            this.gameOverTimer = 0;
            bgm.stop();
            this.updateHighScore();
        } else {
            // Respawn after short delay
            setTimeout(() => {
                if (this.state === GameState.PLAYING) {
                    this.player.reset(false);
                }
            }, 1200);
        }
    }

    updateStageTransition() {
        this.transitionTimer--;
        if (this.transitionTimer <= 0) {
            this.loadStage(2);
            this.state = GameState.PLAYING;
        }
    }

    updateHighScore() {
        if (this.player.score > this.highScore) {
            this.highScore = this.player.score;
            localStorage.setItem('salamander_high_score', this.highScore.toString());
        }
    }

    render() {
        const ctx = this.renderer.ctx;
        this.renderer.clear();

        // 1. Parallax background
        const scroll = this.stage ? this.stage.scrollDist : 0;
        this.renderer.drawBackground(this.stageIndex, scroll);

        // 2. Terrain (if active)
        if (this.stage && (this.state === GameState.PLAYING || this.state === GameState.STAGE_TRANSITION)) {
            this.stage.drawTerrain(ctx);
        }

        // 3. Entities
        if (this.state === GameState.PLAYING || this.state === GameState.STAGE_TRANSITION || this.state === GameState.PAUSED) {
            // Power-ups
            for (let p of this.powerups) p.draw(ctx);
            // Enemies
            for (let e of this.enemies) e.draw(ctx);
            // Boss
            if (this.stage && this.stage.boss) this.stage.boss.draw(ctx);
            // Player Bullets
            for (let b of this.playerBullets) b.draw(ctx);
            // Enemy Bullets
            for (let eb of this.enemyBullets) eb.draw(ctx);
            // Player & Options
            this.player.draw(ctx);
            // Warning Alert Banner
            if (this.stage && this.stage.warningTimer > 0) {
                this.renderer.drawWarning(this.stage.warningTimer);
            }
        }

        // 4. Particles
        this.particles.draw(ctx);

        // 5. In-Game HUD
        if (this.state === GameState.PLAYING || this.state === GameState.STAGE_TRANSITION || this.state === GameState.PAUSED) {
            this.renderer.drawHUD(this.player, this.stage, this.highScore);
        }

        // 6. UI Overlays (Title, GameOver, Victory, Pause)
        this.renderOverlays(ctx);

        // 7. CRT Scanlines
        this.renderer.drawScanlines();
    }

    renderOverlays(ctx) {
        ctx.save();

        if (this.state === GameState.TITLE) {
            // Salamander Arcade Logo Title
            ctx.fillStyle = '#ff1133';
            ctx.shadowColor = '#ff5500';
            ctx.shadowBlur = 18;
            ctx.font = 'bold 54px "Courier New", monospace, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('SALAMANDER', 400, 160);

            ctx.font = 'bold 24px "Courier New", monospace, sans-serif';
            ctx.fillStyle = '#ffaa00';
            ctx.shadowBlur = 8;
            ctx.fillText('沙 羅 曼 蛇  •  LIFE FORCE', 400, 205);

            // Ship Selector
            ctx.font = 'bold 18px "Courier New", monospace, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('SELECT SHIP: [ ◄   ► ]', 400, 275);

            const isVic = this.shipSelection === 'vic_viper';
            ctx.fillStyle = isVic ? '#33ccff' : '#666688';
            ctx.fillText('1P: VIC VIPER (超時空巡航機)', 400, 310);

            ctx.fillStyle = !isVic ? '#ff4444' : '#666688';
            ctx.fillText('2P: LORD BRITISH (滅絕紅色戰機)', 400, 340);

            // Press Start Prompt
            const blink = Math.floor(Date.now() / 400) % 2 === 0;
            if (blink) {
                ctx.fillStyle = '#ffff33';
                ctx.font = 'bold 22px "Courier New", monospace, sans-serif';
                ctx.fillText('PRESS SPACE / J / TAP TO START', 400, 420);
            }

            // Controls Guide
            ctx.font = '14px "Courier New", monospace, sans-serif';
            ctx.fillStyle = '#aaaaaa';
            ctx.fillText('WASD / 方向鍵: 移動   |   J / 空白鍵: 發射   |   K: 地形飛彈', 400, 480);
            ctx.fillText('C / M: 自動連發開關   |   P: 暫停', 400, 510);

            ctx.fillStyle = '#ff88aa';
            ctx.font = 'bold 13px "Courier New", monospace, sans-serif';
            ctx.fillText('★ 支援經典 KONAMI 秘技: ↑ ↑ ↓ ↓ ← → ← → B A ★', 400, 545);

        } else if (this.state === GameState.PAUSED) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
            ctx.fillRect(0, 0, 800, 600);

            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 44px "Courier New", monospace, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', 400, 300);

            ctx.font = 'bold 18px "Courier New", monospace, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('PRESS P OR ESC TO RESUME', 400, 350);

        } else if (this.state === GameState.STAGE_TRANSITION) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, 200, 800, 200);

            ctx.fillStyle = '#33ffaa';
            ctx.shadowColor = '#00ffaa';
            ctx.shadowBlur = 15;
            ctx.font = 'bold 42px "Courier New", monospace, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('STAGE 1 CLEAR !!', 400, 280);

            ctx.font = 'bold 22px "Courier New", monospace, sans-serif';
            ctx.fillStyle = '#ffaa33';
            ctx.fillText('PREPARE FOR STAGE 2: SOLAR PROMINENCE', 400, 340);

        } else if (this.state === GameState.GAME_OVER) {
            ctx.fillStyle = 'rgba(20, 0, 0, 0.75)';
            ctx.fillRect(0, 0, 800, 600);

            ctx.fillStyle = '#ff2222';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 20;
            ctx.font = 'bold 56px "Courier New", monospace, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', 400, 260);

            ctx.font = 'bold 22px "Courier New", monospace, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('FINAL SCORE: ' + this.player.score, 400, 330);

            if (this.player.score >= this.highScore && this.player.score > 0) {
                ctx.fillStyle = '#ffff00';
                ctx.fillText('★ NEW HIGH SCORE! ★', 400, 370);
            }

            const blink = Math.floor(Date.now() / 400) % 2 === 0;
            if (blink) {
                ctx.fillStyle = '#aaaaaa';
                ctx.fillText('PRESS SPACE / J / TAP TO CONTINUE', 400, 440);
            }

        } else if (this.state === GameState.VICTORY) {
            ctx.fillStyle = 'rgba(5, 10, 30, 0.85)';
            ctx.fillRect(0, 0, 800, 600);

            ctx.fillStyle = '#ffff33';
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur = 20;
            ctx.font = 'bold 48px "Courier New", monospace, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('ALL MISSIONS COMPLETED !!', 400, 220);

            ctx.font = 'bold 24px "Courier New", monospace, sans-serif';
            ctx.fillStyle = '#33ccff';
            ctx.fillText('YOU SAVED THE GALAXY FROM SALAMANDER!', 400, 280);

            ctx.font = 'bold 20px "Courier New", monospace, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('FINAL SCORE: ' + this.player.score, 400, 350);

            const blink = Math.floor(Date.now() / 400) % 2 === 0;
            if (blink) {
                ctx.fillStyle = '#ffaa33';
                ctx.fillText('PRESS SPACE / TAP TO RETURN TO TITLE', 400, 430);
            }
        }

        ctx.restore();
    }

    loop(now) {
        this.update(now);
        this.render();
        requestAnimationFrame((t) => this.loop(t));
    }

    start() {
        bgm.play('title');
        requestAnimationFrame((t) => {
            this.lastTime = t;
            this.loop(t);
        });
    }
}
