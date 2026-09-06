/**
 * Salamander Weapons & Projectiles
 */

// 1. Normal Dual Shot
export class NormalBullet {
    constructor(x, y, vx = 14, vy = 0) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 4;
        this.width = 12;
        this.height = 4;
        this.damage = 1;
        this.alive = true;
        this.isPlayer = true;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x > 850 || this.x < -50 || this.y < -50 || this.y > 650) {
            this.alive = false;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#ffff66';
        ctx.shadowColor = '#ff9900';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.roundRect(this.x - 6, this.y - 2, 12, 4, 2);
        ctx.fill();

        // Inner white core
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x - 4, this.y - 1, 8, 2);
        ctx.restore();
    }
}

// 2. Ripple Laser (Expanding Ring Wave)
export class RippleLaser {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 12;
        this.radiusX = 6;
        this.radiusY = 4;
        this.maxRadiusX = 36;
        this.maxRadiusY = 28;
        this.growthRate = 0.55;
        this.damage = 2;
        this.alive = true;
        this.isPlayer = true;
        this.piercing = true;
        this.hitCooldowns = new Map(); // entity -> cooldown frame
    }

    update() {
        this.x += this.vx;
        if (this.radiusX < this.maxRadiusX) {
            this.radiusX += this.growthRate;
            this.radiusY += this.growthRate * 0.75;
        }

        // Clean cooldowns
        for (let [target, cd] of this.hitCooldowns) {
            if (cd <= 1) this.hitCooldowns.delete(target);
            else this.hitCooldowns.set(target, cd - 1);
        }

        if (this.x - this.radiusX > 850) {
            this.alive = false;
        }
    }

    canDamage(entity) {
        return !this.hitCooldowns.has(entity);
    }

    recordHit(entity) {
        this.hitCooldowns.set(entity, 8); // hit frequency
    }

    draw(ctx) {
        ctx.save();
        ctx.strokeStyle = '#33ffff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#0088ff';
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.radiusX, this.radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Inner concentric highlight ring
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, Math.max(1, this.radiusX - 3), Math.max(1, this.radiusY - 2), 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    get radius() {
        return this.radiusY;
    }
}

// 3. Beam Laser (High-piercing continuous beam)
export class BeamLaser {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 22;
        this.length = 80;
        this.height = 6;
        this.radius = 5;
        this.damage = 2.5;
        this.alive = true;
        this.isPlayer = true;
        this.piercing = true;
        this.hitCooldowns = new Map();
    }

    update() {
        this.x += this.vx;

        for (let [target, cd] of this.hitCooldowns) {
            if (cd <= 1) this.hitCooldowns.delete(target);
            else this.hitCooldowns.set(target, cd - 1);
        }

        if (this.x - this.length > 850) {
            this.alive = false;
        }
    }

    canDamage(entity) {
        return !this.hitCooldowns.has(entity);
    }

    recordHit(entity) {
        this.hitCooldowns.set(entity, 6);
    }

    draw(ctx) {
        ctx.save();
        // Cyan glow outer beam
        ctx.fillStyle = '#00e5ff';
        ctx.shadowColor = '#00aaff';
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x - this.length, this.y - this.height / 2, this.length, this.height);

        // Bright white core
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.fillRect(this.x - this.length + 5, this.y - 1.5, this.length - 10, 3);
        ctx.restore();
    }
}

// 4. Ground/Surface Tracking Missile
export class Missile {
    constructor(x, y, dirY = 1) {
        this.x = x;
        this.y = y;
        this.vx = 4;
        this.vy = 3.5 * dirY; // drops down (1) or shoots up (-1)
        this.dirY = dirY;
        this.radius = 4;
        this.damage = 3;
        this.alive = true;
        this.isPlayer = true;
        this.isMissile = true;
        this.onSurface = false;
        this.surfaceTimer = 0;
    }

    update(terrainCeilingY = 40, terrainFloorY = 560) {
        if (!this.onSurface) {
            this.x += this.vx;
            this.y += this.vy;

            // Check if hit floor or ceiling
            if (this.dirY > 0 && this.y >= terrainFloorY) {
                this.y = terrainFloorY;
                this.onSurface = true;
                this.vx = 7;
                this.vy = 0;
            } else if (this.dirY < 0 && this.y <= terrainCeilingY) {
                this.y = terrainCeilingY;
                this.onSurface = true;
                this.vx = 7;
                this.vy = 0;
            }
        } else {
            // Cruise along surface
            this.x += this.vx;
            this.surfaceTimer++;
            if (this.surfaceTimer > 90) {
                this.alive = false;
            }
        }

        if (this.x > 850 || this.x < -20 || this.y < -20 || this.y > 620) {
            this.alive = false;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#ff6600';
        ctx.shadowColor = '#ff2200';
        ctx.shadowBlur = 5;

        // Draw missile body
        const angle = this.onSurface ? 0 : (this.dirY > 0 ? Math.PI / 4 : -Math.PI / 4);
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);

        ctx.fillRect(-6, -2, 12, 4);
        ctx.fillStyle = '#ffff33';
        ctx.fillRect(4, -1, 3, 2);

        // Small flame
        ctx.fillStyle = '#ff3300';
        ctx.fillRect(-8, -1.5, 3, 3);

        ctx.restore();
    }
}

// 5. Enemy Red Bullet
export class EnemyBullet {
    constructor(x, y, vx, vy, type = 'orb') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.type = type; // 'orb' | 'spine' | 'fire'
        this.radius = type === 'fire' ? 7 : (type === 'spine' ? 3 : 5);
        this.alive = true;
        this.isPlayer = false;
        this.animFrame = 0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.animFrame++;

        if (this.x < -30 || this.x > 830 || this.y < -30 || this.y > 630) {
            this.alive = false;
        }
    }

    draw(ctx) {
        ctx.save();
        if (this.type === 'orb') {
            ctx.fillStyle = '#ff1133';
            ctx.shadowColor = '#ff5500';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x - 1, this.y - 1, 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'spine') {
            const angle = Math.atan2(this.vy, this.vx);
            ctx.translate(this.x, this.y);
            ctx.rotate(angle);

            ctx.fillStyle = '#aaff22';
            ctx.shadowColor = '#44ff00';
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.ellipse(0, 0, 8, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'fire') {
            // Pulsing fireball
            const pulse = Math.sin(this.animFrame * 0.2) * 2;
            const r = this.radius + pulse;

            const grad = ctx.createRadialGradient(this.x, this.y, 1, this.x, this.y, r);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.4, '#ffff00');
            grad.addColorStop(0.8, '#ff3300');
            grad.addColorStop(1, 'transparent');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}
