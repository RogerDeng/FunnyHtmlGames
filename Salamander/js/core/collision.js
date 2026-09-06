/**
 * Salamander Collision Utilities
 */
export class Collision {
    // Circle vs Circle
    static circleCircle(c1, c2) {
        const dx = c1.x - c2.x;
        const dy = c1.y - c2.y;
        const rSum = c1.radius + c2.radius;
        return (dx * dx + dy * dy) <= (rSum * rSum);
    }

    // Circle vs Axis-Aligned Bounding Box (AABB)
    static circleRect(c, rect) {
        const closestX = Math.max(rect.x, Math.min(c.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(c.y, rect.y + rect.height));
        const dx = c.x - closestX;
        const dy = c.y - closestY;
        return (dx * dx + dy * dy) <= (c.radius * c.radius);
    }

    // AABB vs AABB
    static rectRect(r1, r2) {
        return (
            r1.x < r2.x + r2.width &&
            r1.x + r1.width > r2.x &&
            r1.y < r2.y + r2.height &&
            r1.y + r1.height > r2.y
        );
    }

    // Point in Circle
    static pointInCircle(px, py, circle) {
        const dx = px - circle.x;
        const dy = py - circle.y;
        return (dx * dx + dy * dy) <= (circle.radius * circle.radius);
    }

    // Line segment vs Circle (for continuous Laser beam collision)
    static lineCircle(x1, y1, x2, y2, c) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) {
            return this.pointInCircle(x1, y1, c);
        }
        // Project circle center onto line segment
        const t = Math.max(0, Math.min(1, ((c.x - x1) * dx + (c.y - y1) * dy) / lenSq));
        const projX = x1 + t * dx;
        const projY = y1 + t * dy;
        return this.pointInCircle(projX, projY, c);
    }
}
