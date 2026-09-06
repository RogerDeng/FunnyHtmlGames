/**
 * Salamander Option (Multiple) Entity
 * Autonomous support drone that mimics player weapon attacks and follows position history.
 */
import { NormalBullet, RippleLaser, BeamLaser, Missile } from './weapons.js';

export class Option {
    constructor(index) {
        this.index = index; // 0, 1, 2, 3
        this.x = 100;
        this.y = 300;
        this.radius = 8;
        this.delayFrames = 14 * (index + 1);
        this.animTimer = Math.random() * Math.PI * 2;
    }

    update(playerTrail) {
        this.animTimer += 0.15;
        // Sample from history buffer
        if (playerTrail.length > this.delayFrames) {
            const pos = playerTrail[playerTrail.length - 1 - this.delayFrames];
            if (pos) {
                this.x = pos.x;
                this.y = pos.y;
            }
        }
    }

    // Fire weapons matching player's current weapon system
    fire(player, bullets) {
        if (player.activeWeapon === 'laser') {
            bullets.push(new BeamLaser(this.x + 12, this.y));
        } else if (player.activeWeapon === 'ripple') {
            bullets.push(new RippleLaser(this.x + 10, this.y));
        } else {
            // Normal dual bullets
            bullets.push(new NormalBullet(this.x + 10, this.y - 4));
            bullets.push(new NormalBullet(this.x + 10, this.y + 4));
        }

        // Fire missile if player has missile enabled
        if (player.hasMissile) {
            bullets.push(new Missile(this.x + 6, this.y + 6, 1));
            // Alternating or dual ceiling missile if high level
            if (this.index % 2 === 1) {
                bullets.push(new Missile(this.x + 6, this.y - 6, -1));
            }
        }
    }

    draw(ctx) {
        ctx.save();
        const pulse = Math.sin(this.animTimer) * 2;

        // Outer fiery glow
        const grad = ctx.createRadialGradient(this.x, this.y, 2, this.x, this.y, 14 + pulse);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#ffff33');
        grad.addColorStop(0.7, '#ff3300');
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 14 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Orbiting sparks
        for (let i = 0; i < 3; i++) {
            const angle = this.animTimer * 1.5 + (i * Math.PI * 2) / 3;
            const ox = this.x + Math.cos(angle) * 11;
            const oy = this.y + Math.sin(angle) * 11;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(ox - 1.5, oy - 1.5, 3, 3);
        }
        ctx.restore();
    }
}
