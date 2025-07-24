import { Task } from '@/types/task';
import { HabitCompletion } from '@/types/habit';
import { getJSTDateString } from '@/lib/timeUtils';

/**
 * 習慣の種類に応じた継続期限を計算
 */
export const getStreakDeadline = (task: Task): Date | null => {
  if (task.habit_status !== 'active' || !task.last_completed_date || task.current_streak === 0) {
    return null;
  }
  
  const lastCompleted = new Date(task.last_completed_date);
  const deadlineMap = {
    'daily': 1,    // 毎日 → 翌日まで
    'weekly': 7,   // 週1 → 7日後まで
    'monthly': 30  // 月1 → 30日後まで
  };
  
  const daysToAdd = deadlineMap[task.frequency || 'daily'];
  const deadline = new Date(lastCompleted);
  deadline.setDate(deadline.getDate() + daysToAdd);
  
  return deadline;
};

/**
 * 現在継続中かどうかを判定
 */
export const isStreakActive = (task: Task): boolean => {
  const deadline = getStreakDeadline(task);
  if (!deadline) return false;
  
  return new Date() <= deadline;
};

/**
 * 継続が危険な状態か判定（期限の80%経過）
 */
export const isStreakAtRisk = (task: Task): boolean => {
  const deadline = getStreakDeadline(task);
  if (!deadline || !task.last_completed_date) return false;
  
  const now = new Date();
  const lastCompleted = new Date(task.last_completed_date);
  const totalTime = deadline.getTime() - lastCompleted.getTime();
  const elapsedTime = now.getTime() - lastCompleted.getTime();
  
  // 期限の80%経過で「危険」状態
  return (elapsedTime / totalTime) > 0.8;
};



/**
 * 期限切れのストリークを持つタスクを特定
 */
export const getExpiredStreakTasks = (tasks: Task[]): Task[] => {
  return tasks.filter(task => 
    task.habit_status === 'active' && 
    (task.current_streak || 0) > 0 && 
    !isStreakActive(task)
  );
};

/**
 * 危険状態のストリークを持つタスクを特定
 */
export const getRiskyStreakTasks = (tasks: Task[]): Task[] => {
  return tasks.filter(task => 
    task.habit_status === 'active' && 
    (task.current_streak || 0) > 0 && 
    isStreakActive(task) && 
    isStreakAtRisk(task)
  );
};

/**
 * アクティブなストリークを持つタスクを特定
 */
export const getActiveStreakTasks = (tasks: Task[]): Task[] => {
  return tasks.filter(task => 
    task.habit_status === 'active' && 
    (task.current_streak || 0) > 0 && 
    isStreakActive(task)
  );
};

 

/**
 * 習慣完了記録から正確なストリークを計算（前日までの連続日数）
 */
export const calculateHabitStreak = (completions: HabitCompletion[], isCompletedToday: boolean = false): number => {
  if (completions.length === 0) {
    return 0;
  }

  // 日付順でソート（完了順序は無視）
  const sortedCompletions = completions
    .sort((a, b) => new Date(a.completed_date).getTime() - new Date(b.completed_date).getTime());

  let streak = 0;
  let currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - 1); // 昨日から開始（今日は含めない）
  
  // 昨日から過去に向かって連続性をチェック
  for (let i = sortedCompletions.length - 1; i >= 0; i--) {
    const completionDate = new Date(sortedCompletions[i].completed_date);
    
    // 連続しているかチェック
    if (isConsecutiveDay(currentDate, completionDate)) {
      streak++;
      currentDate = completionDate;
    } else {
      break; // 連続が途切れたら終了
    }
  }

  return streak;
};

/**
 * 2つの日付が連続しているかチェック
 */
const isConsecutiveDay = (date1: Date, date2: Date): boolean => {
  const diffTime = Math.abs(date1.getTime() - date2.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
};

/**
 * 指定された日付が今日かどうかチェック（日本時間）
 */
const isToday = (date: Date): boolean => {
  const today = getJSTDateString();
  const dateString = getJSTDateString(date);
  return dateString === today;
}; 