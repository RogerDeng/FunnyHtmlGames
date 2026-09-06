/**
 * Puzzle Bubble - Cannon & Aiming System
 */
class Cannon {
  constructor(canvasWidth, canvasHeight, bubbleRadius, grid) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.radius = bubbleRadius;
    this.grid = grid;

    // Cannon pivot coordinates
    this.x = canvasWidth / 2;
    this.y = canvasHeight - 52;

    // Next bubble reserve position (to the bottom-left of cannon)
    this.reserveX = this.x - 70;
    this.reserveY = this.y + 12;

    // Aiming angle in radians (straight up is -Math.PI / 2)
    this.angle = -Math.PI / 2;
    this.minAngle = -Math.PI + 0.22; // ~-167 deg
    this.maxAngle = -0.22;           // ~-13 deg

    // Bubble states
    this.currentBubbleColor = 0;
    this.nextBubbleColor = 1;

    // Recoil animation
    this.recoil = 0;

    // Foul misses left until ceiling lowers (default 5)
    this.foulMax = 5;
    this.foulLeft = 5;

    // Visual pointer length
    this.barrelLength = 48;
  }

  // Set angle towards mouse / touch (targetX, targetY)
  aimAt(targetX, targetY) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;

    // If aiming below cannon, ignore or clamp to horizontal
    if (dy >= 0) return;

    let targetAngle = Math.atan2(dy, dx);
    this.angle = Math.max(this.minAngle, Math.min(this.maxAngle, targetAngle));
  }

  // Swap current bubble with next bubble
  swap() {
    const temp = this.currentBubbleColor;
    this.currentBubbleColor = this.nextBubbleColor;
    this.nextBubbleColor = temp;
  }

  // Load a new bubble after firing, ensuring the bubble color exists on board if possible
  reload() {
    this.currentBubbleColor = this.nextBubbleColor;
    this.nextBubbleColor = this.getRandomBoardColor();
    this.recoil = 8; // trigger recoil kickback
  }

  // Pick a random color from the active bubbles on the board
  getRandomBoardColor() {
    const activeColors = this.grid.getActiveColorIds();
    if (activeColors.length > 0) {
      const idx = Math.floor(Math.random() * activeColors.length);
      return activeColors[idx];
    }
    // Fallback to any color
    const palette = (typeof BUBBLE_COLORS !== 'undefined') ? BUBBLE_COLORS : ((typeof window !== 'undefined' && window.BUBBLE_COLORS) ? window.BUBBLE_COLORS : []);
    const maxColors = palette.length || 6;
    return Math.floor(Math.random() * Math.min(4, maxColors));
  }

  // Setup initial bubbles for a new level
  resetBubbles() {
    this.currentBubbleColor = this.getRandomBoardColor();
    this.nextBubbleColor = this.getRandomBoardColor();
    this.foulLeft = this.foulMax;
    this.recoil = 0;
    this.angle = -Math.PI / 2;
  }

  // Decrease foul count; returns true if ceiling should drop
  recordMiss() {
    this.foulLeft--;
    if (this.foulLeft <= 0) {
      this.foulLeft = this.foulMax;
      return true; // Trigger ceiling drop
    }
    return false;
  }

  // Reset or reward foul counter on successful pop
  recordHit() {
    // Keep foul counter or optionally reward
  }

  update() {
    if (this.recoil > 0) {
      this.recoil *= 0.85;
      if (this.recoil < 0.2) this.recoil = 0;
    }
  }

  // Calculate aiming trajectory line with wall reflections
  calculateTrajectory() {
    const points = [{ x: this.x, y: this.y }];
    let curX = this.x;
    let curY = this.y;
    let dirX = Math.cos(this.angle);
    let dirY = Math.sin(this.angle);

    const step = 4;
    const maxBounces = 2;
    let bounces = 0;
    const maxSteps = 300;

    for (let s = 0; s < maxSteps; s++) {
      curX += dirX * step;
      curY += dirY * step;

      // Check wall collision (left & right)
      if (curX <= this.radius) {
        curX = this.radius;
        dirX = -dirX;
        bounces++;
        points.push({ x: curX, y: curY });
        if (bounces > maxBounces) break;
      } else if (curX >= this.canvasWidth - this.radius) {
        curX = this.canvasWidth - this.radius;
        dirX = -dirX;
        bounces++;
        points.push({ x: curX, y: curY });
        if (bounces > maxBounces) break;
      }

      // Check if ray reaches ceiling or collides with grid bubble
      const hit = this.grid.checkCollision(curX, curY);
      if (hit) {
        points.push({ x: curX, y: curY });
        break;
      }
    }

    if (points.length === 1 || points[points.length - 1].x !== curX) {
      points.push({ x: curX, y: curY });
    }

    return points;
  }

  // Render cannon, aiming guide, bubbles, and foul dots
  draw(ctx) {
    ctx.save();

    // 1. Draw Aiming Guide Dashed Ray
    const trajPoints = this.calculateTrajectory();
    if (trajPoints.length > 1) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 6]);

      ctx.beginPath();
      ctx.moveTo(trajPoints[0].x, trajPoints[0].y);
      for (let i = 1; i < trajPoints.length; i++) {
        ctx.lineTo(trajPoints[i].x, trajPoints[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // End target reticle / ghost circle
      const endPoint = trajPoints[trajPoints.length - 1];
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(endPoint.x, endPoint.y, this.radius * 0.75, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. Draw Cannon Base Platform
    ctx.fillStyle = '#1e2438';
    ctx.beginPath();
    ctx.arc(this.x, this.y + 12, 38, Math.PI, 0);
    ctx.fill();

    ctx.strokeStyle = '#3d486d';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 3. Draw Rotating Cannon Barrel & Pointer
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Apply recoil translation along barrel
    const recoilOffset = -this.recoil;

    // Cannon guide arrow / barrel
    ctx.fillStyle = '#303b5a';
    ctx.fillRect(10 + recoilOffset, -8, this.barrelLength - 10, 16);

    ctx.strokeStyle = '#5a6d9e';
    ctx.lineWidth = 2;
    ctx.strokeRect(10 + recoilOffset, -8, this.barrelLength - 10, 16);

    // Arrow tip
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.moveTo(this.barrelLength + recoilOffset + 12, 0);
    ctx.lineTo(this.barrelLength + recoilOffset, -12);
    ctx.lineTo(this.barrelLength + recoilOffset, 12);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // 4. Draw Current Ready Bubble in Cannon center
    const recoilDx = Math.cos(this.angle) * (-this.recoil);
    const recoilDy = Math.sin(this.angle) * (-this.recoil);
    HexGrid.renderBubble(
      ctx,
      this.x + recoilDx,
      this.y + recoilDy,
      this.radius,
      this.currentBubbleColor
    );

    // 5. Draw Next Bubble in Reserve slot
    // Reserve slot pedestal
    ctx.fillStyle = '#161a29';
    ctx.beginPath();
    ctx.arc(this.reserveX, this.reserveY, this.radius + 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2f3956';
    ctx.lineWidth = 2;
    ctx.stroke();

    HexGrid.renderBubble(
      ctx,
      this.reserveX,
      this.reserveY,
      this.radius * 0.85,
      this.nextBubbleColor
    );

    // Reserve text badge
    ctx.fillStyle = '#8e9bbb';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NEXT', this.reserveX, this.reserveY + this.radius + 14);

    // Swap shortcut badge (SPACE / 點擊交換)
    ctx.fillStyle = '#ffd152';
    ctx.font = '10px sans-serif';
    ctx.fillText('⇄ 空白鍵', this.reserveX, this.reserveY - this.radius - 8);

    // 6. Draw Foul Miss Counter (dots on right side of cannon)
    const foulX = this.x + 60;
    const foulY = this.y + 10;
    ctx.fillStyle = '#8e9bbb';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PRESSURE', foulX, foulY - 18);

    for (let i = 0; i < this.foulMax; i++) {
      const dotX = foulX - 24 + i * 12;
      const dotY = foulY;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
      if (i < this.foulLeft) {
        ctx.fillStyle = '#00e676'; // safe dots
      } else {
        ctx.fillStyle = '#3b435b'; // spent dots
      }
      ctx.fill();
      ctx.strokeStyle = '#1b1f2e';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }
}

if (typeof window !== 'undefined') {
  window.Cannon = Cannon;
}
if (typeof global !== 'undefined') {
  global.Cannon = Cannon;
}
