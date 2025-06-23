'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { hasGuestTasks, getGuestTasks } from '@/lib/guestMigration';

interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  isGuest?: boolean;
  isPremium?: boolean;
  planType?: 'guest' | 'free' | 'premium';
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
  planType: 'guest' | 'free' | 'premium';
  shouldShowMigrationModal: boolean;
  setShouldShowMigrationModal: (show: boolean) => void;
  togglePremiumForDev: () => void;
  // プラン別制限チェック関数
  canAddTaskOnDate: (date: Date) => { canAdd: boolean; message: string };
  canAddPastTask: () => boolean;
  getDataRetentionDays: () => number;
  canSetDueDate: () => { canSet: boolean; message: string };
  getStartDateLimits: () => { min: string | undefined; max: string | undefined; disabled: boolean; message: string };
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
              displayName: session.user.user_metadata?.display_name || '',
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
              displayName: session.user.user_metadata?.display_name || '',
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
    setUser({ id: 'guest', email: '', isGuest: true, planType: 'guest' });
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
      router.push('/lp');
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

  // プラン別制限チェック関数群
  const getPlanType = (): 'guest' | 'free' | 'premium' => {
    if (devPremiumOverride === true) return 'premium';
    if (devPremiumOverride === false) return 'free';
    if (!user) return 'guest';
    if (user.isGuest) return 'guest';
    return user.planType || 'free';
  };

  const canAddTaskOnDate = (date: Date): { canAdd: boolean; message: string } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const daysDifference = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    const planType = getPlanType();
    
    // 過去日チェック
    if (daysDifference < 0) {
      if (planType === 'premium') {
        return { canAdd: true, message: '' };
      }
      return { 
        canAdd: false, 
        message: planType === 'guest' 
          ? 'ゲストユーザーは過去の日付にタスクを追加できません。ログインしてプレミアム版で過去のタスクも管理しましょう。'
          : '無料版は過去の日付にタスクを追加できません。プレミアム版にアップグレードしてください。'
      };
    }
    
    // 今日は全プラン追加可能
    if (daysDifference === 0) {
      return { canAdd: true, message: '' };
    }
    
    // 未来日チェック
    if (planType === 'guest') {
      return {
        canAdd: false,
        message: 'ゲストユーザーは今日のタスクのみ追加できます。ログインして計画的なタスク管理を始めましょう。'
      };
    }
    
    if (planType === 'free' && daysDifference > 14) {
      return {
        canAdd: false,
        message: '無料版は14日後までのタスクのみ追加できます。プレミアム版にアップグレードして長期計画を立てましょう。'
      };
    }
    
    return { canAdd: true, message: '' };
  };

  const canSetDueDate = (): { canSet: boolean; message: string } => {
    const planType = getPlanType();
    
    if (planType === 'guest') {
      return {
        canSet: false,
        message: 'ゲストユーザーは期限日を設定できません。ログインして期限管理機能を利用しましょう。'
      };
    }
    
    return { canSet: true, message: '' };
  };

  const getStartDateLimits = () => {
    const planType = getPlanType();
    const today = new Date().toISOString().split('T')[0];
    
    switch (planType) {
      case 'guest':
        return {
          min: today,
          max: today,
          disabled: true,
          message: '今日のみ設定可能'
        };
      case 'free':
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 14);
        return {
          min: today,
          max: maxDate.toISOString().split('T')[0],
          disabled: false,
          message: '今日から14日先まで設定可能'
        };
      case 'premium':
        return {
          min: undefined,
          max: undefined,
          disabled: false,
          message: '制限なし（過去日・未来日どちらでも設定可能）'
        };
      default:
        return {
          min: today,
          max: today,
          disabled: false,
          message: ''
        };
    }
  };

  const canAddPastTask = (): boolean => {
    return getPlanType() === 'premium';
  };

  const getDataRetentionDays = (): number => {
    const planType = getPlanType();
    switch (planType) {
      case 'guest': return 0; // セッション中のみ
      case 'free': return 30;
      case 'premium': return -1; // 無制限
      default: return 30;
    }
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
    planType: getPlanType(),
    shouldShowMigrationModal,
    setShouldShowMigrationModal,
    togglePremiumForDev,
    canAddTaskOnDate,
    canAddPastTask,
    getDataRetentionDays,
    canSetDueDate,
    getStartDateLimits,
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