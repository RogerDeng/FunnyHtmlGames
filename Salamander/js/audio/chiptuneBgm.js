/**
 * Salamander Chiptune BGM Sequencer
 * Multi-channel 8-bit FM/Chiptune music generator using Web Audio API.
 */
class ChiptuneBGM {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.enabled = true;
        this.volume = 0.4;
        this.currentTrack = null;
        this.isPlaying = false;
        this.timer = null;
        this.step = 0;
        this.bpm = 140;
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
        if (!this.enabled && this.isPlaying) {
            // keep sequencer running or mute
        }
    }

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this.masterGain && this.ctx && this.enabled) {
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        }
    }

    // Convert note name (e.g. 'C4', 'D#4', 'A5') to frequency
    n(name) {
        if (!name || name === '-') return 0;
        const noteMap = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
        const match = name.match(/^([A-G][#b]?)(\d)$/);
        if (!match) return 0;
        const note = match[1];
        const oct = parseInt(match[2], 10);
        const semitone = noteMap[note] + (oct - 4) * 12 - 9; // relative to A4 (440Hz)
        return 440 * Math.pow(2, semitone / 12);
    }

    // Play a single synthesized tone
    playTone(freq, type, duration, vol = 0.15, isBass = false) {
        if (!this.ctx || freq <= 0 || !this.enabled) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);

        if (isBass) {
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(450, t);
            osc.connect(filter);
            filter.connect(gain);
        } else {
            osc.connect(gain);
        }

        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.95);

        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + duration);
    }

    // Play drum hit
    playDrum(type, duration = 0.1) {
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;

        if (type === 'K') { // Kick
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.frequency.setValueAtTime(140, t);
            osc.frequency.exponentialRampToValueAtTime(35, t + 0.09);
            gain.gain.setValueAtTime(0.28, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(t);
            osc.stop(t + 0.09);
        } else if (type === 'S') { // Snare
            const bufferSize = this.ctx.sampleRate * 0.08;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(1000, t);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.18, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            noise.start(t);
            noise.stop(t + 0.08);
        } else if (type === 'H') { // Hi-hat
            const bufferSize = this.ctx.sampleRate * 0.03;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(5000, t);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.08, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            noise.start(t);
            noise.stop(t + 0.03);
        }
    }

    // Track definitions: 16th-note patterns
    getTracks() {
        return {
            title: {
                bpm: 125,
                lead: [
                    'D4', '-', 'F4', '-', 'A4', '-', 'D5', '-', 'C5', '-', 'A4', '-', 'F4', '-', 'G4', 'A4',
                    'D4', '-', 'F4', '-', 'A4', '-', 'E5', '-', 'D5', '-', 'A4', '-', 'F4', '-', 'E4', '-',
                    'Bb3', '-', 'D4', '-', 'F4', '-', 'Bb4', '-', 'A4', '-', 'F4', '-', 'D4', '-', 'E4', 'F4',
                    'G4', '-', 'A4', '-', 'Bb4', '-', 'C5', '-', 'D5', '-', 'E5', '-', 'F5', '-', 'E5', '-'
                ],
                bass: [
                    'D2', 'D2', 'D2', 'D2', 'D2', 'D2', 'D2', 'D2', 'F2', 'F2', 'F2', 'F2', 'G2', 'G2', 'A2', 'A2',
                    'D2', 'D2', 'D2', 'D2', 'D2', 'D2', 'D2', 'D2', 'F2', 'F2', 'F2', 'F2', 'G2', 'G2', 'A2', 'A2',
                    'Bb1', 'Bb1', 'Bb1', 'Bb1', 'Bb1', 'Bb1', 'Bb1', 'Bb1', 'F2', 'F2', 'F2', 'F2', 'F2', 'F2', 'F2', 'F2',
                    'G2', 'G2', 'G2', 'G2', 'A2', 'A2', 'A2', 'A2', 'Bb2', 'Bb2', 'Bb2', 'Bb2', 'C3', 'C3', 'C3', 'C3'
                ],
                drums: [
                    'K', 'H', 'S', 'H', 'K', 'H', 'S', 'H', 'K', 'H', 'S', 'H', 'K', 'K', 'S', 'H',
                    'K', 'H', 'S', 'H', 'K', 'H', 'S', 'H', 'K', 'H', 'S', 'H', 'K', 'K', 'S', 'H',
                    'K', 'H', 'S', 'H', 'K', 'H', 'S', 'H', 'K', 'H', 'S', 'H', 'K', 'K', 'S', 'H',
                    'K', 'H', 'S', 'H', 'K', 'H', 'S', 'H', 'K', 'K', 'S', 'S', 'K', 'S', 'S', 'S'
                ]
            },
            stage1: { // Fast & heroic "Power of Anger" vibe
                bpm: 152,
                lead: [
                    'D4', 'D4', 'A4', '-', 'G4', 'F4', 'E4', 'F4', 'G4', '-', 'F4', 'E4', 'D4', '-', 'C4', 'E4',
                    'D4', 'D4', 'A4', '-', 'G4', 'F4', 'E4', 'F4', 'A4', '-', 'Bb4', 'A4', 'F4', '-', 'G4', '-',
                    'F4', 'E4', 'D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'C5', '-', 'Bb4', 'A4', 'G4', '-', 'F4', '-',
                    'E4', '-', 'F4', '-', 'G4', '-', 'A4', '-', 'D5', '-', 'C#5', '-', 'D5', '-', '-', '-'
                ],
                harmony: [
                    'A3', 'A3', 'F4', '-', 'E4', 'D4', 'C#4', 'D4', 'E4', '-', 'D4', 'C#4', 'A3', '-', 'G3', 'C4',
                    'A3', 'A3', 'F4', '-', 'E4', 'D4', 'C#4', 'D4', 'F4', '-', 'G4', 'F4', 'D4', '-', 'E4', '-',
                    'D4', 'C4', 'Bb3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', '-', 'G4', 'F4', 'E4', '-', 'D4', '-',
                    'C#4', '-', 'D4', '-', 'E4', '-', 'F4', '-', 'Bb4', '-', 'A4', '-', 'A4', '-', '-', '-'
                ],
                bass: [
                    'D2', 'D3', 'D2', 'D3', 'D2', 'D3', 'D2', 'D3', 'G2', 'G3', 'G2', 'G3', 'A2', 'A3', 'A2', 'A3',
                    'D2', 'D3', 'D2', 'D3', 'D2', 'D3', 'D2', 'D3', 'F2', 'F3', 'F2', 'F3', 'G2', 'G3', 'A2', 'A3',
                    'Bb1', 'Bb2', 'Bb1', 'Bb2', 'Bb1', 'Bb2', 'Bb1', 'Bb2', 'C2', 'C3', 'C2', 'C3', 'C2', 'C3', 'C2', 'C3',
                    'A1', 'A2', 'A1', 'A2', 'A1', 'A2', 'A1', 'A2', 'D2', 'D3', 'D2', 'D3', 'D2', 'A2', 'D3', '-'
                ],
                drums: [
                    'K', 'H', 'S', 'H', 'K', 'K', 'S', 'H', 'K', 'H', 'S', 'H', 'K', 'K', 'S', 'H',
                    'K', 'H', 'S', 'H', 'K', 'K', 'S', 'H', 'K', 'H', 'S', 'H', 'K', 'K', 'S', 'H',
                    'K', 'H', 'S', 'H', 'K', 'K', 'S', 'H', 'K', 'H', 'S', 'H', 'K', 'K', 'S', 'H',
                    'K', 'H', 'S', 'H', 'K', 'K', 'S', 'H', 'K', 'K', 'S', 'S', 'K', 'S', 'S', 'K'
                ]
            },
            stage2: { // Intense solar flare tempo
                bpm: 156,
                lead: [
                    'E4', '-', 'G4', 'A4', 'B4', '-', 'G4', '-', 'A4', 'B4', 'C5', 'B4', 'A4', 'G4', 'F#4', 'G4',
                    'E4', '-', 'G4', 'A4', 'B4', '-', 'D5', '-', 'C5', 'B4', 'A4', 'G4', 'F#4', '-', 'E4', '-',
                    'C5', '-', 'B4', 'A4', 'G4', '-', 'F#4', '-', 'E4', 'F#4', 'G4', 'A4', 'B4', '-', 'A4', '-',
                    'B4', '-', 'C5', '-', 'D5', '-', 'E5', '-', 'B4', '-', 'A4', 'B4', 'E4', '-', '-', '-'
                ],
                bass: [
                    'E2', 'E3', 'E2', 'E3', 'E2', 'E3', 'E2', 'E3', 'A2', 'A3', 'A2', 'A3', 'B2', 'B3', 'B2', 'B3',
                    'E2', 'E3', 'E2', 'E3', 'E2', 'E3', 'E2', 'E3', 'C2', 'C3', 'C2', 'C3', 'D2', 'D3', 'D2', 'D3',
                    'C2', 'C3', 'C2', 'C3', 'G2', 'G3', 'G2', 'G3', 'A2', 'A3', 'A2', 'A3', 'B2', 'B3', 'B2', 'B3',
                    'E2', 'E3', 'E2', 'E3', 'D2', 'D3', 'D2', 'D3', 'E2', 'E3', 'E2', 'E3', 'E2', 'B2', 'E3', '-'
                ],
                drums: [
                    'K', 'H', 'S', 'H', 'K', 'H', 'S', 'K', 'K', 'H', 'S', 'H', 'K', 'H', 'S', 'H',
                    'K', 'H', 'S', 'H', 'K', 'H', 'S', 'K', 'K', 'H', 'S', 'H', 'K', 'H', 'S', 'H',
                    'K', 'H', 'S', 'H', 'K', 'H', 'S', 'K', 'K', 'H', 'S', 'H', 'K', 'H', 'S', 'H',
                    'K', 'K', 'S', 'H', 'K', 'K', 'S', 'H', 'K', 'S', 'K', 'S', 'K', 'S', 'S', 'K'
                ]
            },
            boss: { // Menacing, urgent Boss Battle theme
                bpm: 160,
                lead: [
                    'C4', 'C#4', 'D4', 'D#4', 'E4', '-', 'D#4', '-', 'D4', '-', 'C#4', '-', 'C4', '-', 'Bb3', '-',
                    'C4', 'D#4', 'G4', 'Bb4', 'C5', '-', 'Bb4', '-', 'G#4', '-', 'G4', '-', 'F4', '-', 'D#4', '-',
                    'F#4', 'G4', 'G#4', 'A4', 'Bb4', '-', 'A4', '-', 'G#4', '-', 'G4', '-', 'F#4', '-', 'E4', '-',
                    'C4', 'C4', 'D#4', 'D#4', 'F#4', 'F#4', 'A4', 'A4', 'C5', 'A4', 'F#4', 'D#4', 'C4', '-', '-', '-'
                ],
                bass: [
                    'C2', 'C2', 'C2', 'C2', 'C#2', 'C#2', 'C#2', 'C#2', 'D2', 'D2', 'D2', 'D2', 'D#2', 'D#2', 'D#2', 'D#2',
                    'C2', 'C2', 'C2', 'C2', 'G1', 'G1', 'G1', 'G1', 'G#1', 'G#1', 'G#1', 'G#1', 'Bb1', 'Bb1', 'Bb1', 'Bb1',
                    'F#1', 'F#1', 'F#1', 'F#1', 'G1', 'G1', 'G1', 'G1', 'G#1', 'G#1', 'G#1', 'G#1', 'A1', 'A1', 'A1', 'A1',
                    'C2', 'C2', 'C2', 'C2', 'D#2', 'D#2', 'D#2', 'D#2', 'F#2', 'F#2', 'F#2', 'F#2', 'C2', 'G1', 'C2', '-'
                ],
                drums: [
                    'K', 'S', 'K', 'S', 'K', 'S', 'K', 'S', 'K', 'S', 'K', 'S', 'K', 'K', 'S', 'S',
                    'K', 'S', 'K', 'S', 'K', 'S', 'K', 'S', 'K', 'S', 'K', 'S', 'K', 'K', 'S', 'S',
                    'K', 'S', 'K', 'S', 'K', 'S', 'K', 'S', 'K', 'S', 'K', 'S', 'K', 'K', 'S', 'S',
                    'K', 'K', 'S', 'S', 'K', 'K', 'S', 'S', 'K', 'S', 'K', 'S', 'S', 'S', 'S', 'S'
                ]
            }
        };
    }

    play(trackName) {
        this.init();
        if (this.currentTrack === trackName && this.isPlaying) return;

        this.stop();
        const tracks = this.getTracks();
        const track = tracks[trackName];
        if (!track) return;

        this.currentTrack = trackName;
        this.isPlaying = true;
        this.step = 0;
        this.bpm = track.bpm || 140;

        const intervalMs = (60 / this.bpm / 4) * 1000; // 16th note step in ms

        const tick = () => {
            if (!this.isPlaying) return;
            const currentStep = this.step;
            const totalSteps = track.lead.length;

            // 1. Lead voice
            if (track.lead) {
                const note = track.lead[currentStep % totalSteps];
                if (note && note !== '-') {
                    this.playTone(this.n(note), 'square', (intervalMs / 1000) * 1.5, 0.12);
                }
            }

            // 2. Harmony voice
            if (track.harmony) {
                const note = track.harmony[currentStep % totalSteps];
                if (note && note !== '-') {
                    this.playTone(this.n(note), 'sawtooth', (intervalMs / 1000) * 1.2, 0.08);
                }
            }

            // 3. Bass voice
            if (track.bass) {
                const note = track.bass[currentStep % track.bass.length];
                if (note && note !== '-') {
                    this.playTone(this.n(note), 'triangle', (intervalMs / 1000) * 1.8, 0.22, true);
                }
            }

            // 4. Drums
            if (track.drums) {
                const drum = track.drums[currentStep % track.drums.length];
                if (drum && drum !== '-') {
                    this.playDrum(drum);
                }
            }

            this.step = (this.step + 1) % totalSteps;
            this.timer = setTimeout(tick, intervalMs);
        };

        tick();
    }

    stop() {
        this.isPlaying = false;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.currentTrack = null;
    }
}

export const bgm = new ChiptuneBGM();
