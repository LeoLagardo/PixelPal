export interface ButtonAction {
  type: string;
  payload: string;
}

export interface ButtonConfig {
  id: string;
  label: string;
  icon: string;
  action: ButtonAction;
  trigger?: 'press' | 'hold';
}
