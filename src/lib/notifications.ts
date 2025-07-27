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
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  category?: NotificationCategory;
}

// Supabaseクライアント（クライアントサイド専用）
const getSupabaseClient = () => {
  // クライアントサイドのみ（Service Role Keyは使用しない）
  return createClientComponentClient();
};

/**
 * 通知を作成する
 */
export async function createNotification(options: CreateNotificationOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const { type, title, message, priority = 'medium', category } = options;

    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        title,
        message,
        priority,
        category
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || '通知の作成に失敗しました' };
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
    const response = await fetch(`/api/notifications?limit=${limit}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      return { notifications: [], error: errorData.error || '通知の取得に失敗しました' };
    }

    const { notifications } = await response.json();
    return { notifications: notifications || [] };
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
    const response = await fetch(`/api/notifications?unread=true&limit=1000`);
    
    if (!response.ok) {
      const errorData = await response.json();
      return { count: 0, error: errorData.error || '未読通知数の取得に失敗しました' };
    }

    const { notifications } = await response.json();
    return { count: notifications?.length || 0 };
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
    const response = await fetch('/api/notifications', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notificationId,
        is_read: true
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || '通知の既読化に失敗しました' };
    }

    return { success: true };
  } catch (error) {
    console.error('通知既読化エラー:', error);
    return { success: false, error: '通知の既読化に失敗しました' };
  }
}

/**
 * すべての通知を既読にする
 */
export async function markAllNotificationsAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 未読通知を取得
    const { notifications, error: fetchError } = await getUserNotifications(userId, 1000);
    if (fetchError) {
      return { success: false, error: fetchError };
    }

    // 未読通知をすべて既読にする
    const unreadNotifications = notifications.filter(n => !n.is_read);
    const updatePromises = unreadNotifications.map(notification => 
      markNotificationAsRead(notification.id)
    );

    await Promise.all(updatePromises);
    return { success: true };
  } catch (error) {
    console.error('全通知既読化エラー:', error);
    return { success: false, error: '全通知の既読化に失敗しました' };
  }
}

/**
 * 通知を削除する
 */
export async function deleteNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/notifications?id=${notificationId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || '通知の削除に失敗しました' };
    }

    return { success: true };
  } catch (error) {
    console.error('通知削除エラー:', error);
    return { success: false, error: '通知の削除に失敗しました' };
  }
}

/**
 * 古い通知を削除する
 */
export async function deleteOldNotifications(userId: string, daysOld: number = 30): Promise<{ success: boolean; error?: string }> {
  try {
    // 古い通知を取得
    const { notifications, error: fetchError } = await getUserNotifications(userId, 1000);
    if (fetchError) {
      return { success: false, error: fetchError };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // 古い通知を削除
    const oldNotifications = notifications.filter(n => 
      new Date(n.created_at) < cutoffDate
    );

    const deletePromises = oldNotifications.map(notification => 
      deleteNotification(notification.id)
    );

    await Promise.all(deletePromises);
    return { success: true };
  } catch (error) {
    console.error('古い通知削除エラー:', error);
    return { success: false, error: '古い通知の削除に失敗しました' };
  }
}

/**
 * サブスクリプション関連の通知を作成する
 */
export async function createSubscriptionNotification(
  type: 'subscription_payment_success' | 'subscription_payment_failed' | 'trial_ending' | 'subscription_canceled' | 'subscription_renewed' | 'trial_started',
  title: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  return createNotification({
    type,
    title,
    message,
    priority: 'high',
    category: 'subscription'
  });
}

/**
 * タスク関連の通知を作成する
 */
export async function createTaskNotification(
  type: 'task_completed' | 'task_due_soon' | 'task_overdue' | 'task_created',
  title: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  return createNotification({
    type,
    title,
    message,
    priority: 'medium',
    category: 'task'
  });
}

/**
 * 習慣関連の通知を作成する
 */
export async function createHabitNotification(
  type: 'habit_streak' | 'habit_completed' | 'habit_missed' | 'habit_goal_reached',
  title: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  return createNotification({
    type,
    title,
    message,
    priority: 'medium',
    category: 'habit'
  });
} 