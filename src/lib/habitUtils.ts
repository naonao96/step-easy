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
 * 既存のタスクテーブルの習慣かどうかを判定
 */
export const isLegacyHabit = (item: Habit | Task): item is Task => {
  return 'is_habit' in item && item.is_habit;
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
  // 新しい習慣テーブルからの習慣
  const newHabits = habits.filter(habit => habit.habit_status === 'active');
  
  // 既存のタスクテーブルからの習慣（is_habit = true）
  const legacyHabits = tasks.filter(task => task.is_habit && task.status !== 'done');
  
  // 両方を統合して返す
  return [...newHabits, ...legacyHabits];
};

/**
 * 新しい習慣データをTask型に変換
 */
export const convertHabitsToTasks = (habits: Habit[], selectedDate?: Date, habitCompletions?: any[]): Task[] => {
  const targetDate = selectedDate ? getJSTDateString(selectedDate) : getJSTDateString();
  
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
      
      return {
        id: habit.id,
        title: habit.title,
        description: habit.description || '',
        status: isCompletedOnSelectedDate ? 'done' as const : 'todo' as const,
        priority: 'medium' as const,
        due_date: null,
        start_date: null,
        completed_at: isCompletedOnSelectedDate ? new Date(targetDate + 'T00:00:00+09:00').toISOString() : undefined,
        created_at: habit.created_at,
        updated_at: habit.updated_at,
        user_id: habit.user_id,
        is_habit: true,
        habit_frequency: 'daily' as const,
        current_streak: habit.current_streak,
        longest_streak: habit.longest_streak || 0,
        last_completed_date: habit.last_completed_date,
        streak_start_date: habit.streak_start_date,
        category: habit.category || 'other',
        estimated_duration: undefined,
        actual_duration: undefined,
        streak_count: habit.current_streak,
        session_time: undefined,
        today_total: undefined,
        all_time_total: undefined,
        last_execution_date: undefined,
        execution_count: undefined
      };
    });
}; 