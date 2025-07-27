import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * 認証状態をチェックする
 */
export async function checkAuth(): Promise<{ user: any; isAuthenticated: boolean; error?: string }> {
  try {
    const supabase = createClientComponentClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      return { user: null, isAuthenticated: false, error: '認証エラーが発生しました' };
    }
    
    if (!user) {
      return { user: null, isAuthenticated: false, error: '認証が必要です' };
    }
    
    return { user, isAuthenticated: true };
  } catch (error) {
    console.error('認証チェックエラー:', error);
    return { user: null, isAuthenticated: false, error: '認証チェックに失敗しました' };
  }
}

/**
 * ゲストユーザーかどうかをチェックする
 */
export async function isGuestUser(): Promise<boolean> {
  try {
    const { user } = await checkAuth();
    return user?.user_metadata?.is_guest === true;
  } catch (error) {
    return false;
  }
}

/**
 * プレミアムユーザーかどうかをチェックする
 */
export async function isPremiumUser(): Promise<boolean> {
  try {
    const { user } = await checkAuth();
    return user?.user_metadata?.plan_type === 'premium';
  } catch (error) {
    return false;
  }
}

/**
 * 認証が必要な操作のラッパー関数
 */
export async function withAuth<T>(
  operation: (user: any) => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const { user, isAuthenticated, error } = await checkAuth();
    
    if (!isAuthenticated || !user) {
      return { success: false, error: error || '認証が必要です' };
    }
    
    const data = await operation(user);
    return { success: true, data };
  } catch (error) {
    console.error('認証付き操作エラー:', error);
    return { success: false, error: '操作に失敗しました' };
  }
} 