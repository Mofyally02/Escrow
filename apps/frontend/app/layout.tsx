import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { Toaster } from '@/components/ui/toaster';
import { Navbar } from '@/components/layout/navbar';
import { ErrorBoundaryWrapper } from '@/components/error-boundary-wrapper';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { SkipLink } from '@/components/accessibility/skip-link';
import { BetaBanner } from '@/components/beta/beta-banner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Escrow - Freelance Account Marketplace',
  description:
    'Buy and sell freelance accounts with escrow protection. Secure, verified, and trusted.',
  keywords: [
    'freelance accounts',
    'escrow',
    'marketplace',
    'upwork',
    'fiverr',
    'account selling',
  ],
  authors: [{ name: 'Escrow Team' }],
  creator: 'Escrow',
  publisher: 'Escrow',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Escrow - Freelance Account Marketplace',
    description:
      'Buy and sell freelance accounts with escrow protection. Secure, verified, and trusted.',
    siteName: 'Escrow',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Escrow - Freelance Account Marketplace',
    description:
      'Buy and sell freelance accounts with escrow protection. Secure, verified, and trusted.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Escrow',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={inter.className}>
        <ErrorBoundaryWrapper>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              <SkipLink />
              <div className="min-h-screen flex flex-col">
                <BetaBanner />
                <Navbar />
                <main id="main-content" className="flex-1 pb-16 md:pb-0" tabIndex={-1}>
                  {children}
                </main>
                <MobileBottomNav />
              </div>
              <Toaster />
            </QueryProvider>
          </ThemeProvider>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  );
}
