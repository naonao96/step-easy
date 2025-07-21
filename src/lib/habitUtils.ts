type PlanType = 'guest' | 'free' | 'premium';
import { Habit, HabitWithCompletion } from '@/types/habit';
import { Task } from '@/types/task';

/**
 * プラン別の習慣制限を取得
 */
export const getHabitLimits = (planType: PlanType) => {
  switch (planType) {
    case 'guest': return { maxHabits: 0, maxStreakDays: 0 };
    case 'free': return { maxHabits: 3, maxStreakDays: 14 };
    case 'premium': return { maxHabits: Infinity, maxStreakDays: Infinity };
    default: return { maxHabits: 0, maxStreakDays: 0 };
  }
};

/**
 * 習慣の頻度ラベルを取得
 */
export const getFrequencyLabel = (frequency?: string) => {
  switch (frequency) {
    case 'daily': return '毎日';
    case 'weekly': return '週1回';
    case 'monthly': return '月1回';
    default: return '毎日';
  }
};

/**
 * 習慣の継続状況表示を取得
 */
export const getHabitStatus = (currentStreak: number) => {
  if (currentStreak === 0) return '未開始';
  return `${currentStreak}日継続中`;
};

/**
 * 新しい習慣テーブルの習慣かどうかを判定
 */
export const isNewHabit = (item: Habit | Task): item is Habit => {
  return 'habit_status' in item && 'frequency' in item;
};

/**
 * データベースレベルで習慣かどうかを判定（より確実）
 */
export const isHabitInDatabase = async (id: string): Promise<boolean> => {
  try {
    const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs');
    const supabase = createClientComponentClient();
    
    const { data: habitData } = await supabase
      .from('habits')
      .select('id')
      .eq('id', id)
      .single();
    
    return !!habitData;
  } catch (error) {
    console.error('習慣判定エラー:', error);
    return false;
  }
};

/**
 * 型レベルで習慣かどうかを判定（フォールバック）
 */
export const isHabitByType = (item: any): item is Habit => {
  return item && 
         typeof item === 'object' && 
         'habit_status' in item && 
         'frequency' in item &&
         typeof item.habit_status === 'string' &&
         typeof item.frequency === 'string';
};

/**
 * 統合された習慣判定関数（推奨）
 */
export const isHabit = async (item: Habit | Task | string): Promise<boolean> => {
  // IDが文字列で渡された場合
  if (typeof item === 'string') {
    return await isHabitInDatabase(item);
  }
  
  // オブジェクトが渡された場合
  if (item && typeof item === 'object' && 'id' in item) {
    // まず型レベルで判定
    if (isHabitByType(item)) {
      return true;
    }
    
    // 型レベルで判定できない場合はデータベースで確認
    return await isHabitInDatabase(item.id);
  }
  
  return false;
};

/**
 * 習慣の完了状態を判定
 */
export const isHabitCompleted = (habit: HabitWithCompletion | Task): boolean => {
  return isNewHabit(habit) ? habit.isCompleted : habit.status === 'done';
};

/**
 * 日本時間での日付文字列を取得
 */
export const getJSTDateString = (date?: Date): string => {
  const targetDate = date ? new Date(date) : new Date();
  const jstOffset = 9 * 60; // 分単位
  const jstTime = new Date(targetDate.getTime() + (jstOffset * 60 * 1000));
  return jstTime.toISOString().split('T')[0];
};

/**
 * 習慣データの統合
 */
export const integrateHabitData = (habits: Habit[], tasks: Task[]) => {
  // 新しい習慣テーブルからの習慣のみを返す
  return habits.filter(habit => habit.habit_status === 'active');
};

/**
 * 新しい習慣データをTask型に変換
 */
export const convertHabitsToTasks = (habits: Habit[], selectedDate?: Date, habitCompletions?: any[]): Task[] => {
  const targetDate = selectedDate ? getJSTDateString(selectedDate) : getJSTDateString();
  
  // デバッグログを追加
  console.log('🔍 convertHabitsToTasks 入力データ:', {
    habits_count: habits.length,
    habits_start_dates: habits.map(h => ({
      id: h.id,
      title: h.title,
      start_date: h.start_date,
      due_date: h.due_date
    })),
    timestamp: new Date().toISOString()
  });
  
  return habits
    .filter(habit => habit.habit_status === 'active')
    .map(habit => {
      // 選択された日付で完了済みかどうかを判定
      let isCompletedOnSelectedDate = false;
      
      if (habitCompletions) {
        // habit_completionsテーブルから完了状態を確認
        isCompletedOnSelectedDate = habitCompletions.some(
          completion => completion.habit_id === habit.id && completion.completed_date === targetDate
        );
      } else {
        // フォールバック: last_completed_dateを使用（日本時間で比較）
        const lastCompletedJST = habit.last_completed_date ? getJSTDateString(new Date(habit.last_completed_date)) : null;
        isCompletedOnSelectedDate = lastCompletedJST === targetDate;
      }
      
      const result = {
        id: habit.id,
        title: habit.title,
        description: habit.description || '',
        status: isCompletedOnSelectedDate ? 'done' as const : 'todo' as const,
        priority: habit.priority || 'medium',
        due_date: habit.due_date || null,
        start_date: habit.start_date || null,
        completed_at: isCompletedOnSelectedDate ? new Date(targetDate + 'T00:00:00+09:00').toISOString() : undefined,
        created_at: habit.created_at,
        updated_at: habit.updated_at,
        user_id: habit.user_id,

        // 習慣識別用プロパティを保持
        habit_status: habit.habit_status,
        frequency: habit.frequency,
        habit_frequency: 'daily' as const,
        current_streak: habit.current_streak,
        longest_streak: habit.longest_streak || 0,
        last_completed_date: habit.last_completed_date,
        streak_start_date: habit.streak_start_date,
        category: habit.category || 'other',
        estimated_duration: habit.estimated_duration,
        actual_duration: habit.all_time_total ? Math.floor(habit.all_time_total / 60) : undefined, // 秒を分に変換
        streak_count: habit.current_streak,
        session_time: undefined,
        today_total: habit.today_total,
        all_time_total: habit.all_time_total,
        last_execution_date: habit.last_execution_date,
        execution_count: undefined
      };
      
      // デバッグログを追加
      console.log('🔍 convertHabitsToTasks 変換結果:', {
        habit_id: habit.id,
        habit_title: habit.title,
        original_start_date: habit.start_date,
        original_due_date: habit.due_date,
        converted_start_date: result.start_date,
        converted_due_date: result.due_date,
        timestamp: new Date().toISOString()
      });
      
      return result;
    });
}; 

/**
 * 習慣のその日の実行時間を計算
 */
export const getHabitDailyExecutionTime = async (habitId: string, targetDate?: Date): Promise<number> => {
  try {
    const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs');
    const supabase = createClientComponentClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    // 対象日付を取得（指定がない場合は今日）
    const date = targetDate || new Date();
    
    // 日本時間（JST）で日付文字列を取得
    const jstOffset = 9 * 60; // 分単位
    const jstTime = new Date(date.getTime() + (jstOffset * 60 * 1000));
    const dateString = jstTime.toISOString().split('T')[0];
    
    // その日の実行ログを取得（日本時間の日付範囲で検索）
    const { data: logs } = await supabase
      .from('execution_logs')
      .select('duration')
      .eq('habit_id', habitId)
      .eq('user_id', user.id)
      .gte('start_time', `${dateString}T00:00:00.000Z`)
      .lt('start_time', `${dateString}T23:59:59.999Z`)
      .eq('is_completed', true);

    // 実行時間を合計（秒）
    const totalDuration = (logs || []).reduce((sum, log) => sum + (log.duration as number), 0);
    
    return totalDuration;
  } catch (error) {
    console.error('習慣の実行時間計算エラー:', error);
    return 0;
  }
};

/**
 * 習慣の実行時間を分単位でフォーマット
 */
export const formatHabitExecutionTime = (seconds: number): string => {
  if (seconds === 0) return '0分';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}分`;
}; 