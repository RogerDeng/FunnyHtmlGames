/**
 * Salamander Boss Entities
 * Stage 1 Boss: Golen (Brain Eye Organism)
 * Stage 2 Boss: Intruder (Fire Dragon)
 */
import { EnemyBullet } from './weapons.js';
import { sfx } from '../audio/soundEffects.js';

// Stage 1 Boss: Golen
export class BossGolen {
    constructor() {
        this.x = 850; // starts off screen, flies in to ~620
        this.targetX = 640;
        this.y = 300;
        this.baseY = 300;
        this.radius = 55;
        this.hp = 80;
        this.maxHp = 80;
        this.alive = true;
        this.score = 10000;
        this.hitFlash = 0;

        // Eye state: 0 (closed), 1 (opening), 2 (open), 3 (closing)
        this.eyeState = 0;
        this.eyeTimer = 0;
        this.eyeOpenRatio = 0; // 0 (shut) to 1 (wide open)

        // Arms animation
        this.armAngle = 0;
        this.time = 0;

        // Defeat animation
        this.dying = false;
        this.deathTimer = 150;
    }

    update(player, enemyBullets, particles) {
        this.time += 0.04;

        // Death sequence
        if (this.dying) {
            this.deathTimer--;
            if (this.deathTimer % 8 === 0) {
                const rx = this.x + (Math.random() * 120 - 60);
                const ry = this.y + (Math.random() * 140 - 70);
                particles.emitBossExplosion(rx, ry);
                sfx.playExplosion(this.deathTimer < 30 ? 'boss' : 'medium');
            }
            if (this.deathTimer <= 0) {
                this.alive = false;
            }
            return;
        }

        // Fly in
        if (this.x > this.targetX) {
            this.x -= 2.0;
        } else {
            // Gentle hovering
            this.y = this.baseY + Math.sin(this.time * 1.5) * 50;
        }

        // Arm swing oscillation
        this.armAngle = Math.sin(this.time * 2) * 0.45;

        // Eye state machine
        this.eyeTimer++;
        if (this.eyeState === 0) { // Closed
            this.eyeOpenRatio = 0;
            if (this.eyeTimer > 100) {
                this.eyeState = 1;
                this.eyeTimer = 0;
            }
        } else if (this.eyeState === 1) { // Opening
            this.eyeOpenRatio += 0.05;
            if (this.eyeOpenRatio >= 1) {
                this.eyeOpenRatio = 1;
                this.eyeState = 2;
                this.eyeTimer = 0;
                // Fire spread bio needles on full open!
                this.fireNeedleBurst(player, enemyBullets);
            }
        } else if (this.eyeState === 2) { // Open (Vulnerable)
            this.eyeOpenRatio = 1;
            if (this.eyeTimer % 45 === 0) {
                this.fireNeedleBurst(player, enemyBullets);
            }
            if (this.eyeTimer > 160) {
                this.eyeState = 3;
                this.eyeTimer = 0;
            }
        } else if (this.eyeState === 3) { // Closing
            this.eyeOpenRatio -= 0.05;
            if (this.eyeOpenRatio <= 0) {
                this.eyeOpenRatio = 0;
                this.eyeState = 0;
                this.eyeTimer = 0;
            }
        }

        if (this.hitFlash > 0) this.hitFlash--;
    }

    fireNeedleBurst(player, enemyBullets) {
        if (this.x > 750) return;
        const centerAngle = Math.atan2(player.y - this.y, player.x - (this.x - 30));
        const angles = [-0.35, -0.15, 0, 0.15, 0.35];

        angles.forEach(offset => {
            const angle = centerAngle + offset;
            const speed = 4.2;
            enemyBullets.push(new EnemyBullet(
                this.x - 35,
                this.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                'spine'
            ));
        });
    }

    // Bullet collision check
    checkHit(bullet, particles) {
        if (this.dying || !this.alive) return false;

        // Check if hitting eye weak point
        const eyeX = this.x - 30;
        const eyeY = this.y;
        const dx = bullet.x - eyeX;
        const dy = bullet.y - eyeY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 32) {
            if (this.eyeOpenRatio > 0.4) {
                // Vulnerable eye hit!
                const dmg = bullet.damage || 1;
                this.hp -= dmg;
                this.hitFlash = 5;
                sfx.playEnemyHit();
                particles.emitSpark(bullet.x, bullet.y, '#ff0055');

                if (this.hp <= 0) {
                    this.dying = true;
                    sfx.playExplosion('boss');
                }
                return true;
            } else {
                // Eye is closed, deflect bullet!
                particles.emitSpark(bullet.x, bullet.y, '#ffffff');
                sfx.playShieldHit();
                return true;
            }
        }

        // Arm or outer body hit
        const bodyDist = Math.hypot(bullet.x - this.x, bullet.y - this.y);
        if (bodyDist < this.radius + 15) {
            // Armoured shell deflects
            particles.emitSpark(bullet.x, bullet.y, '#888888');
            return true;
        }

        return false;
    }

    draw(ctx) {
        if (!this.alive) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        const flash = this.hitFlash > 0;

        // 1. Upper and Lower Protective Tentacle Arms
        const drawArm = (dirY, angle) => {
            ctx.save();
            ctx.rotate(dirY * angle);
            ctx.fillStyle = flash ? '#ffffff' : '#882255';
            ctx.strokeStyle = '#330022';
            ctx.lineWidth = 3;

            // Arm segment 1
            ctx.beginPath();
            ctx.roundRect(-20, dirY * 40 - 20, 60, 36, 12);
            ctx.fill();
            ctx.stroke();

            // Arm claw tip
            ctx.beginPath();
            ctx.moveTo(40, dirY * 40 - 15);
            ctx.lineTo(-40, dirY * 65);
            ctx.lineTo(20, dirY * 35);
            ctx.closePath();
            ctx.fillStyle = flash ? '#ffffff' : '#661144';
            ctx.fill();
            ctx.stroke();

            ctx.restore();
        };

        drawArm(-1, this.armAngle);
        drawArm(1, -this.armAngle);

        // 2. Main Pulsing Brain Body
        const brainGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 65);
        if (flash) {
            brainGrad.addColorStop(0, '#ffffff');
            brainGrad.addColorStop(1, '#ff8888');
        } else {
            brainGrad.addColorStop(0, '#cc4477');
            brainGrad.addColorStop(0.7, '#881144');
            brainGrad.addColorStop(1, '#440022');
        }
        ctx.fillStyle = brainGrad;
        ctx.strokeStyle = '#220011';
        ctx.lineWidth = 4;

        ctx.beginPath();
        ctx.ellipse(0, 0, 50, 75, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Veins
        ctx.strokeStyle = flash ? '#ffcccc' : '#ff0055';
        ctx.lineWidth = 2;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(10, i * 25);
            ctx.quadraticCurveTo(30, i * 30 + Math.sin(this.time * 3 + i) * 6, 45, i * 20);
            ctx.stroke();
        }

        // 3. Central Eye Weak Point
        const eyeX = -30;
        const eyeY = 0;

        // Sclera (White)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, 26, 0, Math.PI * 2);
        ctx.fill();

        // Glowing Red Iris
        ctx.fillStyle = '#ff1122';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, 15, 0, Math.PI * 2);
        ctx.fill();

        // Slit Pupil
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(eyeX, eyeY, 5, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // 4. Biomechanical Eyelids (Opening / Closing)
        const lidHeight = 28 * (1 - this.eyeOpenRatio);
        ctx.fillStyle = flash ? '#ffffff' : '#661133';
        ctx.shadowBlur = 0;

        // Upper lid
        ctx.beginPath();
        ctx.rect(eyeX - 28, eyeY - 28, 56, lidHeight);
        ctx.fill();

        // Lower lid
        ctx.beginPath();
        ctx.rect(eyeX - 28, eyeY + 28 - lidHeight, 56, lidHeight);
        ctx.fill();

        ctx.restore();
    }
}

// Stage 2 Boss: Intruder (Fire Dragon)
export class BossFireDragon {
    constructor() {
        this.x = 850;
        this.y = 300;
        this.hp = 100;
        this.maxHp = 100;
        this.alive = true;
        this.score = 15000;
        this.hitFlash = 0;

        this.time = 0;
        this.radius = 28; // Head hitbox radius

        // 14 Body segments
        this.numSegments = 14;
        this.segments = [];
        for (let i = 0; i < this.numSegments; i++) {
            this.segments.push({
                x: 850 + i * 24,
                y: 300,
                radius: Math.max(12, 24 - i * 0.8)
            });
        }

        this.fireCooldown = 60;
        this.dying = false;
        this.deathTimer = 160;
    }

    update(player, enemyBullets, particles) {
        this.time += 0.035;

        // Defeat explosion sequence
        if (this.dying) {
            this.deathTimer--;
            if (this.deathTimer % 7 === 0) {
                // Explode along body towards head
                const segIdx = Math.floor(Math.random() * this.numSegments);
                const seg = this.segments[segIdx] || { x: this.x, y: this.y };
                particles.emitBossExplosion(seg.x, seg.y);
                sfx.playExplosion(this.deathTimer < 30 ? 'boss' : 'medium');
            }
            if (this.deathTimer <= 0) {
                this.alive = false;
            }
            return;
        }

        // Head movement: Lissajous curve weaving across the screen
        const enrage = this.hp < 35 ? 1.4 : 1.0;
        const targetX = 450 + Math.sin(this.time * 1.4 * enrage) * 260;
        const targetY = 300 + Math.cos(this.time * 2.2 * enrage) * 190;

        // Smoothly steer head towards parametric target
        this.x += (targetX - this.x) * 0.08 * enrage;
        this.y += (targetY - this.y) * 0.08 * enrage;

        // Segments follow via inverse kinematics distance constraint
        let prevX = this.x;
        let prevY = this.y;

        for (let i = 0; i < this.numSegments; i++) {
            const seg = this.segments[i];
            const dx = seg.x - prevX;
            const dy = seg.y - prevY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const targetDist = 22;

            if (dist > targetDist) {
                seg.x = prevX + (dx / dist) * targetDist;
                seg.y = prevY + (dy / dist) * targetDist;
            }

            prevX = seg.x;
            prevY = seg.y;
        }

        // Breathes triple fireballs
        this.fireCooldown--;
        if (this.fireCooldown <= 0 && this.x > 150 && this.x < 750) {
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            [-0.25, 0, 0.25].forEach(offset => {
                enemyBullets.push(new EnemyBullet(
                    this.x - 20,
                    this.y,
                    Math.cos(angle + offset) * 5.0,
                    Math.sin(angle + offset) * 5.0,
                    'fire'
                ));
            });
            this.fireCooldown = 80;
        }

        if (this.hitFlash > 0) this.hitFlash--;
    }

    checkHit(bullet, particles) {
        if (this.dying || !this.alive) return false;

        // Only HEAD is vulnerable!
        const dx = bullet.x - this.x;
        const dy = bullet.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.radius + 6) {
            const dmg = bullet.damage || 1;
            this.hp -= dmg;
            this.hitFlash = 4;
            sfx.playEnemyHit();
            particles.emitSpark(bullet.x, bullet.y, '#ffff00');

            if (this.hp <= 0) {
                this.dying = true;
                sfx.playExplosion('boss');
            }
            return true;
        }

        // Body segments deflect
        for (let seg of this.segments) {
            if (Math.hypot(bullet.x - seg.x, bullet.y - seg.y) < seg.radius + 4) {
                particles.emitSpark(bullet.x, bullet.y, '#ff4400');
                return true;
            }
        }

        return false;
    }

    draw(ctx) {
        if (!this.alive) return;
        ctx.save();

        const flash = this.hitFlash > 0;
        const enrage = this.hp < 35;

        // 1. Draw Body Segments (From tail to neck)
        for (let i = this.numSegments - 1; i >= 0; i--) {
            const seg = this.segments[i];
            const pulse = Math.sin(this.time * 6 + i) * 2;
            const r = seg.radius + pulse;

            const grad = ctx.createRadialGradient(seg.x, seg.y, 2, seg.x, seg.y, r);
            if (flash) {
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(1, '#ffaaaa');
            } else if (enrage) {
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.4, '#ffff33');
                grad.addColorStop(1, '#ff3300');
            } else {
                grad.addColorStop(0, '#ffff55');
                grad.addColorStop(0.5, '#ff4400');
                grad.addColorStop(1, '#990000');
            }

            ctx.fillStyle = grad;
            ctx.shadowColor = '#ff3300';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(seg.x, seg.y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // 2. Draw Dragon Head
        ctx.translate(this.x, this.y);

        // Head orientation towards movement or player
        const nextSeg = this.segments[0];
        const angle = Math.atan2(this.y - nextSeg.y, this.x - nextSeg.x);
        ctx.rotate(angle);

        // Head flame mane
        ctx.fillStyle = flash ? '#ffffff' : (enrage ? '#ffff66' : '#ff3300');
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-25, -28);
        ctx.lineTo(-10, -8);
        ctx.lineTo(-30, 0);
        ctx.lineTo(-10, 8);
        ctx.lineTo(-25, 28);
        ctx.closePath();
        ctx.fill();

        // Main skull
        ctx.fillStyle = flash ? '#ffffff' : (enrage ? '#ffffaa' : '#ff8800');
        ctx.beginPath();
        ctx.ellipse(5, 0, 24, 16, 0, 0, Math.PI * 2);
        ctx.fill();

        // Jaws & Fangs
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(22, -8);
        ctx.lineTo(28, -2);
        ctx.lineTo(20, 0);
        ctx.lineTo(28, 2);
        ctx.lineTo(22, 8);
        ctx.closePath();
        ctx.fill();

        // Blazing Dragon Eye
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(8, -6, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
