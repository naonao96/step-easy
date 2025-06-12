import './globals.css';
import { AuthProvider } from './contexts/AuthContext';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "StepEasy - タスクを完了へ導く、心理的サポート付き目標管理アプリ",
  description: "タスクを完了へ導く、心理的サポート付き目標管理アプリ",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-screen overflow-y-auto">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
