export const metadata = {
  title: 'NEXORUM | AI-Native Gaming Ecosystem',
  description: 'Multi-market gaming platform with NEXO economy',
  manifest: '/manifest.json',
  themeColor: '#6366f1',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'NEXORUM' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="bg-[#0a0a0f] text-white antialiased">{children}</body>
    </html>
  );
}
