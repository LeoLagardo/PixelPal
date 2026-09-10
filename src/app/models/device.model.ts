export type EntitlementTier = 'free' | 'pro';

export interface EntitlementPayload {
  tier: EntitlementTier;
  features?: string[];
  source?: 'google_play' | 'app_store' | 'local' | 'mock';
  receipt_signature?: string;
}

export interface PairedDevice {
  ip: string;
  port: number;
  token: string;
  name?: string;
  device_name?: string;
  media_port?: number;
  udp_port?: number;
  schema_version?: number;
  client_version?: string;
  entitlement?: EntitlementPayload;
}

export interface DiscoveredDevice {
  ip: string;
  port: number;
  token_matched?: boolean;
  name?: string;
  device_name?: string;
  media_port?: number;
  udp_port?: number;
  app_version?: string;
  schema_version?: number;
  raw?: string;
}

export interface HandshakeAuthPayload {
  token: string;
  device_name?: string;
  client_version: string;
  schema_version: number;
  entitlement: EntitlementPayload;
}

export interface HandshakeResponse {
  status: 'paired' | 'error';
  app_version?: string;
  schema_version?: number;
  negotiated_schema?: number;
  active_plan?: 'free' | 'pro';
  session_entitlement?: {
    tier: 'free' | 'pro';
    unlimited_screens: boolean;
    unlimited_devices: boolean;
  };
  error?: string;
  reason?: string;
  code?: string;
}

