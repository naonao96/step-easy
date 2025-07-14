'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationBanner } from '@/components/molecules/NotificationBanner';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <NotificationBanner />
      {children}
    </AuthProvider>
  );
} 