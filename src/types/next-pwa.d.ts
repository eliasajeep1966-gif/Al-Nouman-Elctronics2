declare module 'next-pwa' {
  import { NextConfig } from 'next';
  
  interface PWAOptions {
    dest: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    runtimeCaching?: any[];
  }
  
  function withPWA(options: PWAOptions): (config: NextConfig) => NextConfig;
  export default withPWA;
}
