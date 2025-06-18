'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { hasGuestTasks, getGuestTasks } from '@/lib/guestMigration';

interface AuthUser {
  id: string;
  email: string;
  isGuest?: boolean;
  isPremium?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  isGuest: boolean;
  isPremium: boolean;
  shouldShowMigrationModal: boolean;
  setShouldShowMigrationModal: (show: boolean) => void;
  togglePremiumForDev: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowMigrationModal, setShouldShowMigrationModal] = useState(false);
  // 開発用: プレミアム状態のオーバーライド
  const [devPremiumOverride, setDevPremiumOverride] = useState<boolean | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
            });
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          if (session?.user) {
            const newUser = {
              id: session.user.id,
              email: session.user.email || '',
            };
            
            // 新規ログイン時にゲストタスクがあるかチェック
            if (event === 'SIGNED_IN' && hasGuestTasks()) {
              setShouldShowMigrationModal(true);
            }
            
            setUser(newUser);
          } else {
            setUser(null);
            setShouldShowMigrationModal(false);
          }
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push('/menu');
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const signInAsGuest = async () => {
    setUser({ id: 'guest', email: '', isGuest: true });
    setIsLoading(false);
  };

  const signOut = async () => {
    try {
      if (user?.isGuest) {
        setUser(null);
        router.push('/lp');
        return;
      }
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const togglePremiumForDev = () => {
    setDevPremiumOverride(prev => {
      if (prev === null) return true;
      if (prev === true) return false;
      return null;
    });
  };

  const value = {
    user,
    isLoading,
    signInWithGoogle,
    signInWithEmail,
    signOut,
    signInAsGuest,
    isGuest: !!user?.isGuest,
    isPremium: devPremiumOverride !== null ? devPremiumOverride : !!user?.isPremium,
    shouldShowMigrationModal,
    setShouldShowMigrationModal,
    togglePremiumForDev,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 