// ============================================================================
// MARKET ORACLE - ROOT LAYOUT
// Wrapped with centralized AuthProvider + Global JavariWidget
// Created: December 15, 2025
// Updated: December 16, 2025 - Added global Javari AI assistant
// ============================================================================

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import JavariWidget from '@/components/JavariWidget';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Market Oracle AI | Multi-AI Stock Analysis',
  description: 'Get stock predictions from 4 leading AI models with Javari consensus. Part of CR AudioViz AI ecosystem.',
  keywords: 'stock analysis, AI trading, market predictions, GPT-4, Claude, Gemini, Perplexity',
  authors: [{ name: 'CR AudioViz AI' }],
  openGraph: {
    title: 'Market Oracle AI | Multi-AI Stock Analysis',
    description: 'Get stock predictions from 4 leading AI models with Javari consensus.',
    type: 'website',
    url: 'https://marketoracle.craudiovizai.com',
    siteName: 'Market Oracle AI',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Market Oracle AI - Multi-AI Stock Analysis',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Market Oracle AI | Multi-AI Stock Analysis',
    description: 'Get stock predictions from 4 leading AI models with Javari consensus.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#0a0a0a" />
      </head>
      <body className={`${inter.className} bg-gray-950 text-white antialiased`}>
        <AuthProvider>
          {children}
          {/* Global Javari AI Assistant - Available on all pages */}
          <JavariWidget />
        </AuthProvider>
      </body>
    </html>
  );
}
