import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.doughly.app',
  appName: 'doughleap',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
