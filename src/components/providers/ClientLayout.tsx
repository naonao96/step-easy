'use client';

import { AuthProvider } from '@/contexts/AuthContext';
 
export function ClientLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
} 