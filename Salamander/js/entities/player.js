/**
 * Salamander Player Spacecraft (Vic Viper / Lord British)
 */
import { NormalBullet, RippleLaser, BeamLaser, Missile } from './weapons.js';
import { Option } from './option.js';
import { sfx } from '../audio/soundEffects.js';

export class Player {
    constructor(shipType = 'vic_viper') {
        this.shipType = shipType; // 'vic_viper' | 'lord_british'
        this.reset(true);
    }

    reset(fullReset = false) {
        this.x = 100;
        this.y = 300;
        this.vx = 0;
        this.vy = 0;
        this.radius = 6; // Tight core hitbox
        this.width = 38;
        this.height = 18;

        this.tilt = 0; // -1 (up), 0 (neutral), 1 (down)
        this.fireCooldown = 0;
        this.missileCooldown = 0;

        // Trail history for Options
        this.trail = [];
        for (let i = 0; i < 150; i++) {
            this.trail.push({ x: this.x, y: this.y });
        }

        if (fullReset) {
            this.lives = 3;
            this.score = 0;
            this.speedLevel = 1;
            this.hasMissile = false;
            this.activeWeapon = 'normal'; // 'normal' | 'ripple' | 'laser'
            this.options = [];
            this.shieldHp = 0;
        } else {
            // Respawn penalty: keep 1 speed, keep 1 option if previously powered up
            this.speedLevel = Math.max(1, this.speedLevel - 1);
            this.shieldHp = 0;
            this.hasMissile = false;
            this.activeWeapon = 'normal';
            if (this.options.length > 0) {
                this.options = [new Option(0)];
            }
        }

        this.invincibleTimer = 180; // 3 seconds invulnerability
        this.alive = true;
    }

    get speed() {
        return 3.5 + (this.speedLevel - 1) * 0.9;
    }

    update(input, particles) {
        if (!this.alive) return;

        // 1. Invincibility tick
        if (this.invincibleTimer > 0) {
            this.invincibleTimer--;
        }

        // 2. Movement
        const dir = input.getDirection();
        this.vx = dir.x * this.speed;
        this.vy = dir.y * this.speed;

        this.x += this.vx;
        this.y += this.vy;

        // Boundaries (playable zone)
        const minX = 20;
        const maxX = 780;
        const minY = 30;
        const maxY = 570;

        if (this.x < minX) this.x = minX;
        if (this.x > maxX) this.x = maxX;
        if (this.y < minY) this.y = minY;
        if (this.y > maxY) this.y = maxY;

        // Smooth tilt calculation
        if (dir.y < -0.2) {
            this.tilt = Math.max(-1, this.tilt - 0.2);
        } else if (dir.y > 0.2) {
            this.tilt = Math.min(1, this.tilt + 0.2);
        } else {
            this.tilt *= 0.75;
        }

        // Emit thruster exhaust
        const isRed = this.shipType === 'lord_british';
        particles.emitThruster(this.x - 18, this.y, isRed);

        // Record trail for Options
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 200) {
            this.trail.shift();
        }

        // Update Options
        for (let opt of this.options) {
            opt.update(this.trail);
        }

        // 3. Fire Cooldowns
        if (this.fireCooldown > 0) this.fireCooldown--;
        if (this.missileCooldown > 0) this.missileCooldown--;
    }

    shoot(bullets) {
        if (!this.alive || this.fireCooldown > 0) return;

        if (this.activeWeapon === 'laser') {
            bullets.push(new BeamLaser(this.x + 20, this.y));
            sfx.playLaser();
            this.fireCooldown = 12;
        } else if (this.activeWeapon === 'ripple') {
            bullets.push(new RippleLaser(this.x + 18, this.y));
            sfx.playRipple();
            this.fireCooldown = 10;
        } else {
            // Normal Dual Shot
            bullets.push(new NormalBullet(this.x + 18, this.y - 5));
            bullets.push(new NormalBullet(this.x + 18, this.y + 5));
            sfx.playShot();
            this.fireCooldown = 8;
        }

        // Fire Missiles if equipped
        if (this.hasMissile && this.missileCooldown <= 0) {
            bullets.push(new Missile(this.x + 10, this.y + 8, 1));
            // Dual missile if speed is level 3+
            if (this.speedLevel >= 3) {
                bullets.push(new Missile(this.x + 10, this.y - 8, -1));
            }
            sfx.playMissile();
            this.missileCooldown = 22;
        }

        // Fire all Options simultaneously!
        for (let opt of this.options) {
            opt.fire(this, bullets);
        }
    }

    applyPowerUp(type) {
        sfx.playPowerUp();
        if (type === 'S') {
            if (this.speedLevel < 5) this.speedLevel++;
        } else if (type === 'M') {
            this.hasMissile = true;
        } else if (type === 'R') {
            this.activeWeapon = 'ripple';
        } else if (type === 'L') {
            this.activeWeapon = 'laser';
        } else if (type === 'O') {
            if (this.options.length < 4) {
                this.options.push(new Option(this.options.length));
            }
        } else if (type === 'F') {
            this.shieldHp = 5; // Restore shield
        }
    }

    applyKonamiCode() {
        sfx.playKonamiFanfare();
        this.lives = 30;
        this.speedLevel = 4;
        this.hasMissile = true;
        this.activeWeapon = 'laser';
        this.shieldHp = 8;
        this.options = [];
        for (let i = 0; i < 4; i++) {
            this.options.push(new Option(i));
        }
    }

    takeDamage(particles) {
        // If currently invincible, ignore
        if (this.invincibleTimer > 0) return false;

        // If Shield active, absorb damage
        if (this.shieldHp > 0) {
            this.shieldHp--;
            sfx.playShieldHit();
            particles.emitShieldHit(this.x + 22, this.y);
            return false;
        }

        // Fatal hit
        return true;
    }

    draw(ctx) {
        if (!this.alive) return;

        // Flashing when invincible
        if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 4) % 2 === 0) {
            return;
        }

        ctx.save();
        ctx.translate(this.x, this.y);

        // Banking tilt rotation
        ctx.rotate(this.tilt * 0.15);

        const isRed = this.shipType === 'lord_british';
        const primaryColor = isRed ? '#dd2222' : '#2255ee';
        const trimColor = isRed ? '#ffffff' : '#ffffff';
        const cockpitColor = isRed ? '#ffff33' : '#33ffff';

        // 1. Draw Wings (Upper & Lower)
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        // Upper wing
        ctx.moveTo(-8, -4);
        ctx.lineTo(-14, -14);
        ctx.lineTo(2, -8);
        ctx.lineTo(8, -3);
        // Lower wing
        ctx.lineTo(8, 3);
        ctx.lineTo(2, 8);
        ctx.lineTo(-14, 14);
        ctx.lineTo(-8, 4);
        ctx.closePath();
        ctx.fill();

        // Wing highlights
        ctx.strokeStyle = trimColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 2. Main Fuselage (Arrow needle shape)
        ctx.fillStyle = trimColor;
        ctx.beginPath();
        ctx.moveTo(18, 0); // Nose tip
        ctx.lineTo(-12, -6);
        ctx.lineTo(-16, 0);
        ctx.lineTo(-12, 6);
        ctx.closePath();
        ctx.fill();

        // Dual needle nose tines (classic Vic Viper twin prong fork!)
        ctx.fillStyle = primaryColor;
        ctx.fillRect(8, -4, 10, 2);
        ctx.fillRect(8, 2, 10, 2);

        // 3. Cockpit Canopy
        ctx.fillStyle = cockpitColor;
        ctx.shadowColor = cockpitColor;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.ellipse(-2, 0, 7, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // 4. Force Field (Shield) if active
        if (this.shieldHp > 0) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00ffff';
            ctx.strokeStyle = this.shieldHp > 2 ? '#33ffff' : '#ff44aa';
            ctx.lineWidth = 2.5;

            // Forward curved energy arc
            ctx.beginPath();
            ctx.ellipse(22, 0, 8, 18, 0, -Math.PI / 2.2, Math.PI / 2.2);
            ctx.stroke();

            // Inner glowing barrier node
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(24, -2, 4, 4);
        }

        ctx.restore();

        // Draw Options
        for (let opt of this.options) {
            opt.draw(ctx);
        }
    }
}
