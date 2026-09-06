/**
 * Salamander Particle System
 * High-performance 2D canvas retro particle emitter.
 */
export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 500;
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= p.friction;
            p.vy *= p.friction;
            p.life -= p.decay;
            p.size = Math.max(0.5, p.size * p.sizeDecay);

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
            ctx.fillStyle = p.color;

            if (p.shape === 'ring') {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = p.lineWidth || 2;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius || p.size * 2, 0, Math.PI * 2);
                ctx.stroke();
            } else if (p.shape === 'rect') {
                ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    add(p) {
        if (this.particles.length >= this.maxParticles) {
            this.particles.shift(); // Evict oldest
        }
        this.particles.push({
            x: p.x,
            y: p.y,
            vx: p.vx || 0,
            vy: p.vy || 0,
            size: p.size || 3,
            sizeDecay: p.sizeDecay || 0.96,
            life: 1.0,
            decay: p.decay || 0.04,
            friction: p.friction || 0.98,
            color: p.color || '#fff',
            shape: p.shape || 'rect',
            radius: p.radius || 0,
            lineWidth: p.lineWidth || 2
        });
    }

    // Vic Viper / Ship thruster flame
    emitThruster(x, y, isRedShip = false) {
        const colors = isRedShip
            ? ['#ff3300', '#ff9900', '#ffff00', '#ffffff']
            : ['#00ccff', '#3388ff', '#99eeff', '#ffffff'];
        const color = colors[Math.floor(Math.random() * colors.length)];

        this.add({
            x: x + (Math.random() * 4 - 2),
            y: y + (Math.random() * 4 - 2),
            vx: -(2.5 + Math.random() * 3),
            vy: (Math.random() * 2 - 1) * 0.8,
            size: 2.5 + Math.random() * 2.5,
            sizeDecay: 0.93,
            decay: 0.07 + Math.random() * 0.05,
            friction: 0.96,
            color: color,
            shape: 'rect'
        });
    }

    // Standard enemy death explosion
    emitExplosion(x, y, count = 16, palette = ['#ffcc00', '#ff3300', '#ffffff', '#ff6600']) {
        // Shockwave ring
        this.add({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            size: 4,
            sizeDecay: 1.0,
            decay: 0.05,
            friction: 1.0,
            color: '#ffffff',
            shape: 'ring',
            radius: 8,
            lineWidth: 2
        });

        // Pixel blast
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.2 + Math.random() * 5.5;
            const color = palette[Math.floor(Math.random() * palette.length)];

            this.add({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 4,
                sizeDecay: 0.95,
                decay: 0.025 + Math.random() * 0.035,
                friction: 0.95,
                color: color,
                shape: 'rect'
            });
        }
    }

    // Large boss impact/destruction explosion
    emitBossExplosion(x, y) {
        this.emitExplosion(x, y, 35, ['#ffffff', '#ff9900', '#ff1100', '#ffea00', '#00e5ff']);
    }

    // Laser / Bullet impact spark
    emitSpark(x, y, color = '#00ffff') {
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.0 + Math.random() * 3.0;
            this.add({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2,
                sizeDecay: 0.9,
                decay: 0.08,
                friction: 0.92,
                color: color,
                shape: 'rect'
            });
        }
    }

    // Shield impact barrier wave
    emitShieldHit(x, y) {
        this.add({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            size: 2,
            sizeDecay: 1.0,
            decay: 0.06,
            friction: 1.0,
            color: '#33ccff',
            shape: 'ring',
            radius: 16,
            lineWidth: 3
        });
    }

    clear() {
        this.particles = [];
    }
}
