/**
 * Salamander Input Manager
 * Handles Keyboard, Gamepad, Touch Controls & Konami Code.
 */
export class InputManager {
    constructor() {
        this.keys = {};
        this.justPressed = {};
        this.touchMove = { x: 0, y: 0 };
        this.touchShoot = false;
        this.autoFire = false;
        this.konamiSequence = [];
        this.targetKonami = [
            'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
            'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
            'b', 'a'
        ];
        this.onKonamiTriggered = null;

        this.initKeyboard();
    }

    initKeyboard() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            const code = e.code;

            if (!this.keys[code]) {
                this.justPressed[code] = true;
            }
            this.keys[code] = true;

            // Check Konami Code
            const checkVal = e.key.startsWith('Arrow') ? e.key : key;
            this.konamiSequence.push(checkVal);
            if (this.konamiSequence.length > 20) {
                this.konamiSequence.shift();
            }

            // Check if suffix matches
            const seqLen = this.targetKonami.length;
            if (this.konamiSequence.length >= seqLen) {
                const sub = this.konamiSequence.slice(-seqLen);
                let matched = true;
                for (let i = 0; i < seqLen; i++) {
                    if (sub[i].toLowerCase() !== this.targetKonami[i].toLowerCase()) {
                        matched = false;
                        break;
                    }
                }
                if (matched) {
                    this.konamiSequence = [];
                    if (this.onKonamiTriggered) {
                        this.onKonamiTriggered();
                    }
                }
            }

            // Prevent default page scroll on arrow keys or space
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    // Direction vector normalized: -1 to 1
    getDirection() {
        let dx = 0;
        let dy = 0;

        if (this.keys['ArrowLeft'] || this.keys['KeyA']) dx -= 1;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) dx += 1;
        if (this.keys['ArrowUp'] || this.keys['KeyW']) dy -= 1;
        if (this.keys['ArrowDown'] || this.keys['KeyS']) dy += 1;

        // Add touch analog movement if present
        if (this.touchMove.x !== 0 || this.touchMove.y !== 0) {
            dx += this.touchMove.x;
            dy += this.touchMove.y;
        }

        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 1) {
            dx /= len;
            dy /= len;
        }

        return { x: dx, y: dy };
    }

    isShooting() {
        return (
            this.keys['Space'] ||
            this.keys['KeyJ'] ||
            this.keys['KeyZ'] ||
            this.touchShoot ||
            this.autoFire
        );
    }

    isMissilePressed() {
        return this.keys['KeyK'] || this.keys['KeyX'];
    }

    isPauseJustPressed() {
        return this.isJustPressed('KeyP') || this.isJustPressed('Escape');
    }

    isAutoFireToggleJustPressed() {
        return this.isJustPressed('KeyC') || this.isJustPressed('KeyM');
    }

    isStartJustPressed() {
        return (
            this.isJustPressed('Space') ||
            this.isJustPressed('Enter') ||
            this.isJustPressed('KeyJ') ||
            this.isJustPressed('KeyZ')
        );
    }

    isJustPressed(code) {
        return !!this.justPressed[code];
    }

    update() {
        // Clear justPressed for next frame
        this.justPressed = {};
    }
}
