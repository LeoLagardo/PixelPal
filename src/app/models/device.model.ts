export interface PairedDevice {
  ip: string;
  port: number;
  token: string;
  name?: string;
  device_name?: string;
  media_port?: number;
  udp_port?: number;
}

export interface DiscoveredDevice {
  ip: string;
  port: number;
  token_matched?: boolean;
  name?: string;
  device_name?: string;
  media_port?: number;
  udp_port?: number;
  raw?: string;
}

