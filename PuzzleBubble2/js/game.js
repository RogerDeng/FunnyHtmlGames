/**
 * Puzzle Bubble - Main Game Controller & Loop
 */
class BubbleGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Logical dimensions
    this.width = 440;
    this.height = 660;
    this.bubbleRadius = 27.5; // 440 / (8 * 2) = 27.5

    // High DPI Canvas Scaling
    this.setupCanvasDPI();

    // Systems
    this.audio = new SoundEffects();
    this.particles = new ParticleSystem();
    this.grid = new HexGrid(this.width, this.height, 8, this.bubbleRadius);
    this.cannon = new Cannon(this.width, this.height, this.bubbleRadius, this.grid);
    this.levelManager = new LevelManager(this.grid);

    // Preload Level 1 bubbles for background aesthetics
    this.levelManager.loadLevel(0);
    this.cannon.resetBubbles();

    // Game States
    this.state = 'START'; // START, PLAYING, SHOOTING, GAME_OVER, VICTORY, PAUSED
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('puzzle_bubble_high_score') || '0', 10);
    this.combo = 0;
    this.endlessWave = 1;

    // Projectile (flying bubble)
    this.flyingBubble = null;
    this.bubbleSpeed = 13;

    // Falling / Dropping bubbles physics
    this.fallingBubbles = [];

    // Screen Shake Effect
    this.shakeDuration = 0;
    this.shakeIntensity = 0;

    // Score Buckets at bottom
    this.scoreBuckets = [
      { minX: 0, maxX: 88, score: 50, label: '50' },
      { minX: 88, maxX: 176, score: 100, label: '100' },
      { minX: 176, maxX: 264, score: 250, label: '250' },
      { minX: 264, maxX: 352, score: 100, label: '100' },
      { minX: 352, maxX: 440, score: 50, label: '50' }
    ];

    // Bind event listeners
    this.bindEvents();

    // Update initial UI
    this.updateHUD();

    // Start Game Animation Loop
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  setupCanvasDPI() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  startLevel(levelIdx = 0) {
    const lvl = this.levelManager.loadLevel(levelIdx);
    this.cannon.foulMax = lvl.foulMax || 5;
    this.cannon.resetBubbles();
    this.particles.clear();
    this.fallingBubbles = [];
    this.combo = 0;
    this.state = 'PLAYING';
    this.updateHUD();
    this.hideModals();
  }

  startEndless(wave = 1) {
    this.endlessWave = wave;
    const info = this.levelManager.loadEndless(wave);
    this.cannon.foulMax = info.foulMax || 4;
    this.cannon.resetBubbles();
    this.particles.clear();
    this.fallingBubbles = [];
    this.combo = 0;
    this.state = 'PLAYING';
    this.updateHUD();
    this.hideModals();
  }

  restartCurrent() {
    if (this.levelManager.isEndless) {
      this.startEndless(this.endlessWave);
    } else {
      this.startLevel(this.levelManager.currentLevelIndex);
    }
  }

  nextLevel() {
    if (this.levelManager.isEndless) {
      this.startEndless(this.endlessWave + 1);
    } else {
      const nextIdx = this.levelManager.currentLevelIndex + 1;
      if (nextIdx < this.levelManager.totalLevels) {
        this.startLevel(nextIdx);
      } else {
        // Completed all levels -> transition to endless!
        this.startEndless(1);
      }
    }
  }

  // Trigger screen shake (for ceiling drops or large combos)
  shake(intensity = 6, duration = 16) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  // Shoot the current bubble
  shoot() {
    if (this.state !== 'PLAYING' || this.flyingBubble) return;

    this.audio.playShoot();

    const dirX = Math.cos(this.cannon.angle);
    const dirY = Math.sin(this.cannon.angle);

    this.flyingBubble = {
      x: this.cannon.x,
      y: this.cannon.y,
      vx: dirX * this.bubbleSpeed,
      vy: dirY * this.bubbleSpeed,
      colorId: this.cannon.currentBubbleColor,
      radius: this.bubbleRadius
    };

    this.cannon.reload();
    this.state = 'SHOOTING';
  }

  // Swap ready bubble and reserve bubble
  swapBubble() {
    if (this.state !== 'PLAYING' && this.state !== 'SHOOTING') return;
    this.cannon.swap();
    this.audio.playSwap();
  }

  // Handle collision and snapping
  handleSnap(flying, hit) {
    const snapCell = this.grid.findBestSnapCell(flying.x, flying.y, hit);
    if (!snapCell) {
      // Emergency: could not find snap cell, trigger game over
      this.triggerGameOver();
      return;
    }

    // Place bubble into grid
    this.grid.grid[snapCell.r][snapCell.c] = {
      colorId: flying.colorId,
      scale: 1
    };
    this.audio.playSnap();

    // Check Match-3+
    const matches = this.grid.findMatches(snapCell.r, snapCell.c);

    if (matches.length >= 3) {
      // Successful match!
      this.combo++;
      const matchScore = matches.length * 10 * this.combo;
      this.addScore(matchScore);

      // Sound & Particle effects
      this.audio.playPop(this.combo);

      for (const m of matches) {
        const pos = this.grid.getCoord(m.r, m.c);
        const color = BUBBLE_COLORS[flying.colorId].main;
        this.particles.spawnPop(pos.x, pos.y, color);
        this.grid.grid[m.r][m.c] = null; // remove from grid
      }

      const snapPos = this.grid.getCoord(snapCell.r, snapCell.c);
      const comboText = this.combo > 1 ? `+${matchScore} (COMBO x${this.combo}!)` : `+${matchScore}`;
      this.particles.spawnText(snapPos.x, snapPos.y, comboText, '#ffe600', 18);

      // Check Floating / Disconnected bubbles
      const floating = this.grid.findFloatingBubbles();
      if (floating.length > 0) {
        this.audio.playDrop();
        let dropBonus = 0;

        for (let i = 0; i < floating.length; i++) {
          const fb = floating[i];
          this.grid.grid[fb.r][fb.c] = null;

          // Convert to falling physics bubble
          this.fallingBubbles.push({
            x: fb.x,
            y: fb.y,
            vx: (Math.random() - 0.5) * 3,
            vy: -1.5 - Math.random() * 2, // slight upward hop before falling
            colorId: fb.colorId,
            radius: this.bubbleRadius,
            scored: false
          });

          dropBonus += 20 * (i + 1);
        }

        this.addScore(dropBonus);
        this.particles.spawnText(
          this.width / 2,
          this.height / 2 - 40,
          `掉落獎勵 +${dropBonus}！`,
          '#00e676',
          22
        );
      }

      this.cannon.recordHit();

      // Check Victory
      if (this.grid.isCleared()) {
        this.triggerVictory();
        return;
      }
    } else {
      // Missed match -> Reset combo & record foul
      this.combo = 0;
      const shouldDropCeiling = this.cannon.recordMiss();

      if (shouldDropCeiling) {
        this.grid.lowerCeiling();
        this.audio.playCeilingWarning();
        this.shake(8, 20);
        this.particles.spawnText(this.width / 2, this.grid.ceilingOffset + 20, '天花板下壓！', '#ff3366', 20);
      }

      // Check Game Over (crossed death line)
      if (this.grid.isGameOver()) {
        this.triggerGameOver();
        return;
      }
    }

    // Done resolving shot, return to PLAYING state
    this.flyingBubble = null;
    this.state = 'PLAYING';
    this.updateHUD();
  }

  addScore(points) {
    this.score += points;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('puzzle_bubble_high_score', this.highScore.toString());
    }
    this.updateHUD();
  }

  triggerVictory() {
    this.state = 'VICTORY';
    this.flyingBubble = null;
    this.audio.playVictory();
    this.particles.spawnVictoryConfetti(this.width, this.height);
    this.showModal('victoryModal');
    const clearBonus = 1000;
    this.addScore(clearBonus);
  }

  triggerGameOver() {
    this.state = 'GAME_OVER';
    this.flyingBubble = null;
    this.audio.playGameOver();
    this.showModal('gameOverModal');
  }

  // Update loop
  update(dt) {
    this.cannon.update();
    this.particles.update();

    // Screen Shake decay
    if (this.shakeDuration > 0) {
      this.shakeDuration--;
    }

    // Update Flying Projectile Bubble
    if (this.flyingBubble) {
      const fb = this.flyingBubble;
      fb.x += fb.vx;
      fb.y += fb.vy;

      // Left Wall Bounce
      if (fb.x - fb.radius <= 0) {
        fb.x = fb.radius;
        fb.vx = -fb.vx;
        this.audio.playBounce();
      }
      // Right Wall Bounce
      else if (fb.x + fb.radius >= this.width) {
        fb.x = this.width - fb.radius;
        fb.vx = -fb.vx;
        this.audio.playBounce();
      }

      // Check Collision with Ceiling or Grid Bubbles
      const hit = this.grid.checkCollision(fb.x, fb.y);
      if (hit) {
        this.handleSnap(fb, hit);
      }
    }

    // Update Falling Disconnected Bubbles Physics
    for (let i = this.fallingBubbles.length - 1; i >= 0; i--) {
      const fb = this.fallingBubbles[i];
      fb.x += fb.vx;
      fb.y += fb.vy;
      fb.vy += 0.55; // gravity

      // Wall bounce
      if (fb.x - fb.radius < 0) {
        fb.x = fb.radius;
        fb.vx = -fb.vx * 0.7;
      } else if (fb.x + fb.radius > this.width) {
        fb.x = this.width - fb.radius;
        fb.vx = -fb.vx * 0.7;
      }

      // Bottom score bucket check
      if (fb.y >= this.height - 35 && !fb.scored) {
        fb.scored = true;
        for (const bucket of this.scoreBuckets) {
          if (fb.x >= bucket.minX && fb.x <= bucket.maxX) {
            this.addScore(bucket.score);
            this.particles.spawnText(fb.x, this.height - 45, `+${bucket.score}`, '#4da6ff', 16);
            break;
          }
        }
      }

      // Remove after falling beyond canvas bottom
      if (fb.y > this.height + fb.radius * 2) {
        this.fallingBubbles.splice(i, 1);
      }
    }
  }

  // Render loop
  draw() {
    this.ctx.save();

    // Apply Screen Shake if active
    if (this.shakeDuration > 0) {
      const offsetX = (Math.random() - 0.5) * this.shakeIntensity;
      const offsetY = (Math.random() - 0.5) * this.shakeIntensity;
      this.ctx.translate(offsetX, offsetY);
    }

    // 1. Clear background
    this.ctx.fillStyle = '#0f1423';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Subtle background grid stars / pattern
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }

    // 2. Draw Bottom Score Buckets
    this.drawScoreBuckets();

    // 3. Draw Grid (Bubbles, Ceiling, Hazard Lines)
    this.grid.draw(this.ctx);

    // 4. Draw Falling Bubbles
    for (const fb of this.fallingBubbles) {
      HexGrid.renderBubble(this.ctx, fb.x, fb.y, fb.radius, fb.colorId);
    }

    // 5. Draw Flying Projectile Bubble
    if (this.flyingBubble) {
      HexGrid.renderBubble(
        this.ctx,
        this.flyingBubble.x,
        this.flyingBubble.y,
        this.flyingBubble.radius,
        this.flyingBubble.colorId
      );
    }

    // 6. Draw Cannon & Aiming Line
    this.cannon.draw(this.ctx);

    // 7. Draw Particles and Floating Texts
    this.particles.draw(this.ctx);

    this.ctx.restore();
  }

  drawScoreBuckets() {
    const bucketY = this.height - 24;
    const bucketH = 24;

    for (let i = 0; i < this.scoreBuckets.length; i++) {
      const b = this.scoreBuckets[i];
      // Alternate bucket colors
      this.ctx.fillStyle = (i % 2 === 0) ? '#182038' : '#141a2e';
      this.ctx.fillRect(b.minX, bucketY, b.maxX - b.minX, bucketH);

      // Separator pin
      this.ctx.strokeStyle = '#323d5e';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(b.maxX, bucketY - 4);
      this.ctx.lineTo(b.maxX, this.height);
      this.ctx.stroke();

      // Bucket label text
      this.ctx.fillStyle = '#65749c';
      this.ctx.font = 'bold 11px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(b.label, (b.minX + b.maxX) / 2, bucketY + 16);
    }
  }

  loop(timestamp) {
    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;

    if (this.state !== 'PAUSED') {
      this.update(dt);
    }
    this.draw();

    requestAnimationFrame((t) => this.loop(t));
  }

  // Update DOM HUD elements
  updateHUD() {
    const scoreEl = document.getElementById('currentScore');
    const highScoreEl = document.getElementById('highScore');
    const levelNameEl = document.getElementById('levelName');

    if (scoreEl) scoreEl.textContent = this.score;
    if (highScoreEl) highScoreEl.textContent = this.highScore;
    if (levelNameEl) {
      if (this.levelManager.isEndless) {
        levelNameEl.textContent = `無盡模式 #${this.endlessWave}`;
      } else {
        levelNameEl.textContent = `第 ${this.levelManager.currentLevelIndex + 1} 關`;
      }
    }
  }

  showModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.add('active');
    }
    // Update victory or game over final score text
    const finalScoreEl = modal.querySelector('.final-score');
    if (finalScoreEl) {
      finalScoreEl.textContent = this.score;
    }
  }

  hideModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach((m) => m.classList.remove('active'));
  }

  bindEvents() {
    // Canvas Aiming (Mouse)
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.width / rect.width;
      const scaleY = this.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;
      this.cannon.aimAt(mouseX, mouseY);
    });

    // Canvas Click (Shoot)
    this.canvas.addEventListener('click', (e) => {
      this.audio.ensureContext();
      // Check if clicking near swap button or cannon reserve bubble
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.width / rect.width;
      const scaleY = this.height / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      const distToReserve = Math.hypot(clickX - this.cannon.reserveX, clickY - this.cannon.reserveY);
      if (distToReserve <= this.bubbleRadius * 1.5) {
        this.swapBubble();
        return;
      }

      this.shoot();
    });

    // Prevent context menu and allow right click to swap
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.swapBubble();
    });

    // Touch Support for Mobile
    let isTouching = false;
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.audio.ensureContext();
      isTouching = true;
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.width / rect.width;
      const scaleY = this.height / rect.height;
      const touchX = (touch.clientX - rect.left) * scaleX;
      const touchY = (touch.clientY - rect.top) * scaleY;

      const distToReserve = Math.hypot(touchX - this.cannon.reserveX, touchY - this.cannon.reserveY);
      if (distToReserve <= this.bubbleRadius * 1.5) {
        this.swapBubble();
        isTouching = false;
        return;
      }

      this.cannon.aimAt(touchX, touchY);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!isTouching) return;
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.width / rect.width;
      const scaleY = this.height / rect.height;
      const touchX = (touch.clientX - rect.left) * scaleX;
      const touchY = (touch.clientY - rect.top) * scaleY;
      this.cannon.aimAt(touchX, touchY);
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (isTouching) {
        isTouching = false;
        this.shoot();
      }
    }, { passive: false });

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.swapBubble();
      } else if (e.code === 'ArrowLeft') {
        this.cannon.angle = Math.max(this.cannon.minAngle, this.cannon.angle - 0.05);
      } else if (e.code === 'ArrowRight') {
        this.cannon.angle = Math.min(this.cannon.maxAngle, this.cannon.angle + 0.05);
      } else if (e.code === 'ArrowUp') {
        this.shoot();
      }
    });

    // UI Buttons
    const swapBtn = document.getElementById('btnSwap');
    if (swapBtn) {
      swapBtn.addEventListener('click', () => {
        this.audio.ensureContext();
        this.swapBubble();
      });
    }

    const muteBtn = document.getElementById('btnMute');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        this.audio.ensureContext();
        const muted = this.audio.toggleMute();
        muteBtn.textContent = muted ? '🔇 靜音' : '🔊 音效';
      });
    }

    const restartBtn = document.getElementById('btnRestart');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        this.audio.ensureContext();
        this.restartCurrent();
      });
    }

    const modeBtn = document.getElementById('btnMode');
    if (modeBtn) {
      modeBtn.addEventListener('click', () => {
        this.audio.ensureContext();
        if (this.levelManager.isEndless) {
          this.startLevel(0);
          modeBtn.textContent = '🕹️ 切換無盡模式';
        } else {
          this.startEndless(1);
          modeBtn.textContent = '🎯 切換關卡模式';
        }
      });
    }

    // Modal Action Buttons
    document.querySelectorAll('.btn-next-level').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.audio.ensureContext();
        this.nextLevel();
      });
    });

    document.querySelectorAll('.btn-retry').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.audio.ensureContext();
        this.restartCurrent();
      });
    });

    document.querySelectorAll('.btn-start-game').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.audio.ensureContext();
        this.startLevel(0);
      });
    });
  }
}

// Instantiate on window load
window.addEventListener('DOMContentLoaded', () => {
  window.game = new BubbleGame();
});
