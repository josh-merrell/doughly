import { CapacitorConfig } from '@capacitor/cli';
import { environment as environmentProd } from './src/environments/environment.prod';
import { environment as environment } from './src/environments/environment';

const config: CapacitorConfig = {
  appId: 'co.doughly.app',
  appName: 'doughly',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId:
        environmentProd.GOOGLE_BROWSER_CLIENT_ID ||
        environment.GOOGLE_BROWSER_CLIENT_ID,
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
