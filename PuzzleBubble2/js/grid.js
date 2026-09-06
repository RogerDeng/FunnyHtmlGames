/**
 * Puzzle Bubble - Hexagonal Grid & Matching Engine
 */

const BUBBLE_COLORS = [
  { id: 'red', name: '紅', main: '#ff3b5c', light: '#ff8599', dark: '#b30024', symbol: '♥' },
  { id: 'blue', name: '藍', main: '#1e88e5', light: '#64b5f6', dark: '#0d47a1', symbol: '◆' },
  { id: 'green', name: '綠', main: '#00c853', light: '#69f0ae', dark: '#00701a', symbol: '♣' },
  { id: 'yellow', name: '黃', main: '#ffd600', light: '#ffff52', dark: '#c79100', symbol: '★' },
  { id: 'purple', name: '紫', main: '#aa00ff', light: '#e1bee7', dark: '#6a0080', symbol: '●' },
  { id: 'orange', name: '橘', main: '#ff6d00', light: '#ffab40', dark: '#c43e00', symbol: '▲' }
];

class HexGrid {
  constructor(canvasWidth, canvasHeight, cols = 8, bubbleRadius = 24) {
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.cols = cols;
    this.radius = bubbleRadius;
    this.diameter = bubbleRadius * 2;
    // Row height for touching circles in staggered hexagonal layout
    this.rowHeight = Math.floor(bubbleRadius * Math.sqrt(3));
    this.ceilingOffset = 0; // Moves down when ceiling drops
    this.maxRows = 16;
    this.deathLineRow = 12; // Bottom danger threshold
    this.deathLineY = 0;

    // 2D Array [row][col], each element is null or { colorId: 0..5, scale: 1, popAnimation: 0 }
    this.grid = [];
    this.resetGrid();
    this.updateDeathLine();
  }

  resetGrid() {
    this.grid = [];
    for (let r = 0; r < this.maxRows; r++) {
      const rowCols = this.getColsInRow(r);
      const row = new Array(rowCols).fill(null);
      this.grid.push(row);
    }
    this.ceilingOffset = 0;
    this.updateDeathLine();
  }

  updateDeathLine() {
    // Danger line position from top
    this.deathLineY = this.height - 110;
  }

  getColsInRow(row) {
    // Even rows have this.cols bubbles, odd rows have this.cols - 1 bubbles
    return (row % 2 === 0) ? this.cols : this.cols - 1;
  }

  // Convert (row, col) grid coordinates to Canvas (x, y) center pixel coordinates
  getCoord(row, col) {
    const isOdd = (row % 2 === 1);
    const x = isOdd 
      ? this.radius * 2 + col * this.diameter 
      : this.radius + col * this.diameter;
    const y = this.ceilingOffset + this.radius + row * this.rowHeight;
    return { x, y };
  }

  // Draw a shiny, glassy bubble with optional symbol and 3D reflection
  static renderBubble(ctx, x, y, radius, colorIndex, scale = 1, alpha = 1) {
    if (colorIndex < 0 || colorIndex >= BUBBLE_COLORS.length) return;
    const color = BUBBLE_COLORS[colorIndex];

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.translate(x, y);
    if (scale !== 1) {
      ctx.scale(scale, scale);
    }

    const r = radius;

    // Outer subtle glow
    ctx.shadowColor = color.main;
    ctx.shadowBlur = 8;

    // Base body gradient
    const grad = ctx.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.1, 0, 0, r);
    grad.addColorStop(0, color.light);
    grad.addColorStop(0.65, color.main);
    grad.addColorStop(1, color.dark);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Reset shadow for crisp inner elements
    ctx.shadowBlur = 0;

    // Crisp inner rim highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Top-left glossy highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.35, r * 0.2, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Center cute symbol (Colorblind-friendly & Arcade Style)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = `bold ${Math.floor(r * 0.8)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(color.symbol, 0, 1);

    ctx.restore();
  }

  // Get all valid existing neighbors for cell (r, c)
  getNeighbors(r, c) {
    const isOdd = (r % 2 === 1);
    const neighbors = [];

    // Directions for (dr, dc)
    const offsets = isOdd
      ? [
          { r: 0, c: -1 },  // Left
          { r: 0, c: 1 },   // Right
          { r: -1, c: 0 },  // Top-Left
          { r: -1, c: 1 },  // Top-Right
          { r: 1, c: 0 },   // Bottom-Left
          { r: 1, c: 1 }    // Bottom-Right
        ]
      : [
          { r: 0, c: -1 },  // Left
          { r: 0, c: 1 },   // Right
          { r: -1, c: -1 }, // Top-Left
          { r: -1, c: 0 },  // Top-Right
          { r: 1, c: -1 },  // Bottom-Left
          { r: 1, c: 0 }    // Bottom-Right
        ];

    for (const off of offsets) {
      const nr = r + off.r;
      const nc = c + off.c;
      if (this.isValidCell(nr, nc)) {
        neighbors.push({ r: nr, c: nc });
      }
    }
    return neighbors;
  }

  isValidCell(r, c) {
    if (r < 0 || r >= this.maxRows) return false;
    const cols = this.getColsInRow(r);
    return c >= 0 && c < cols;
  }

  // Check collision between a moving bubble (x, y) and any existing bubble in the grid
  checkCollision(x, y) {
    // 1. Check top boundary / ceiling
    if (y - this.radius <= this.ceilingOffset) {
      return { type: 'ceiling' };
    }

    // 2. Check collision with existing bubbles
    // Distance threshold: 2 * radius - epsilon
    const hitThresholdSq = Math.pow(this.radius * 1.85, 2);

    for (let r = 0; r < this.maxRows; r++) {
      const cols = this.getColsInRow(r);
      for (let c = 0; c < cols; c++) {
        if (this.grid[r][c] !== null) {
          const pos = this.getCoord(r, c);
          const dx = x - pos.x;
          const dy = y - pos.y;
          const distSq = dx * dx + dy * dy;
          if (distSq <= hitThresholdSq) {
            return { type: 'bubble', r, c };
          }
        }
      }
    }

    return null;
  }

  // Check if an empty cell (r, c) is physically valid (connected to ceiling or has an occupied neighbor)
  isValidAttachment(r, c) {
    if (r === 0) return true; // Row 0 is attached to ceiling
    const neighbors = this.getNeighbors(r, c);
    return neighbors.some(n => this.grid[n.r][n.c] !== null);
  }

  // Find the best empty grid cell to snap the flying bubble into
  findBestSnapCell(x, y, collision) {
    let candidates = [];

    if (collision && collision.type === 'bubble') {
      // Find empty neighbors of the collided bubble
      const neighbors = this.getNeighbors(collision.r, collision.c);
      for (const n of neighbors) {
        if (this.grid[n.r][n.c] === null) {
          candidates.push(n);
        }
      }
    } else if (collision && collision.type === 'ceiling') {
      // Direct ceiling hit: check empty cells in row 0
      const cols = this.getColsInRow(0);
      for (let c = 0; c < cols; c++) {
        if (this.grid[0][c] === null) {
          candidates.push({ r: 0, c });
        }
      }
    }

    // If candidates empty, search nearby empty cells that have valid attachment
    if (candidates.length === 0) {
      for (let r = 0; r < this.maxRows; r++) {
        const cols = this.getColsInRow(r);
        for (let c = 0; c < cols; c++) {
          if (this.grid[r][c] === null && this.isValidAttachment(r, c)) {
            const pos = this.getCoord(r, c);
            const dist = Math.hypot(x - pos.x, y - pos.y);
            if (dist < this.diameter * 1.6) {
              candidates.push({ r, c });
            }
          }
        }
      }
    }

    // Secondary fallback: any row 0 empty cell
    if (candidates.length === 0) {
      const cols = this.getColsInRow(0);
      for (let c = 0; c < cols; c++) {
        if (this.grid[0][c] === null) {
          candidates.push({ r: 0, c });
        }
      }
    }

    // Pick candidate with minimum Euclidean distance to (x, y)
    let bestCell = null;
    let minDist = Infinity;
    for (const cell of candidates) {
      const pos = this.getCoord(cell.r, cell.c);
      const dist = Math.hypot(x - pos.x, y - pos.y);
      if (dist < minDist) {
        minDist = dist;
        bestCell = cell;
      }
    }

    return bestCell;
  }

  // BFS Match-3+ search from (startR, startC)
  findMatches(startR, startC) {
    const startBubble = this.grid[startR][startC];
    if (!startBubble) return [];

    const targetColor = startBubble.colorId;
    const matches = [];
    const queue = [{ r: startR, c: startC }];
    const visited = new Set();
    visited.add(`${startR},${startC}`);

    while (queue.length > 0) {
      const curr = queue.shift();
      matches.push(curr);

      const neighbors = this.getNeighbors(curr.r, curr.c);
      for (const n of neighbors) {
        const key = `${n.r},${n.c}`;
        if (!visited.has(key)) {
          const neighborBubble = this.grid[n.r][n.c];
          if (neighborBubble && neighborBubble.colorId === targetColor) {
            visited.add(key);
            queue.push(n);
          }
        }
      }
    }

    return matches;
  }

  // Find all floating / isolated bubbles not connected to the ceiling
  findFloatingBubbles() {
    const visited = new Set();
    const queue = [];

    // All bubbles in row 0 are connected to ceiling
    const colsInRow0 = this.getColsInRow(0);
    for (let c = 0; c < colsInRow0; c++) {
      if (this.grid[0][c] !== null) {
        queue.push({ r: 0, c });
        visited.add(`0,${c}`);
      }
    }

    // BFS walk from ceiling downwards
    while (queue.length > 0) {
      const curr = queue.shift();
      const neighbors = this.getNeighbors(curr.r, curr.c);
      for (const n of neighbors) {
        const key = `${n.r},${n.c}`;
        if (!visited.has(key)) {
          if (this.grid[n.r][n.c] !== null) {
            visited.add(key);
            queue.push(n);
          }
        }
      }
    }

    // Any non-null bubble not in visited is floating!
    const floating = [];
    for (let r = 0; r < this.maxRows; r++) {
      const cols = this.getColsInRow(r);
      for (let c = 0; c < cols; c++) {
        if (this.grid[r][c] !== null && !visited.has(`${r},${c}`)) {
          floating.push({
            r,
            c,
            colorId: this.grid[r][c].colorId,
            ...this.getCoord(r, c)
          });
        }
      }
    }

    return floating;
  }

  // Lower ceiling by 1 row height
  lowerCeiling() {
    this.ceilingOffset += this.rowHeight;
  }

  // Check if any bubble has reached or crossed the death line
  isGameOver() {
    for (let r = 0; r < this.maxRows; r++) {
      const cols = this.getColsInRow(r);
      for (let c = 0; c < cols; c++) {
        if (this.grid[r][c] !== null) {
          const pos = this.getCoord(r, c);
          if (pos.y + this.radius >= this.deathLineY) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Check if all bubbles are cleared
  isCleared() {
    for (let r = 0; r < this.maxRows; r++) {
      const cols = this.getColsInRow(r);
      for (let c = 0; c < cols; c++) {
        if (this.grid[r][c] !== null) {
          return false;
        }
      }
    }
    return true;
  }

  // Get active distinct colors remaining on the board (so launcher only serves available colors!)
  getActiveColorIds() {
    const colors = new Set();
    for (let r = 0; r < this.maxRows; r++) {
      const cols = this.getColsInRow(r);
      for (let c = 0; c < cols; c++) {
        if (this.grid[r][c] !== null) {
          colors.add(this.grid[r][c].colorId);
        }
      }
    }
    return Array.from(colors);
  }

  // Render the hexagonal grid, ceiling bar, and death line
  draw(ctx) {
    ctx.save();

    // 1. Draw Ceiling Bar with mechanical hazard stripes
    ctx.fillStyle = '#2a2f45';
    ctx.fillRect(0, 0, this.width, this.ceilingOffset);

    // Hazard stripe border on ceiling bottom edge
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(0, this.ceilingOffset - 5, this.width, 5);

    // Draw hazard pattern on the ceiling bar if offset > 0
    if (this.ceilingOffset > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, this.width, this.ceilingOffset);
      ctx.clip();
      ctx.strokeStyle = '#3d4463';
      ctx.lineWidth = 10;
      for (let x = -this.height; x < this.width + this.height; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + this.ceilingOffset, this.ceilingOffset);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Draw Danger Death Line
    ctx.strokeStyle = '#ff3366';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(0, this.deathLineY);
    ctx.lineTo(this.width, this.deathLineY);
    ctx.stroke();
    ctx.setLineDash([]);

    // "DANGER" tag text
    ctx.fillStyle = 'rgba(255, 51, 102, 0.6)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('DEADLINE ───', this.width - 12, this.deathLineY - 6);

    // 3. Draw All Grid Bubbles
    for (let r = 0; r < this.maxRows; r++) {
      const cols = this.getColsInRow(r);
      for (let c = 0; c < cols; c++) {
        const bubble = this.grid[r][c];
        if (bubble !== null) {
          const pos = this.getCoord(r, c);
          HexGrid.renderBubble(
            ctx,
            pos.x,
            pos.y,
            this.radius,
            bubble.colorId,
            bubble.scale || 1,
            bubble.alpha !== undefined ? bubble.alpha : 1
          );
        }
      }
    }

    ctx.restore();
  }
}

if (typeof window !== 'undefined') {
  window.HexGrid = HexGrid;
  window.BUBBLE_COLORS = BUBBLE_COLORS;
}
if (typeof global !== 'undefined') {
  global.HexGrid = HexGrid;
  global.BUBBLE_COLORS = BUBBLE_COLORS;
}
