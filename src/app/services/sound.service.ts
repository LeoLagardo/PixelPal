import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SoundPreset, SoundSettings, SoundTuneId } from '../models/sound.model';

const STORAGE_KEY = 'pixelpal_sound_settings';

export const SOUND_PRESETS: SoundPreset[] = [
  {
    id: 'mechanical',
    name: 'Mechanical Switch',
    description: 'Tactile switch click with realistic acoustic dampening',
    category: 'tactile'
  },
  {
    id: 'bubble',
    name: 'Bubble Pop',
    description: 'Playful organic pitch-glide bubble pop',
    category: 'modern'
  },
  {
    id: 'arcade',
    name: 'Arcade Blip',
    description: 'Nostalgic 8-bit retro square-wave arpeggio',
    category: 'retro'
  },
  {
    id: 'chime',
    name: 'Digital Chime',
    description: 'Crisp dual-tone crystal bell chime',
    category: 'modern'
  },
  {
    id: 'cyber',
    name: 'Cyber Ping',
    description: 'Futuristic sci-fi pulse chirp',
    category: 'scifi'
  },
  {
    id: 'tap',
    name: 'Subtle Tap',
    description: 'Ultra-clean, gentle UI feedback tap',
    category: 'tactile'
  },
  {
    id: 'laser',
    name: 'Laser Zap',
    description: 'Energetic frequency-sweep laser blast',
    category: 'scifi'
  }
];

const DEFAULT_SETTINGS: SoundSettings = {
  enabled: true,
  tune: 'mechanical',
  volume: 0.7
};

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  private audioCtx: AudioContext | null = null;
  private settingsSubject = new BehaviorSubject<SoundSettings>(this.loadSettings());
  public settings$ = this.settingsSubject.asObservable();

  constructor() {
    // Attempt lazy initialization on first click/interaction if needed
  }

  public get settings(): SoundSettings {
    return this.settingsSubject.value;
  }

  public getPresets(): SoundPreset[] {
    return SOUND_PRESETS;
  }

  public updateSettings(partial: Partial<SoundSettings>): void {
    const updated: SoundSettings = {
      ...this.settingsSubject.value,
      ...partial
    };
    this.settingsSubject.next(updated);
    this.saveSettings(updated);
  }

  public setEnabled(enabled: boolean): void {
    this.updateSettings({ enabled });
  }

  public setTune(tune: SoundTuneId): void {
    this.updateSettings({ tune });
  }

  public setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.updateSettings({ volume: clamped });
  }

  /**
   * Play the configured sound effect on a button click.
   */
  public playButtonClick(): void {
    const current = this.settingsSubject.value;
    if (!current.enabled || current.volume <= 0) {
      return;
    }
    this.synthesizeSound(current.tune, current.volume);
  }

  /**
   * Preview a specific tune at current volume (or custom volume), ignoring the master enabled toggle.
   */
  public previewTune(tuneId: SoundTuneId, customVolume?: number): void {
    const volume = customVolume !== undefined ? customVolume : Math.max(0.2, this.settingsSubject.value.volume);
    this.synthesizeSound(tuneId, volume);
  }

  private initAudioContext(): AudioContext | null {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    } catch (e) {
      console.warn('[SoundService] AudioContext initialization failed', e);
      return null;
    }
  }

  /**
   * High-performance, zero-latency Web Audio API sound synthesis.
   */
  private synthesizeSound(tune: SoundTuneId, volume: number): void {
    const ctx = this.initAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, now);
      masterGain.connect(ctx.destination);

      switch (tune) {
        case 'mechanical':
          this.synthMechanicalClick(ctx, masterGain, now);
          break;
        case 'bubble':
          this.synthBubblePop(ctx, masterGain, now);
          break;
        case 'arcade':
          this.synthArcadeBlip(ctx, masterGain, now);
          break;
        case 'chime':
          this.synthDigitalChime(ctx, masterGain, now);
          break;
        case 'cyber':
          this.synthCyberPing(ctx, masterGain, now);
          break;
        case 'tap':
          this.synthSubtleTap(ctx, masterGain, now);
          break;
        case 'laser':
          this.synthLaserZap(ctx, masterGain, now);
          break;
        default:
          this.synthMechanicalClick(ctx, masterGain, now);
      }
    } catch (err) {
      console.error('[SoundService] Error synthesizing sound:', err);
    }
  }

  // --- Sound Synthesizers ---

  /**
   * 1. Mechanical Switch: Click transient + acoustic body dampening
   */
  private synthMechanicalClick(ctx: AudioContext, destination: AudioNode, now: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.035);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.035);

    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + 0.04);

    // High transient snap
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = 'sine';
    snapOsc.frequency.setValueAtTime(1200, now);
    snapOsc.frequency.exponentialRampToValueAtTime(200, now + 0.015);
    snapGain.gain.setValueAtTime(0.5, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    snapOsc.connect(snapGain);
    snapGain.connect(destination);

    snapOsc.start(now);
    snapOsc.stop(now + 0.02);
  }

  /**
   * 2. Bubble Pop: Fast pitch glide upward with smooth exponential release
   */
  private synthBubblePop(ctx: AudioContext, destination: AudioNode, now: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.07);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.8, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * 3. Arcade Blip: 8-bit retro square-wave 2-tone jump
   */
  private synthArcadeBlip(ctx: AudioContext, destination: AudioNode, now: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    // Tone 1
    osc.frequency.setValueAtTime(587.33, now); // D5
    // Tone 2
    osc.frequency.setValueAtTime(880.00, now + 0.04); // A5
    // Tone 3
    osc.frequency.setValueAtTime(1174.66, now + 0.07); // D6

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.setValueAtTime(0.4, now + 0.07);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  /**
   * 4. Digital Chime: Harmonic dual-tone crystal bell
   */
  private synthDigitalChime(ctx: AudioContext, destination: AudioNode, now: number): void {
    const frequencies = [659.25, 1318.51]; // E5 + E6
    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const initVol = idx === 0 ? 0.6 : 0.35;
      gain.gain.setValueAtTime(initVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(destination);

      osc.start(now);
      osc.stop(now + 0.24);
    });
  }

  /**
   * 5. Cyber Ping: Resonant sci-fi tone chirp
   */
  private synthCyberPing(ctx: AudioContext, destination: AudioNode, now: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(4.0, now);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * 6. Subtle Tap: Low resonant acoustic UI tap
   */
  private synthSubtleTap(ctx: AudioContext, destination: AudioNode, now: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.03);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  /**
   * 7. Laser Zap: Sci-Fi fast frequency downward sweep
   */
  private synthLaserZap(ctx: AudioContext, destination: AudioNode, now: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.11);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  // --- Storage Helper ---

  private loadSettings(): SoundSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('[SoundService] Could not read stored settings', e);
    }
    return { ...DEFAULT_SETTINGS };
  }

  private saveSettings(settings: SoundSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('[SoundService] Could not save settings', e);
    }
  }
}
