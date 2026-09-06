// Quick Node.js simulation test for HexGrid logic
const fs = require('fs');

// Mock browser objects
global.window = {};

// Load scripts
require('../js/grid.js');
require('../js/levels.js');

const { HexGrid, BUBBLE_COLORS } = window;
const { LevelManager, LEVELS } = window;

console.log("=== Testing HexGrid & Matching Logic ===");

const grid = new HexGrid(440, 660, 8, 27.5);
const levelManager = new LevelManager(grid);

// Test 1: Load Level 0
const lvl0 = levelManager.loadLevel(0);
console.log(`Loaded Level: ${lvl0.name}`);
console.assert(grid.grid[0][0].colorId === 0, "Cell (0,0) should be Red (0)");
console.assert(grid.grid[0][2].colorId === 1, "Cell (0,2) should be Blue (1)");

// Test 2: Neighbors validation
const n00 = grid.getNeighbors(0, 0);
console.log("Neighbors of (0,0):", n00);
console.assert(n00.length === 2, "Top-left corner (0,0) has 2 valid neighbors (0,1) and (1,0)");

const n11 = grid.getNeighbors(1, 1);
console.log("Neighbors of (1,1):", n11);
console.assert(n11.length === 6, "Internal cell (1,1) should have 6 valid neighbors");

// Test 3: Match-3 BFS
// In level 0: row 0 has [0, 0, ...], row 1 has [0, ...]
const matches = grid.findMatches(0, 0);
console.log(`Matches from (0,0): found ${matches.length} matching red bubbles`);
console.assert(matches.length >= 3, "Expected at least 3 matching red bubbles");

// Test 4: Floating bubble detection
// Clear an entire row and see if disconnected bubbles are detected
const grid2 = new HexGrid(440, 660, 8, 27.5);
// Put row 0 bubble
grid2.grid[0][0] = { colorId: 0 };
// Put row 2 bubble (isolated, row 1 is empty)
grid2.grid[2][0] = { colorId: 1 };

const floating = grid2.findFloatingBubbles();
console.log(`Floating bubbles found: ${floating.length}`);
console.assert(floating.length === 1, "Expected exactly 1 floating bubble at (2,0)");
console.assert(floating[0].r === 2 && floating[0].c === 0, "Floating bubble should be (2,0)");

// Test 5: Snapping validation when hitting the exposed bottom row of bubbles
const bottomBubblePos = grid.getCoord(3, 0); // Position of bubble in row 3, col 0
// Flying bubble approaches from below and hits (3, 0)
const flyingX = bottomBubblePos.x;
const flyingY = bottomBubblePos.y + 40; // just below it
const snapCell = grid.findBestSnapCell(flyingX, flyingY, { type: 'bubble', r: 3, c: 0 });
console.log("Snap cell for hit below (3,0):", snapCell);
console.assert(snapCell !== null, "Snap cell should be found below (3,0)");
console.assert(grid.grid[snapCell.r][snapCell.c] === null, "Snap cell must be currently empty");
console.assert(snapCell.r === 4, "Snap cell should be in row 4");

console.log("=== All Logic Tests Passed Successfully! ===");
