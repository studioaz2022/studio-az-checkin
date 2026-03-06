import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ScreenProvider } from '@/context/ScreenContext';
import InactivityGuard from '@/components/InactivityGuard';
import CircuitBackground from '@/components/CircuitBackground';

export const metadata: Metadata = {
  title: 'Studio AZ — Check In',
  description: 'Kiosk check-in for Studio AZ Barbershop & Tattoo',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Studio AZ',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Explicit standalone web app meta tags for older iPad Safari */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Studio AZ" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#0c0c0e" />
        <script dangerouslySetInnerHTML={{ __html: `
          // Keep all navigation inside the standalone web app — no Safari popups
          window.open = function(url) { window.location.href = url; return null; };
          // Intercept link clicks that would open in Safari
          document.addEventListener('click', function(e) {
            var link = e.target.closest && e.target.closest('a');
            if (link && link.href && link.target === '_blank') {
              e.preventDefault();
              window.location.href = link.href;
            }
          }, true);
        `}} />
      </head>
      <body className="h-screen overflow-hidden relative">
        {/* Animated circuit board background */}
        <CircuitBackground />

        <ScreenProvider>
          <InactivityGuard>
            <main className="h-full relative z-10">
              {children}
            </main>
          </InactivityGuard>
        </ScreenProvider>
      </body>
    </html>
  );
}
