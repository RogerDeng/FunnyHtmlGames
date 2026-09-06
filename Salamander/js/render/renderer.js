/**
 * Salamander Game Renderer
 * Handles multi-layer parallax scrolling, retro CRT scanlines, HUD, and Boss Warning banner.
 */
export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.scanlinesEnabled = true;

        // Parallax stars
        this.stars = [];
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: Math.random() * 800,
                y: Math.random() * 600,
                speed: 0.5 + Math.random() * 2.5,
                size: Math.random() > 0.8 ? 2 : 1,
                color: Math.random() > 0.5 ? '#ffffff' : '#88ddff'
            });
        }
    }

    clear() {
        this.ctx.fillStyle = '#050510';
        this.ctx.fillRect(0, 0, 800, 600);
    }

    // Parallax background
    drawBackground(stageIndex, scrollDist) {
        const ctx = this.ctx;

        // 1. Stars layer
        for (let star of this.stars) {
            star.x -= star.speed;
            if (star.x < 0) {
                star.x = 800;
                star.y = Math.random() * 600;
            }
            ctx.fillStyle = star.color;
            ctx.fillRect(star.x, star.y, star.size, star.size);
        }

        // 2. Stage specific background theme
        if (stageIndex === 1) {
            // Bio-Organic pulsing tissues & distant nebulae
            const grad = ctx.createRadialGradient(400, 300, 50, 400, 300, 400);
            grad.addColorStop(0, 'rgba(40, 10, 30, 0.4)');
            grad.addColorStop(1, 'rgba(5, 5, 15, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 800, 600);

            // Floating organic vein strands
            ctx.strokeStyle = 'rgba(120, 20, 60, 0.2)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            const offset = (scrollDist * 0.4) % 800;
            ctx.moveTo(-offset, 150);
            ctx.bezierCurveTo(200 - offset, 250, 600 - offset, 80, 800 - offset, 200);
            ctx.moveTo(800 - offset, 200);
            ctx.bezierCurveTo(1000 - offset, 250, 1400 - offset, 80, 1600 - offset, 200);
            ctx.stroke();
        } else if (stageIndex === 2) {
            // Blazing solar corona & sun flares
            const sunGrad = ctx.createRadialGradient(100, 300, 100, 100, 300, 700);
            sunGrad.addColorStop(0, 'rgba(255, 68, 0, 0.35)');
            sunGrad.addColorStop(0.5, 'rgba(180, 20, 0, 0.15)');
            sunGrad.addColorStop(1, 'rgba(5, 5, 15, 0)');
            ctx.fillStyle = sunGrad;
            ctx.fillRect(0, 0, 800, 600);
        }
    }

    // Boss Warning Banner
    drawWarning(timer) {
        const ctx = this.ctx;
        ctx.save();
        const flash = Math.floor(timer / 10) % 2 === 0;

        // Diagonal hazard stripes banner
        ctx.fillStyle = flash ? 'rgba(220, 20, 20, 0.85)' : 'rgba(30, 0, 0, 0.85)';
        ctx.fillRect(0, 240, 800, 120);

        // Yellow borders
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(0, 236, 800, 4);
        ctx.fillRect(0, 360, 800, 4);

        ctx.font = 'bold 32px "Courier New", monospace, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10;
        ctx.fillText('WARNING !!', 400, 280);

        ctx.font = 'bold 18px "Courier New", monospace, sans-serif';
        ctx.fillStyle = '#ffff55';
        ctx.fillText('A HUGE ENEMY ORGANISM IS APPROACHING FAST', 400, 320);

        ctx.restore();
    }

    // In-game HUD (Scores, Lives, Weapon Equipment Bar, Boss HP)
    drawHUD(player, currentStage, highScore) {
        const ctx = this.ctx;
        ctx.save();

        // 1. Top Bar: Scores & Lives
        ctx.font = 'bold 16px "Courier New", monospace, sans-serif';
        ctx.fillStyle = '#ff3333';
        ctx.fillText('1P', 30, 25);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(player.score.toString().padStart(6, '0'), 60, 25);

        ctx.fillStyle = '#ffaa00';
        ctx.fillText('HI-SCORE', 340, 25);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(Math.max(highScore, player.score).toString().padStart(6, '0'), 440, 25);

        // Lives icons
        ctx.fillStyle = '#33ccff';
        ctx.fillText('REST', 650, 25);
        for (let i = 0; i < Math.min(6, player.lives); i++) {
            ctx.save();
            ctx.translate(705 + i * 14, 20);
            ctx.fillStyle = player.shipType === 'lord_british' ? '#ff3333' : '#3399ff';
            ctx.beginPath();
            ctx.moveTo(6, 0);
            ctx.lineTo(-4, -4);
            ctx.lineTo(-2, 0);
            ctx.lineTo(-4, 4);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
        if (player.lives > 6) {
            ctx.fillStyle = '#ffffff';
            ctx.fillText('x' + player.lives, 765, 25);
        }

        // 2. Bottom Equipment Status Bar (Classic Gradius / Salamander HUD)
        const items = [
            { label: `SPEED [${player.speedLevel}]`, active: player.speedLevel > 1 },
            { label: 'MISSILE', active: player.hasMissile },
            { label: 'RIPPLE', active: player.activeWeapon === 'ripple' },
            { label: 'LASER', active: player.activeWeapon === 'laser' },
            { label: `OPTION [${player.options.length}]`, active: player.options.length > 0 },
            { label: `SHIELD [${player.shieldHp}]`, active: player.shieldHp > 0 }
        ];

        const barX = 40;
        const barY = 575;
        const itemW = 118;
        const itemH = 20;

        items.forEach((item, idx) => {
            const x = barX + idx * itemW;
            ctx.fillStyle = item.active ? '#ffaa00' : '#222233';
            ctx.strokeStyle = item.active ? '#ffffff' : '#444466';
            ctx.lineWidth = 1.5;

            ctx.fillRect(x, barY, itemW - 6, itemH);
            ctx.strokeRect(x, barY, itemW - 6, itemH);

            ctx.fillStyle = item.active ? '#000000' : '#8888aa';
            ctx.font = 'bold 11px "Courier New", monospace, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.label, x + (itemW - 6) / 2, barY + itemH / 2);
        });

        // 3. Boss Health Bar (if active)
        if (currentStage && currentStage.boss && currentStage.boss.alive) {
            const boss = currentStage.boss;
            const hpRatio = Math.max(0, boss.hp / boss.maxHp);

            ctx.fillStyle = '#ff2222';
            ctx.font = 'bold 14px "Courier New", monospace, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('BOSS', 400, 48);

            ctx.fillStyle = '#220000';
            ctx.fillRect(250, 56, 300, 10);

            ctx.fillStyle = hpRatio > 0.3 ? '#ffaa00' : '#ff0033';
            ctx.fillRect(250, 56, 300 * hpRatio, 10);

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(250, 56, 300, 10);
        }

        ctx.restore();
    }

    // CRT Scanline Overlay
    drawScanlines() {
        if (!this.scanlinesEnabled) return;
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        for (let y = 0; y < 600; y += 3) {
            ctx.fillRect(0, y, 800, 1.2);
        }

        // Vignette edges
        const grad = ctx.createRadialGradient(400, 300, 320, 400, 300, 520);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 800, 600);
        ctx.restore();
    }
}
