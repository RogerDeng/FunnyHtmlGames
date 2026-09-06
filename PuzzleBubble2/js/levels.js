/**
 * Puzzle Bubble - Level Configurations & Generator
 * 
 * Color Mapping:
 *  0: Red (♥)
 *  1: Blue (◆)
 *  2: Green (♣)
 *  3: Yellow (★)
 *  4: Purple (●)
 *  5: Orange (▲)
 * -1: Empty cell
 */

const LEVELS = [
  {
    name: "第 1 關：新手入門",
    description: "基礎三色消除，熟悉瞄準與反彈手感",
    foulMax: 5,
    rows: [
      [0, 0, 1, 1, 2, 2, 0, 0],
      [0, 1, 1, 2, 2, 0, 0],
      [1, 1, 2, 2, 0, 0, 1, 1],
      [1, 2, 2, 0, 0, 1, 1]
    ]
  },
  {
    name: "第 2 關：彩虹條紋",
    description: "四色錯位條紋，尋找懸空支撐點進行大面積擊落！",
    foulMax: 5,
    rows: [
      [0, 1, 2, 3, 0, 1, 2, 3],
      [1, 2, 3, 0, 1, 2, 3],
      [2, 3, 0, 1, 2, 3, 0, 1],
      [3, 0, 1, 2, 3, 0, 1],
      [0, 1, 2, 3, 0, 1, 2, 3]
    ]
  },
  {
    name: "第 3 關：雙心相映",
    description: "由愛心圖騰與外圍護盾構成的精緻圖案",
    foulMax: 4,
    rows: [
      [1, 1, 0, 0, 0, 0, 1, 1],
      [1, 0, 0, 3, 0, 0, 1],
      [2, 0, 0, 3, 3, 0, 0, 2],
      [2, 2, 0, 3, 0, 2, 2],
      [-1, 2, 2, 0, 2, 2, -1],
      [-1, -1, 2, 2, -1, -1]
    ]
  },
  {
    name: "第 4 關：鑽石城堡",
    description: "利用牆壁反彈精準射入中空處瓦解整座城堡",
    foulMax: 4,
    rows: [
      [4, 4, 1, 1, 1, 1, 4, 4],
      [4, 1, -1, -1, -1, 1, 4],
      [1, -1, 3, 3, 3, -1, 1, -1],
      [1, 3, 5, 5, 3, 1, -1],
      [-1, 3, 5, 5, 3, -1, -1],
      [-1, -1, 3, 3, -1, -1],
      [-1, -1, -1, 3, -1, -1, -1]
    ]
  },
  {
    name: "第 5 關：星際旋渦",
    description: "螺旋環繞的五彩泡泡，考驗反彈射角！",
    foulMax: 4,
    rows: [
      [0, 0, 1, 1, 2, 2, 3, 3],
      [4, 0, 1, 2, 3, 4, 0],
      [4, 4, -1, -1, -1, 3, 3, 0],
      [5, -1, 2, 2, -1, 5, 1],
      [5, 5, -1, 2, 5, 5, 1],
      [-1, 4, 4, 4, 4, -1]
    ]
  },
  {
    name: "第 6 關：終極試煉",
    description: "高難度六色陣列，天花板壓迫更加迅速！",
    foulMax: 3,
    rows: [
      [0, 1, 2, 3, 4, 5, 0, 1],
      [2, 3, 4, 5, 0, 1, 2],
      [3, 4, 5, 0, 1, 2, 3, 4],
      [5, 0, 1, 2, 3, 4, 5],
      [0, 1, 2, 3, 4, 5, 0, 1],
      [2, 3, 4, 5, 0, 1, 2],
      [4, 5, 0, 1, 2, 3, 4, 5]
    ]
  }
];

class LevelManager {
  constructor(grid) {
    this.grid = grid;
    this.currentLevelIndex = 0;
    this.isEndless = false;
  }

  get totalLevels() {
    return LEVELS.length;
  }

  loadLevel(index) {
    this.isEndless = false;
    this.currentLevelIndex = Math.max(0, Math.min(index, LEVELS.length - 1));
    const lvl = LEVELS[this.currentLevelIndex];

    this.grid.resetGrid();

    const colorPalette = (typeof BUBBLE_COLORS !== 'undefined') ? BUBBLE_COLORS : ((typeof window !== 'undefined' && window.BUBBLE_COLORS) ? window.BUBBLE_COLORS : []);
    const maxColors = colorPalette.length || 6;

    for (let r = 0; r < lvl.rows.length; r++) {
      const rowData = lvl.rows[r];
      const maxCols = this.grid.getColsInRow(r);
      for (let c = 0; c < Math.min(rowData.length, maxCols); c++) {
        const val = rowData[c];
        if (val >= 0 && val < maxColors) {
          this.grid.grid[r][c] = { colorId: val };
        } else {
          this.grid.grid[r][c] = null;
        }
      }
    }

    return lvl;
  }

  // Generate an Endless Mode wave
  loadEndless(wave = 1) {
    this.isEndless = true;
    this.grid.resetGrid();

    const colorCount = Math.min(6, 3 + Math.floor(wave / 2));
    const startRows = Math.min(8, 4 + Math.floor(wave / 3));

    for (let r = 0; r < startRows; r++) {
      const cols = this.grid.getColsInRow(r);
      let clusterColor = Math.floor(Math.random() * colorCount);
      for (let c = 0; c < cols; c++) {
        // Form natural clusters of 2-3 same colors
        if (Math.random() < 0.45) {
          clusterColor = Math.floor(Math.random() * colorCount);
        }
        this.grid.grid[r][c] = { colorId: clusterColor };
      }
    }

    return {
      name: `無盡模式 - 第 ${wave} 波`,
      description: `當前難度：${colorCount} 種顏色，快速天花板壓迫！`,
      foulMax: Math.max(3, 5 - Math.floor(wave / 3))
    };
  }
}

if (typeof window !== 'undefined') {
  window.LevelManager = LevelManager;
  window.LEVELS = LEVELS;
}
if (typeof global !== 'undefined') {
  global.LevelManager = LevelManager;
  global.LEVELS = LEVELS;
}
