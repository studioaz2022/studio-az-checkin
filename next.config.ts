import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /*
   * Static export. The kiosk is a pure client-side SPA — one route, every
   * screen a client component, no route handlers — so there is nothing for a
   * server to do at request time.
   *
   * It matters because the app runs as a home-screen web app with no address
   * bar and no reload button. Served as a Vercel serverless function, every
   * launch needed a live round-trip, and a dropped shop WiFi connection meant
   * iOS painted the manifest background and nothing else. Prerendered HTML is
   * cacheable by the service worker, so the kiosk always has something to show.
   */
  output: 'export',
};

export default nextConfig;
