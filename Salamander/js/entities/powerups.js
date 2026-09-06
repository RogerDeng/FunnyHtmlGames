/**
 * Salamander Power-Up Capsules
 */
export const PowerUpType = {
    SPEED: 'S',
    MISSILE: 'M',
    RIPPLE: 'R',
    LASER: 'L',
    OPTION: 'O',
    SHIELD: 'F' // Force Field
};

export class PowerUpCapsule {
    constructor(x, y, type = PowerUpType.SPEED) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 12;
        this.width = 24;
        this.height = 24;
        this.vx = -1.2;
        this.vy = 0;
        this.baseY = y;
        this.timer = 0;
        this.alive = true;
    }

    update() {
        this.x += this.vx;
        this.timer += 0.05;
        this.y = this.baseY + Math.sin(this.timer) * 8;

        // Keep inside bounds
        if (this.y < 50) this.y = 50;
        if (this.y > 550) this.y = 550;

        if (this.x < -30) {
            this.alive = false;
        }
    }

    draw(ctx) {
        ctx.save();
        const pulse = Math.sin(this.timer * 3) * 0.15 + 0.85;

        // Colors per type
        let color = '#ffff00';
        let borderColor = '#ff9900';
        if (this.type === PowerUpType.SPEED) {
            color = '#33ccff';
            borderColor = '#0066ff';
        } else if (this.type === PowerUpType.MISSILE) {
            color = '#ff9933';
            borderColor = '#ff3300';
        } else if (this.type === PowerUpType.RIPPLE) {
            color = '#33ffaa';
            borderColor = '#00aa55';
        } else if (this.type === PowerUpType.LASER) {
            color = '#00ffff';
            borderColor = '#0077ff';
        } else if (this.type === PowerUpType.OPTION) {
            color = '#ff4444';
            borderColor = '#ffaa00';
        } else if (this.type === PowerUpType.SHIELD) {
            color = '#ff66ff';
            borderColor = '#cc00cc';
        }

        // Capsule Body
        ctx.fillStyle = '#111122';
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8 * pulse;

        ctx.beginPath();
        ctx.roundRect(this.x - 12, this.y - 10, 24, 20, 6);
        ctx.fill();
        ctx.stroke();

        // Inner glowing badge
        ctx.fillStyle = color;
        ctx.font = 'bold 12px "Courier New", monospace, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type, this.x, this.y + 1);

        ctx.restore();
    }
}
