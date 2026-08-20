import { registerPlugin } from '@capacitor/core';
import { DiscoveredDevice } from '../models';

export interface DiscoverOptions {
  token?: string;
  port?: number;
  timeout?: number;
}

export interface DiscoverResult {
  devices: DiscoveredDevice[];
}

export interface UdpPluginInterface {
  discover(options?: DiscoverOptions): Promise<DiscoverResult>;
}

const UdpPluginWeb: UdpPluginInterface = {
  async discover(options?: DiscoverOptions): Promise<DiscoverResult> {
    console.warn('[UdpPluginWeb] UDP broadcast is only supported on native mobile devices.');
    // In web dev mode, if we are testing on localhost or mock environment:
    return { devices: [] };
  }
};

export const UdpPlugin = registerPlugin<UdpPluginInterface>('UdpPlugin', {
  web: () => Promise.resolve(UdpPluginWeb),
});
