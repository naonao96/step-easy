import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

// 通知の優先度
export type NotificationPriority = 'high' | 'medium' | 'low';

// 通知のカテゴリ
export type NotificationCategory = 'task' | 'habit' | 'subscription' | 'system' | 'ai';

// 通知タイプ
export type NotificationType = 
  // タスク関連
  | 'task_completed' | 'task_due_soon' | 'task_overdue' | 'task_created'
  // 習慣関連
  | 'habit_streak' | 'habit_completed' | 'habit_missed' | 'habit_goal_reached'
  // サブスクリプション関連
  | 'subscription_payment_success' | 'subscription_payment_failed' 
  | 'trial_ending' | 'subscription_canceled' | 'subscription_renewed'
  // システム関連
  | 'system_info' | 'system_warning' | 'system_error'
  // AI関連
  | 'ai_message_generated' | 'ai_analysis_complete'
  // その他
  | 'trial_started' | 'migration_complete';

// 通知インターフェース
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  category: NotificationCategory;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

// 通知作成オプション
export interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  category?: NotificationCategory;
}

// Supabaseクライアント（サーバーサイド用）
const getSupabaseClient = () => {
  // サーバーサイドの場合（Service Role Key使用）
  if (typeof window === 'undefined') {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  
  // クライアントサイドの場合
  return createClientComponentClient();
};

/**
 * 通知を作成する
 */
export async function createNotification(options: CreateNotificationOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId, type, title, message, priority = 'medium', category } = options;

    // カテゴリを自動判定（指定されていない場合）
    const autoCategory: NotificationCategory = category || getCategoryFromType(type);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        priority,
        category: autoCategory,
        is_read: false,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('通知作成エラー:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('通知作成エラー:', error);
    return { success: false, error: '通知の作成に失敗しました' };
  }
}

/**
 * 通知タイプからカテゴリを自動判定
 */
function getCategoryFromType(type: NotificationType): NotificationCategory {
  if (type.startsWith('task_')) return 'task';
  if (type.startsWith('habit_')) return 'habit';
  if (type.startsWith('subscription_') || type === 'trial_ending' || type === 'trial_started') return 'subscription';
  if (type.startsWith('ai_')) return 'ai';
  if (type.startsWith('system_')) return 'system';
  return 'system';
}

/**
 * ユーザーの通知を取得する
 */
export async function getUserNotifications(userId: string, limit: number = 50): Promise<{ notifications: Notification[]; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('通知取得エラー:', error);
      return { notifications: [], error: error.message };
    }

    return { notifications: data || [] };
  } catch (error) {
    console.error('通知取得エラー:', error);
    return { notifications: [], error: '通知の取得に失敗しました' };
  }
}

/**
 * 未読通知数を取得する
 */
export async function getUnreadNotificationCount(userId: string): Promise<{ count: number; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('未読通知数取得エラー:', error);
      return { count: 0, error: error.message };
    }

    return { count: count || 0 };
  } catch (error) {
    console.error('未読通知数取得エラー:', error);
    return { count: 0, error: '未読通知数の取得に失敗しました' };
  }
}

/**
 * 通知を既読にする
 */
export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (error) {
      console.error('通知既読エラー:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('通知既読エラー:', error);
    return { success: false, error: '通知の既読処理に失敗しました' };
  }
}

/**
 * すべての通知を既読にする
 */
export async function markAllNotificationsAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('全通知既読エラー:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('全通知既読エラー:', error);
    return { success: false, error: '全通知の既読処理に失敗しました' };
  }
}

/**
 * 通知を削除する
 */
export async function deleteNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('通知削除エラー:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('通知削除エラー:', error);
    return { success: false, error: '通知の削除に失敗しました' };
  }
}

/**
 * 古い通知を削除する（30日以上前）
 */
export async function deleteOldNotifications(userId: string, daysOld: number = 30): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      console.error('古い通知削除エラー:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('古い通知削除エラー:', error);
    return { success: false, error: '古い通知の削除に失敗しました' };
  }
}

/**
 * サブスクリプション関連の通知を作成する（ヘルパー関数）
 */
export async function createSubscriptionNotification(
  userId: string,
  type: 'subscription_payment_success' | 'subscription_payment_failed' | 'trial_ending' | 'subscription_canceled' | 'subscription_renewed' | 'trial_started',
  title: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  return createNotification({
    userId,
    type,
    title,
    message,
    priority: 'high', // サブスクリプション関連は高優先度
    category: 'subscription'
  });
}

/**
 * タスク関連の通知を作成する（ヘルパー関数）
 */
export async function createTaskNotification(
  userId: string,
  type: 'task_completed' | 'task_due_soon' | 'task_overdue' | 'task_created',
  title: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  return createNotification({
    userId,
    type,
    title,
    message,
    priority: 'medium',
    category: 'task'
  });
}

/**
 * 習慣関連の通知を作成する（ヘルパー関数）
 */
export async function createHabitNotification(
  userId: string,
  type: 'habit_streak' | 'habit_completed' | 'habit_missed' | 'habit_goal_reached',
  title: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  return createNotification({
    userId,
    type,
    title,
    message,
    priority: 'medium',
    category: 'habit'
  });
} 