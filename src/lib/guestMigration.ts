import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Task } from '@/stores/taskStore';

// モジュールレベルでSupabaseクライアントを一度だけ作成
const supabase = createClientComponentClient();

export interface GuestMigrationResult {
  success: boolean;
  migratedCount: number;
  errors: string[];
}

export const getGuestTasks = (): Task[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const guestTasks = localStorage.getItem('guestTasks');
    return guestTasks ? JSON.parse(guestTasks) : [];
  } catch (error) {
    console.error('ゲストタスクの取得エラー:', error);
    return [];
  }
};

export const migrateGuestTasks = async (userId: string): Promise<GuestMigrationResult> => {
  const guestTasks = getGuestTasks();
  
  if (guestTasks.length === 0) {
    return { success: true, migratedCount: 0, errors: [] };
  }

  const errors: string[] = [];
  let migratedCount = 0;

  for (const guestTask of guestTasks) {
    try {
      // ゲスト固有のプロパティを除去し、新しいユーザーIDを設定
      const taskToMigrate = {
        title: guestTask.title,
        description: guestTask.description,
        status: guestTask.status,
        priority: guestTask.priority,
        due_date: guestTask.due_date,
        is_habit: guestTask.is_habit,
        habit_frequency: guestTask.habit_frequency,
        streak_count: guestTask.streak_count || 0,
        completed_at: guestTask.completed_at,
        user_id: userId
      };

      const { error } = await supabase
        .from('tasks')
        .insert([taskToMigrate]);

      if (error) {
        console.error(`タスク "${guestTask.title}" の移行エラー:`, error);
        errors.push(`"${guestTask.title}": ${error.message}`);
      } else {
        migratedCount++;
      }
    } catch (error) {
      console.error(`タスク "${guestTask.title}" の移行中に予期しないエラー:`, error);
      errors.push(`"${guestTask.title}": 予期しないエラー`);
    }
  }

  return {
    success: errors.length === 0,
    migratedCount,
    errors
  };
};

export const clearGuestTasks = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem('guestTasks');
  } catch (error) {
    console.error('ゲストタスクのクリアエラー:', error);
  }
};

export const hasGuestTasks = (): boolean => {
  return getGuestTasks().length > 0;
}; 