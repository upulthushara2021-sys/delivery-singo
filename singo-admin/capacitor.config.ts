import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.singo.delivery',
  appName: 'SINGO Delivery',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'http',
    allowNavigation: ['*'],
  },
};

export default config;
