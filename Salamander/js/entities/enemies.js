/**
 * Salamander Enemy Entities
 * Features formation waves, red item carriers, bio-organisms, and turrets.
 */
import { EnemyBullet } from './weapons.js';
import { PowerUpCapsule, PowerUpType } from './powerups.js';
import { sfx } from '../audio/soundEffects.js';

// Base Enemy
export class Enemy {
    constructor(x, y, hp = 1, score = 100) {
        this.x = x;
        this.y = y;
        this.hp = hp;
        this.maxHp = hp;
        this.score = score;
        this.alive = true;
        this.isRed = false; // Item carrier wave
        this.waveId = null;
        this.radius = 12;
        this.hitFlash = 0;
    }

    takeDamage(damage) {
        this.hp -= damage;
        this.hitFlash = 4;
        sfx.playEnemyHit();
        if (this.hp <= 0) {
            this.alive = false;
            return true; // killed
        }
        return false;
    }
}

// 1. Formation Wave Scout (Sine wave or Loop)
export class WaveScout extends Enemy {
    constructor(x, y, pattern = 'sine', isRed = false, waveId = null) {
        super(x, y, isRed ? 2 : 1, isRed ? 200 : 100);
        this.pattern = pattern; // 'sine' | 'loop' | 'straight'
        this.isRed = isRed;
        this.waveId = waveId;
        this.radius = 11;
        this.time = 0;
        this.baseY = y;
        this.vx = -3.5;
        this.fireCooldown = Math.floor(Math.random() * 60) + 40;
    }

    update(player, enemyBullets) {
        this.time += 0.05;
        this.x += this.vx;

        if (this.pattern === 'sine') {
            this.y = this.baseY + Math.sin(this.time * 2) * 50;
        } else if (this.pattern === 'loop') {
            this.y = this.baseY + Math.sin(this.time * 2.5) * 60;
            this.vx = -3.2 + Math.cos(this.time * 2.5) * 1.5;
        }

        // Periodic aimed bullet
        this.fireCooldown--;
        if (this.fireCooldown <= 0 && this.x > 100 && this.x < 750) {
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            const speed = 3.5;
            enemyBullets.push(new EnemyBullet(
                this.x - 10,
                this.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                'orb'
            ));
            this.fireCooldown = 120 + Math.random() * 60;
        }

        if (this.hitFlash > 0) this.hitFlash--;

        if (this.x < -40) {
            this.alive = false;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const bodyColor = this.hitFlash > 0
            ? '#ffffff'
            : (this.isRed ? '#ff2222' : '#22cc44');
        const trimColor = this.isRed ? '#ffcc00' : '#88ff88';

        ctx.fillStyle = bodyColor;
        ctx.strokeStyle = trimColor;
        ctx.lineWidth = 1.5;

        // Aerodynamic insectoid/fighter shape
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(8, -8);
        ctx.lineTo(12, 0);
        ctx.lineTo(8, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Eye / Cockpit
        ctx.fillStyle = this.isRed ? '#ffffff' : '#ffff00';
        ctx.fillRect(-2, -2, 5, 4);

        ctx.restore();
    }
}

// 2. Floating Bio Cell (Stage 1) - Splits on death
export class FloatingCell extends Enemy {
    constructor(x, y, size = 'large') {
        const hp = size === 'large' ? 4 : 2;
        super(x, y, hp, size === 'large' ? 300 : 150);
        this.size = size; // 'large' | 'small'
        this.radius = size === 'large' ? 20 : 11;
        this.vx = -1.5;
        this.vy = (Math.random() * 2 - 1) * 0.8;
        this.pulse = Math.random() * Math.PI * 2;
    }

    update() {
        this.pulse += 0.08;
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off top/bottom
        if (this.y < 60 || this.y > 540) {
            this.vy = -this.vy;
        }

        if (this.hitFlash > 0) this.hitFlash--;
        if (this.x < -50) this.alive = false;
    }

    draw(ctx) {
        ctx.save();
        const r = this.radius + Math.sin(this.pulse) * (this.size === 'large' ? 3 : 1.5);
        ctx.translate(this.x, this.y);

        if (this.hitFlash > 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, r);
            grad.addColorStop(0, '#ff99ff');
            grad.addColorStop(0.6, '#992288');
            grad.addColorStop(1, '#440033');
            ctx.fillStyle = grad;
        }

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Nucleus
        ctx.fillStyle = '#ffff66';
        ctx.beginPath();
        ctx.arc(Math.cos(this.pulse * 0.5) * 3, Math.sin(this.pulse * 0.5) * 3, r * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// 3. Eye Turret (Attached to ceiling or floor)
export class EyeTurret extends Enemy {
    constructor(x, y, isCeiling = false) {
        super(x, y, 3, 250);
        this.isCeiling = isCeiling;
        this.radius = 16;
        this.fireCooldown = 50 + Math.random() * 40;
        this.pupilAngle = 0;
    }

    update(player, enemyBullets) {
        this.x -= 2.0; // moves with background terrain

        // Eye tracks player
        this.pupilAngle = Math.atan2(player.y - this.y, player.x - this.x);

        // Fire bio-spines
        this.fireCooldown--;
        if (this.fireCooldown <= 0 && this.x > 80 && this.x < 760) {
            const speed = 4.2;
            enemyBullets.push(new EnemyBullet(
                this.x,
                this.y,
                Math.cos(this.pupilAngle) * speed,
                Math.sin(this.pupilAngle) * speed,
                'spine'
            ));
            this.fireCooldown = 110 + Math.random() * 40;
        }

        if (this.hitFlash > 0) this.hitFlash--;
        if (this.x < -40) this.alive = false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Base flesh mound
        ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : '#882244';
        ctx.beginPath();
        if (this.isCeiling) {
            ctx.ellipse(0, -8, 22, 14, 0, 0, Math.PI);
        } else {
            ctx.ellipse(0, 8, 22, 14, 0, Math.PI, 0);
        }
        ctx.fill();

        // Sclera (eyeball white)
        ctx.fillStyle = '#ffffdd';
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();

        // Iris & pupil looking at player
        const px = Math.cos(this.pupilAngle) * 5;
        const py = Math.sin(this.pupilAngle) * 5;
        ctx.fillStyle = '#cc0022';
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// 4. Fire Bat (Stage 2 Flame Creature)
export class FireBat extends Enemy {
    constructor(x, y) {
        super(x, y, 2, 200);
        this.radius = 13;
        this.vx = -4.5;
        this.vy = 0;
        this.time = 0;
        this.baseY = y;
    }

    update(player, enemyBullets) {
        this.time += 0.12;
        this.x += this.vx;
        this.y = this.baseY + Math.sin(this.time) * 45;

        if (this.hitFlash > 0) this.hitFlash--;
        if (this.x < -30) this.alive = false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        const wing = Math.sin(this.time * 2) * 12;

        ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : '#ff4400';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-8, -14 - wing);
        ctx.lineTo(-14, 0);
        ctx.lineTo(-8, 14 + wing);
        ctx.closePath();
        ctx.fill();

        // Fire core
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
