export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_habit: boolean;
  habit_frequency?: 'daily' | 'weekly' | 'monthly';
  
  // 継続日数関連フィールド
  current_streak: number;        // 現在の継続日数
  longest_streak: number;        // 最長継続日数
  last_completed_date: string | null;  // 最後に完了した日付
  streak_start_date: string | null;    // 現在のストリーク開始日
  
  // 互換性のために残す（後で削除予定）
  streak_count?: number;
  completed_at?: string;
}

// 継続日数情報の型
export interface StreakInfo {
  current: number;
  longest: number;
  isActive: boolean;
  daysUntilBreak: number;
  lastCompletedDate: string | null;
  streakStartDate: string | null;
}

// 継続日数統計の型
export interface StreakStats {
  totalActiveStreaks: number;
  longestCurrentStreak: number;
  averageStreakLength: number;
  tasksWithStreaks: Task[];
} 