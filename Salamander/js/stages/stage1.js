/**
 * Salamander Stage 1: Bio-Organic Cavern
 * Features fleshy cavern terrain, organic obstacles, cell swarms, and Boss Golen.
 */
import { WaveScout, FloatingCell, EyeTurret } from '../entities/enemies.js';
import { BossGolen } from '../entities/bosses.js';
import { PowerUpCapsule, PowerUpType } from '../entities/powerups.js';
import { sfx } from '../audio/soundEffects.js';
import { bgm } from '../audio/chiptuneBgm.js';

export class Stage1 {
    constructor() {
        this.name = 'STAGE 1: BIO-ORGANIC CAVERN';
        this.scrollDist = 0;
        this.bossSpawned = false;
        this.warningShown = false;
        this.warningTimer = 0;
        this.cleared = false;
        this.clearTimer = 0;
        this.boss = null;
        this.activeDrops = [
            PowerUpType.SPEED,
            PowerUpType.MISSILE,
            PowerUpType.RIPPLE,
            PowerUpType.OPTION,
            PowerUpType.LASER,
            PowerUpType.SHIELD
        ];
        this.dropIndex = 0;
    }

    start() {
        bgm.play('stage1');
    }

    getNextPowerUpType() {
        const type = this.activeDrops[this.dropIndex % this.activeDrops.length];
        this.dropIndex++;
        return type;
    }

    // Terrain bounds at world X coordinate
    getTerrainAt(worldX) {
        // Organic undulating ceiling & floor
        const c1 = Math.sin(worldX * 0.003) * 25;
        const c2 = Math.cos(worldX * 0.008) * 15;
        const ceilingY = Math.max(30, 45 + c1 + c2);

        const f1 = Math.sin(worldX * 0.0035) * 25;
        const f2 = Math.cos(worldX * 0.007) * 15;
        const floorY = Math.min(570, 555 - f1 - f2);

        return { ceilingY, floorY };
    }

    update(dt, enemies, enemyBullets, powerups, particles, player) {
        if (!this.bossSpawned) {
            this.scrollDist += 2.0;
        } else if (!this.cleared) {
            this.scrollDist += 0.2; // Gentle drift during boss fight
        }

        // 1. Scripted Enemy Waves
        const d = Math.floor(this.scrollDist);

        // Opening red wave (Speed Up)
        if (d === 100) this.spawnRedWave(enemies, 300, 'straight');
        // Green scouts
        if (d === 300) this.spawnScoutWave(enemies, 200, 'sine');
        // Red wave (Missile)
        if (d === 500) this.spawnRedWave(enemies, 400, 'sine');
        // Floating cell clusters
        if (d === 700) {
            enemies.push(new FloatingCell(850, 220, 'large'));
            enemies.push(new FloatingCell(870, 380, 'large'));
        }
        // Eye turrets on ceiling & floor
        if (d === 900) {
            enemies.push(new EyeTurret(850, 60, true));
            enemies.push(new EyeTurret(880, 540, false));
        }
        // Red wave (Ripple Laser)
        if (d === 1100) this.spawnRedWave(enemies, 250, 'loop');
        // Bio swarm
        if (d === 1300) {
            enemies.push(new FloatingCell(850, 180, 'small'));
            enemies.push(new FloatingCell(860, 300, 'large'));
            enemies.push(new FloatingCell(870, 420, 'small'));
        }
        // Dual turrets
        if (d === 1500) {
            enemies.push(new EyeTurret(850, 65, true));
            enemies.push(new EyeTurret(900, 535, false));
        }
        // Red wave (Option)
        if (d === 1700) this.spawnRedWave(enemies, 320, 'sine');
        // Fast scouts
        if (d === 1900) this.spawnScoutWave(enemies, 250, 'loop');
        // Final red wave (Shield)
        if (d === 2100) this.spawnRedWave(enemies, 300, 'straight');

        // 2. Boss Warning
        if (d >= 2350 && !this.warningShown) {
            this.warningShown = true;
            this.warningTimer = 180;
            sfx.playWarning();
        }

        if (this.warningTimer > 0) {
            this.warningTimer--;
            if (this.warningTimer === 0 && !this.bossSpawned) {
                this.bossSpawned = true;
                this.boss = new BossGolen();
                bgm.play('boss');
            }
        }

        // 3. Boss Update & Victory Check
        if (this.boss) {
            this.boss.update(player, enemyBullets, particles);
            if (!this.boss.alive && !this.cleared) {
                this.cleared = true;
                this.clearTimer = 200;
                sfx.playStageClear();
                bgm.stop();
            }
        }

        if (this.cleared && this.clearTimer > 0) {
            this.clearTimer--;
        }
    }

    spawnRedWave(enemies, startY, pattern) {
        const waveId = 'red_wave_' + Date.now() + Math.random();
        for (let i = 0; i < 5; i++) {
            const scout = new WaveScout(850 + i * 45, startY, pattern, true, waveId);
            enemies.push(scout);
        }
    }

    spawnScoutWave(enemies, startY, pattern) {
        for (let i = 0; i < 5; i++) {
            const scout = new WaveScout(850 + i * 40, startY, pattern, false, null);
            enemies.push(scout);
        }
    }

    drawTerrain(ctx) {
        ctx.save();
        const step = 20;

        // Top Flesh Ceiling
        ctx.fillStyle = '#661133';
        ctx.strokeStyle = '#992244';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);

        for (let x = 0; x <= 800; x += step) {
            const worldX = x + this.scrollDist;
            const { ceilingY } = this.getTerrainAt(worldX);
            ctx.lineTo(x, ceilingY);
        }
        ctx.lineTo(800, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Bottom Flesh Floor
        ctx.beginPath();
        ctx.moveTo(0, 600);
        for (let x = 0; x <= 800; x += step) {
            const worldX = x + this.scrollDist;
            const { floorY } = this.getTerrainAt(worldX);
            ctx.lineTo(x, floorY);
        }
        ctx.lineTo(800, 600);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}
