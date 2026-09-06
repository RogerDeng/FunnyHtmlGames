/**
 * Salamander Stage 2: Solar Prominence
 * Features fiery solar flares, fire bats, high-speed skirmishes, and Boss Intruder (Fire Dragon).
 */
import { WaveScout, FireBat } from '../entities/enemies.js';
import { BossFireDragon } from '../entities/bosses.js';
import { PowerUpType } from '../entities/powerups.js';
import { sfx } from '../audio/soundEffects.js';
import { bgm } from '../audio/chiptuneBgm.js';

export class Stage2 {
    constructor() {
        this.name = 'STAGE 2: SOLAR PROMINENCE';
        this.scrollDist = 0;
        this.bossSpawned = false;
        this.warningShown = false;
        this.warningTimer = 0;
        this.cleared = false;
        this.clearTimer = 0;
        this.boss = null;
        this.activeDrops = [
            PowerUpType.LASER,
            PowerUpType.OPTION,
            PowerUpType.SHIELD,
            PowerUpType.MISSILE,
            PowerUpType.RIPPLE,
            PowerUpType.SPEED
        ];
        this.dropIndex = 0;

        // Solar flare prominence eruptions
        this.flares = [];
    }

    start() {
        bgm.play('stage2');
    }

    getNextPowerUpType() {
        const type = this.activeDrops[this.dropIndex % this.activeDrops.length];
        this.dropIndex++;
        return type;
    }

    getTerrainAt(worldX) {
        // Solar prominences create intermittent fiery arches
        return { ceilingY: 35, floorY: 565 };
    }

    update(dt, enemies, enemyBullets, powerups, particles, player) {
        if (!this.bossSpawned) {
            this.scrollDist += 2.8;
        } else if (!this.cleared) {
            this.scrollDist += 0.4;
        }

        const d = Math.floor(this.scrollDist);

        // 1. Scripted Enemy Waves
        if (d === 100) this.spawnRedWave(enemies, 250, 'sine');
        if (d === 250) this.spawnFireBats(enemies, 350);
        if (d === 450) this.spawnScoutWave(enemies, 180, 'loop');
        if (d === 650) this.spawnRedWave(enemies, 420, 'loop');
        if (d === 850) this.spawnFireBats(enemies, 200);
        if (d === 1050) this.spawnRedWave(enemies, 300, 'straight');
        if (d === 1250) {
            this.spawnFireBats(enemies, 180);
            this.spawnFireBats(enemies, 420);
        }
        if (d === 1500) this.spawnScoutWave(enemies, 300, 'sine');
        if (d === 1750) this.spawnRedWave(enemies, 320, 'sine');
        if (d === 2000) this.spawnFireBats(enemies, 280);
        if (d === 2250) this.spawnRedWave(enemies, 260, 'loop');

        // 2. Boss Warning
        if (d >= 2500 && !this.warningShown) {
            this.warningShown = true;
            this.warningTimer = 180;
            sfx.playWarning();
        }

        if (this.warningTimer > 0) {
            this.warningTimer--;
            if (this.warningTimer === 0 && !this.bossSpawned) {
                this.bossSpawned = true;
                this.boss = new BossFireDragon();
                bgm.play('boss');
            }
        }

        // 3. Boss Update & Victory Check
        if (this.boss) {
            this.boss.update(player, enemyBullets, particles);
            if (!this.boss.alive && !this.cleared) {
                this.cleared = true;
                this.clearTimer = 220;
                sfx.playStageClear();
                bgm.stop();
            }
        }

        if (this.cleared && this.clearTimer > 0) {
            this.clearTimer--;
        }
    }

    spawnRedWave(enemies, startY, pattern) {
        const waveId = 'red_wave_s2_' + Date.now() + Math.random();
        for (let i = 0; i < 5; i++) {
            const scout = new WaveScout(850 + i * 40, startY, pattern, true, waveId);
            enemies.push(scout);
        }
    }

    spawnScoutWave(enemies, startY, pattern) {
        for (let i = 0; i < 5; i++) {
            const scout = new WaveScout(850 + i * 38, startY, pattern, false, null);
            enemies.push(scout);
        }
    }

    spawnFireBats(enemies, startY) {
        for (let i = 0; i < 4; i++) {
            enemies.push(new FireBat(850 + i * 50, startY + (i % 2 === 0 ? -30 : 30)));
        }
    }

    drawTerrain(ctx) {
        ctx.save();
        // Solar prominence coronal rim along top and bottom
        const time = this.scrollDist * 0.05;

        // Top fire corona
        const gradTop = ctx.createLinearGradient(0, 0, 0, 45);
        gradTop.addColorStop(0, '#ff3300');
        gradTop.addColorStop(0.5, '#ff8800');
        gradTop.addColorStop(1, 'transparent');
        ctx.fillStyle = gradTop;
        ctx.fillRect(0, 0, 800, 45);

        // Bottom fire corona
        const gradBottom = ctx.createLinearGradient(0, 600, 0, 555);
        gradBottom.addColorStop(0, '#ff3300');
        gradBottom.addColorStop(0.5, '#ff8800');
        gradBottom.addColorStop(1, 'transparent');
        ctx.fillStyle = gradBottom;
        ctx.fillRect(0, 555, 800, 45);

        ctx.restore();
    }
}
