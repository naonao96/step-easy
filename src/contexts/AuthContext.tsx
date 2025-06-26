'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { hasGuestTasks, getGuestTasks } from '@/lib/guestMigration';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Supabaseクライアントはシングルトンとしてモジュールレベルで一度だけ生成
const supabase = createClientComponentClient();

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
  canEditTaskOnDate: (date: Date, isExistingTask: boolean) => { canEdit: boolean; message: string };
  canAddPastTask: () => boolean;
  getDataRetentionDays: () => number;
  canSetDueDate: () => { canSet: boolean; message: string };
  getStartDateLimits: (isExistingTask?: boolean) => { min: string | undefined; max: string | undefined; disabled: boolean; message: string };
  getDueDateLimits: (startDate?: Date) => { min: string | undefined; max: string | undefined; disabled: boolean; message: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowMigrationModal, setShouldShowMigrationModal] = useState(false);
  // 開発用: プレミアム状態のオーバーライド
  const [devPremiumOverride, setDevPremiumOverride] = useState<boolean | null>(null);
  const router = useRouter();

  // ユーザー情報をデータベースから取得する関数
  const fetchUserFromDatabase = useCallback(async (userId: string): Promise<AuthUser | null> => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        return null;
      }

      return {
        id: userData.id as string,
        email: userData.email as string,
        displayName: userData.display_name as string,
        planType: (userData.plan_type as 'guest' | 'free' | 'premium') || 'free',
      };
    } catch (error) {
      console.error('Error in fetchUserFromDatabase:', error);
      return null;
    }
  }, []);

  // ユーザー登録確認・作成関数
  const ensureUserExists = useCallback(async (userId: string, email: string, displayName?: string): Promise<void> => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (userError && userError.code === 'PGRST116') {
        // ユーザーが存在しない場合、手動で作成
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: userId,
            email: email,
            display_name: displayName || email.split('@')[0] || 'User',
            plan_type: 'free'
          }]);

        if (insertError) {
          console.error('Error creating user:', insertError);
        }
      }
    } catch (error) {
      console.error('Error ensuring user exists:', error);
    }
  }, []);

  // セッションからユーザー情報を設定する関数
  const setUserFromSession = useCallback(async (session: any): Promise<void> => {
    if (!session?.user) {
      setUser(null);
      return;
    }

    // ユーザーが存在するかチェック・作成
    await ensureUserExists(
      session.user.id,
      session.user.email || '',
      session.user.user_metadata?.display_name
    );

    // データベースから最新情報を取得
    const userData = await fetchUserFromDatabase(session.user.id);
    
    if (userData) {
      setUser(userData);
    } else {
      // フォールバック: セッション情報のみ使用
      setUser({
        id: session.user.id,
        email: session.user.email || '',
        displayName: session.user.user_metadata?.display_name || '',
        planType: 'free',
      });
    }
  }, [ensureUserExists, fetchUserFromDatabase]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted && session) {
          await setUserFromSession(session);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          if (session) {
            await setUserFromSession(session);
            
            // 新規ログイン時にゲストタスクがあるかチェック
            if (event === 'SIGNED_IN' && hasGuestTasks()) {
              setShouldShowMigrationModal(true);
            }
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
  }, [supabase, setUserFromSession]);

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
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
    setUser({ 
      id: 'guest', 
      email: '', 
      isGuest: true, 
      planType: 'guest' 
    });
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
      
      setUser(null);
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
  const getPlanType = useCallback((): 'guest' | 'free' | 'premium' => {
    if (devPremiumOverride === true) return 'premium';
    if (devPremiumOverride === false) return 'free';
    if (!user) return 'guest';
    if (user.isGuest) return 'guest';
    return user.planType || 'free';
  }, [devPremiumOverride, user]);

  const canAddTaskOnDate = useCallback((date: Date): { canAdd: boolean; message: string } => {
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
  }, [getPlanType]);

  // 既存タスク編集時の日付制限チェック（新規作成より緩和）
  const canEditTaskOnDate = useCallback((date: Date, isExistingTask: boolean): { canEdit: boolean; message: string } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const daysDifference = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    const planType = getPlanType();
    
    // 新規作成の場合は既存の制限を適用
    if (!isExistingTask) {
      const addResult = canAddTaskOnDate(date);
      return { canEdit: addResult.canAdd, message: addResult.message };
    }
    
    // 既存タスク編集時の制限（緩和版）
    if (planType === 'guest') {
      // ゲストは今日のみ編集可能
      if (daysDifference !== 0) {
        return {
          canEdit: false,
          message: 'ゲストユーザーは今日のタスクのみ編集できます。ログインして過去のタスクも編集しましょう。'
        };
      }
    } else if (planType === 'free') {
      // 無料ユーザーは過去日も含めて編集可能（新規作成より緩和）
      if (daysDifference > 14) {
        return {
          canEdit: false,
          message: '無料版は14日後までのタスクのみ編集できます。プレミアム版にアップグレードして長期計画を編集しましょう。'
        };
      }
    }
    // プレミアムは無制限
    
    return { canEdit: true, message: '' };
  }, [getPlanType, canAddTaskOnDate]);

  const canSetDueDate = useCallback((): { canSet: boolean; message: string } => {
    const planType = getPlanType();
    
    if (planType === 'guest') {
      return {
        canSet: false,
        message: 'ゲストユーザーは期限日を設定できません。ログインして期限管理機能を利用しましょう。'
      };
    }
    
    return { canSet: true, message: '' };
  }, [getPlanType]);

  const getStartDateLimits = useCallback((isExistingTask?: boolean) => {
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
        if (isExistingTask) {
          // 既存タスク編集時は過去日も許可
          maxDate.setDate(maxDate.getDate() + 14);
          return {
            min: undefined, // 過去日も許可
            max: maxDate.toISOString().split('T')[0],
            disabled: false,
            message: '過去日から14日先まで設定可能'
          };
        } else {
          // 新規作成時は今日から14日先まで
          maxDate.setDate(maxDate.getDate() + 14);
          return {
            min: today,
            max: maxDate.toISOString().split('T')[0],
            disabled: false,
            message: '今日から14日先まで設定可能'
          };
        }
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
  }, [getPlanType]);

  const getDueDateLimits = useCallback((startDate?: Date) => {
    const planType = getPlanType();
    
    if (planType === 'guest') {
      return {
        min: undefined,
        max: undefined,
        disabled: true,
        message: 'ゲストユーザーは期限日を設定できません'
      };
    }
    
    const minDate = startDate || new Date();
    const maxDate = new Date();
    
    if (planType === 'free') {
      maxDate.setDate(maxDate.getDate() + 14);
    }
    // プレミアムは無制限（maxDateはundefined）
    
    return {
      min: minDate.toISOString().split('T')[0],
      max: planType === 'premium' ? undefined : maxDate.toISOString().split('T')[0],
      disabled: false,
      message: planType === 'premium' ? '制限なし' : '開始日から14日先まで設定可能'
    };
  }, [getPlanType]);

  const canAddPastTask = useCallback((): boolean => {
    return getPlanType() === 'premium';
  }, [getPlanType]);

  const getDataRetentionDays = useCallback((): number => {
    const planType = getPlanType();
    switch (planType) {
      case 'guest': return 0; // セッション中のみ
      case 'free': return 30;
      case 'premium': return -1; // 無制限
      default: return 30;
    }
  }, [getPlanType]);

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
    canEditTaskOnDate,
    canAddPastTask,
    getDataRetentionDays,
    canSetDueDate,
    getStartDateLimits,
    getDueDateLimits,
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