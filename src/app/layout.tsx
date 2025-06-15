import './globals.css';
import { ClientLayout } from '@/components/providers/ClientLayout';
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
      <body className="min-h-screen overflow-y-auto">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
