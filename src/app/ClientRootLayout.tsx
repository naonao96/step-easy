'use client';

import { Inter } from 'next/font/google';
import { AuthProvider } from './contexts/AuthContext';
import { ClientLayout } from '@/components/providers/ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export default function ClientRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <AuthProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
} 