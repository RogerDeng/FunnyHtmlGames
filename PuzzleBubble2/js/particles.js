/**
 * Puzzle Bubble - Particle Effects & Floating Text System
 */
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
  }

  // Spawn bursting shards when a bubble pops
  spawnPop(x, y, color) {
    const count = 12 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 4.5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2.5 + Math.random() * 3.5,
        color: color,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.025,
        gravity: 0.12,
        type: 'spark'
      });
    }

    // Add a quick expanding shockwave ring
    this.particles.push({
      x: x,
      y: y,
      radius: 6,
      maxRadius: 28,
      color: color,
      alpha: 0.8,
      decay: 0.05,
      type: 'ring'
    });
  }

  // Spawn floating score / combo text
  spawnText(x, y, text, color = '#ffffff', fontSize = 18) {
    this.floatingTexts.push({
      x: x,
      y: y,
      text: text,
      color: color,
      fontSize: fontSize,
      alpha: 1,
      vy: -1.4,
      decay: 0.018,
      scale: 1.2
    });
  }

  // Confetti shower for level victory
  spawnVictoryConfetti(width, height) {
    const colors = ['#ff4d4d', '#4dff88', '#4da6ff', '#ffff4d', '#cc4dff', '#ffaa33'];
    for (let i = 0; i < 60; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.3),
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        width: 6 + Math.random() * 6,
        height: 10 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.008,
        gravity: 0.05,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        type: 'confetti'
      });
    }
  }

  update() {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (p.type === 'spark') {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.98;
        p.alpha -= p.decay;
      } else if (p.type === 'ring') {
        p.radius += (p.maxRadius - p.radius) * 0.2;
        p.alpha -= p.decay;
      } else if (p.type === 'confetti') {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotSpeed;
        p.alpha -= p.decay;
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= ft.decay;
      if (ft.scale > 1.0) {
        ft.scale -= 0.02;
      }
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    ctx.save();

    // Draw particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.radius * p.alpha), 0, Math.PI * 2);
        ctx.fill();

        // Glow
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
      } else if (p.type === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'confetti') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        ctx.restore();
      }
    }

    // Draw floating texts
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.translate(ft.x, ft.y);
      ctx.scale(ft.scale, ft.scale);
      ctx.font = `bold ${ft.fontSize}px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Outline
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 3.5;
      ctx.strokeText(ft.text, 0, 0);

      // Fill
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }

  clear() {
    this.particles = [];
    this.floatingTexts = [];
  }
}

window.ParticleSystem = ParticleSystem;
