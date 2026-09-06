/**
 * Salamander Web Audio Sound Effects Engine
 * Pure procedural synthesis - no external audio files required.
 */
class SoundEffects {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.enabled = true;
        this.volume = 0.5;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setMuted(muted) {
        this.enabled = !muted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime);
        }
    }

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this.masterGain && this.ctx && this.enabled) {
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        }
    }

    // Helper: generate noise buffer
    createNoiseBuffer(duration = 0.5) {
        if (!this.ctx) return null;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    playShot() {
        if (!this.enabled) return;
        this.init();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(920, t);
        osc.frequency.exponentialRampToValueAtTime(220, t + 0.08);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.08);
    }

    playLaser() {
        if (!this.enabled) return;
        this.init();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1400, t);
        osc.frequency.exponentialRampToValueAtTime(320, t + 0.12);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.12);
    }

    playRipple() {
        if (!this.enabled) return;
        this.init();
        const t = this.ctx.currentTime;
        const carrier = this.ctx.createOscillator();
        const mod = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();
        const gain = this.ctx.createGain();

        carrier.type = 'sine';
        mod.type = 'sine';

        carrier.frequency.setValueAtTime(600, t);
        carrier.frequency.exponentialRampToValueAtTime(280, t + 0.14);

        mod.frequency.setValueAtTime(45, t);
        modGain.gain.setValueAtTime(150, t);
        modGain.gain.linearRampToValueAtTime(10, t + 0.14);

        mod.connect(carrier.frequency);
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        carrier.connect(gain);
        gain.connect(this.masterGain);

        mod.start(t);
        carrier.start(t);
        mod.stop(t + 0.14);
        carrier.stop(t + 0.14);
    }

    playMissile() {
        if (!this.enabled) return;
        this.init();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.15);

        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.15);
    }

    playExplosion(type = 'small') {
        if (!this.enabled) return;
        this.init();
        const t = this.ctx.currentTime;
        const duration = type === 'boss' ? 1.2 : (type === 'medium' ? 0.4 : 0.22);
        const noiseBuf = this.createNoiseBuffer(duration);
        if (!noiseBuf) return;

        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(type === 'boss' ? 600 : 900, t);
        filter.frequency.exponentialRampToValueAtTime(40, t + duration);

        const gain = this.ctx.createGain();
        const maxVol = type === 'boss' ? 0.6 : (type === 'medium' ? 0.35 : 0.2);
        gain.gain.setValueAtTime(maxVol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(t);
        noise.stop(t + duration);

        // Sub rumble for large explosions
        if (type !== 'small') {
            const sub = this.ctx.createOscillator();
            const subGain = this.ctx.createGain();
            sub.type = 'sawtooth';
            sub.frequency.setValueAtTime(90, t);
            sub.frequency.exponentialRampToValueAtTime(25, t + duration);

            subGain.gain.setValueAtTime(0.25, t);
            subGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

            sub.connect(subGain);
            subGain.connect(this.masterGain);

            sub.start(t);
            sub.stop(t + duration);
        }
    }

    playEnemyHit() {
        if (!this.enabled) return;
        this.init();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.linearRampToValueAtTime(150, t + 0.04);

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.04);
    }

    playPowerUp() {
        if (!this.enabled) return;
        this.init();
        const t = this.ctx.currentTime;
        const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        freqs.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const noteStart = t + idx * 0.06;

            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, noteStart);

            gain.gain.setValueAtTime(0.18, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.1);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(noteStart);
            osc.stop(noteStart + 0.1);
        });
    }

    playShieldHit() {
        if (!this.enabled) return;
        this.init();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(220, t + 0.1);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.1);
    }

    playPlayerDeath() {
        if (!this.enabled) return;
        this.init();
        this.playExplosion('boss');
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.8);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.8);
    }

    playWarning() {
        if (!this.enabled) return;
        this.init();
        const t = this.ctx.currentTime;
        for (let i = 0; i < 3; i++) {
            const start = t + i * 0.28;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(880, start);
            osc.frequency.setValueAtTime(660, start + 0.14);

            gain.gain.setValueAtTime(0.25, start);
            gain.gain.exponentialRampToValueAtTime(0.01, start + 0.26);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(start);
            osc.stop(start + 0.26);
        }
    }

    playKonamiFanfare() {
        if (!this.enabled) return;
        this.init();
        const t = this.ctx.currentTime;
        const notes = [
            { f: 523.25, d: 0.08 },
            { f: 659.25, d: 0.08 },
            { f: 783.99, d: 0.08 },
            { f: 1046.5, d: 0.12 },
            { f: 880.0, d: 0.08 },
            { f: 1174.66, d: 0.25 }
        ];
        let offset = 0;
        notes.forEach(note => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const noteStart = t + offset;

            osc.type = 'square';
            osc.frequency.setValueAtTime(note.f, noteStart);

            gain.gain.setValueAtTime(0.25, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + note.d);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(noteStart);
            osc.stop(noteStart + note.d);
            offset += note.d * 0.9;
        });
    }

    playStageClear() {
        if (!this.enabled) return;
        this.init();
        const t = this.ctx.currentTime;
        const notes = [
            { f: 523.25, d: 0.1 },
            { f: 659.25, d: 0.1 },
            { f: 783.99, d: 0.1 },
            { f: 1046.5, d: 0.18 },
            { f: 880.0, d: 0.12 },
            { f: 1046.5, d: 0.4 }
        ];
        let offset = 0;
        notes.forEach(note => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const noteStart = t + offset;

            osc.type = 'square';
            osc.frequency.setValueAtTime(note.f, noteStart);

            gain.gain.setValueAtTime(0.25, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + note.d);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(noteStart);
            osc.stop(noteStart + note.d);
            offset += note.d;
        });
    }
}

export const sfx = new SoundEffects();
