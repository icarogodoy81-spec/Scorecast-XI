import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.scorecastxi.app',
  appName: 'Scorecast XI',
  webDir: 'public',
  server: {
    url: 'https://scorecast-xi.vercel.app',
    cleartext: false
  }
};

export default config;
