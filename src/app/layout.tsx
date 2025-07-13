import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import './wood-frame.css';
import ClientLayout from './ClientLayout';
import { CloudLayer } from '@/components/CloudLayer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "StepEasy - タスクを完了へ導く、心理的サポート付き目標管理アプリ",
  description: "タスクを完了へ導く、心理的サポート付き目標管理アプリ",
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'StepEasy',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="StepEasy" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        {/* 重要な画像のプリロード */}
        <link rel="preload" href="/logo.png" as="image" type="image/png" />
        <link rel="preload" href="/TalkToTheBird.png" as="image" type="image/png" />
        <link rel="preload" href="/SilentBird.png" as="image" type="image/png" />
      </head>
      <body className={`${inter.className} min-h-screen overflow-x-hidden`}> 
        {/* 背景レイヤー（最背面） */}
        <div className="fixed inset-0 w-full h-full z-[-10] pointer-events-none select-none bg-gradient-to-b from-sky-200 to-sky-50">
          <CloudLayer />
        </div>
        {/* 既存のApp全体レイアウト */}
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
} 