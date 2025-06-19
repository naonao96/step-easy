import { Task } from '@/types/task';

/**
 * 習慣の種類に応じた継続期限を計算
 */
export const getStreakDeadline = (task: Task): Date | null => {
  if (!task.is_habit || !task.last_completed_date || task.current_streak === 0) {
    return null;
  }
  
  const lastCompleted = new Date(task.last_completed_date);
  const deadlineMap = {
    'daily': 1,    // 毎日 → 翌日まで
    'weekly': 7,   // 週1 → 7日後まで
    'monthly': 30  // 月1 → 30日後まで
  };
  
  const daysToAdd = deadlineMap[task.habit_frequency || 'daily'];
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
 * 継続期限までの残り時間を人間が読める形式で返す
 */
export const getTimeRemaining = (task: Task): string | null => {
  const deadline = getStreakDeadline(task);
  if (!deadline) return null;
  
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  
  if (diffMs <= 0) return '期限切れ';
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `あと${diffDays}日`;
  } else if (diffHours > 0) {
    return `あと${diffHours}時間`;
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `あと${diffMinutes}分`;
  }
};

/**
 * 期限切れのストリークを持つタスクを特定
 */
export const getExpiredStreakTasks = (tasks: Task[]): Task[] => {
  return tasks.filter(task => 
    task.is_habit && 
    (task.current_streak || 0) > 0 && 
    !isStreakActive(task)
  );
};

/**
 * 危険状態のストリークを持つタスクを特定
 */
export const getRiskyStreakTasks = (tasks: Task[]): Task[] => {
  return tasks.filter(task => 
    task.is_habit && 
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
    task.is_habit && 
    (task.current_streak || 0) > 0 && 
    isStreakActive(task)
  );
};

/**
 * ストリークの状態を取得
 */
export const getStreakStatus = (task: Task): 'active' | 'at-risk' | 'expired' | 'none' => {
  if (!task.is_habit || task.current_streak === 0) return 'none';
  
  if (!isStreakActive(task)) return 'expired';
  if (isStreakAtRisk(task)) return 'at-risk';
  return 'active';
}; 