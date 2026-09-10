export type SoundTuneId =
  | 'mechanical'
  | 'bubble'
  | 'arcade'
  | 'chime'
  | 'cyber'
  | 'tap'
  | 'laser';

export interface SoundSettings {
  enabled: boolean;
  tune: SoundTuneId;
  volume: number; // Range: 0.0 to 1.0
}

export interface SoundPreset {
  id: SoundTuneId;
  name: string;
  description: string;
  category: 'tactile' | 'retro' | 'modern' | 'scifi';
}
