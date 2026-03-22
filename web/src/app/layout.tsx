import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Providers } from '@/components/layout/Providers';

export const metadata: Metadata = {
  title: {
    default: 'Apologetics Africa',
    template: '%s | Apologetics Africa',
  },
  description:
    'Defending the Christian faith across Africa with rigorous scholarship, clear answers, and accessible resources.',
  keywords: ['apologetics', 'Africa', 'Christianity', 'faith', 'theology', 'questions'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Apologetics Africa',
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen flex flex-col bg-white">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
