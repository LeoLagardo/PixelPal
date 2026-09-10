import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pixelpal.android',
  appName: 'PixelPal',
  webDir: 'www',
  server: {
    androidScheme: 'http'
  }
};

export default config;
