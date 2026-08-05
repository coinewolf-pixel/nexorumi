export const metadata = {
  title: 'NEXORUM — Multi-Game Ecosystem',
  description: 'Unified platform for Hunt, Racing, Fishing, Farm, and Survival markets',
  manifest: '/manifest.json',
  themeColor: '#6366f1',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'NEXORUM' },
  viewport: { width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body style={{ margin: 0, fontFamily: 'var(--kimi-font-sans, system-ui, sans-serif)' }}>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(console.error);
            });
          }
        `}} />
      </body>
    </html>
  );
}
