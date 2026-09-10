export interface ButtonAction {
  type: string;
  payload: string;
}

export interface LongPressConfig {
  enabled: boolean;
  duration_ms: number;
  action: ButtonAction;
}

export interface ButtonConfig {
  id: string;
  label: string;
  icon: string;
  action: ButtonAction;
  trigger?: 'press' | 'hold';
  long_press?: LongPressConfig;
}

