import { ButtonConfig } from './button.model';

export interface MediaSource {
  type: string;
  name?: string;
  url?: string;
  value?: string;
}

export interface Config {
  grid_size: string;
  buttons: ButtonConfig[];
  background?: {
    type: 'color';
    value: string;
  } | {
    type: 'image';
    value: string;
    name?: string;
  } | {
    type: 'url';
    url: string;
    name?: string;
  };
  theme?: string;
}

export interface GridScreen {
  id: string;
  name: string;
  type: 'grid';
  config: Config;
}

export interface MediaScreen {
  id: string;
  name: string;
  type: 'media';
  config: {
    media_type: string;
    source: MediaSource;
  };
}

export type ScreenConfig = GridScreen | MediaScreen;
