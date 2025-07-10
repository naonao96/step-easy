export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high'; // 既存のTEXT型に合わせる
  due_date: string | null;
  start_date: string | null;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_habit: boolean;
  habit_frequency?: 'daily' | 'weekly' | 'monthly';
  current_streak: number;
  max_streak?: number;
  longest_streak?: number;
  last_completed_date?: string | null;
  streak_start_date?: string | null;
  category?: string; // カテゴリ（work, health, study, personal, hobby, other）
  estimated_duration?: number; // 予想所要時間（分）
  actual_duration?: number; // 実際の所要時間（分） - 後方互換性のため保持
  
  // 継続日数関連フィールド
  streak_count?: number;
  
  // 新しい時間管理フィールド
  session_time?: number; // 現在セッション時間（秒）
  today_total?: number; // 今日の累計時間（秒）
  all_time_total?: number; // 全期間累計時間（秒）
  last_execution_date?: string; // 最終実行日（YYYY-MM-DD）
  execution_count?: number; // 実行回数
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  start_date?: string;
  is_habit?: boolean;
  habit_frequency?: 'daily' | 'weekly' | 'monthly';
  category?: string;
  estimated_duration?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: 'todo' | 'doing' | 'done';
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  start_date?: string;
  completed_at?: string;
  is_habit?: boolean;
  habit_frequency?: 'daily' | 'weekly' | 'monthly';
  current_streak?: number;
  max_streak?: number;
  last_completed_date?: string;
  category?: string;
  estimated_duration?: number;
  actual_duration?: number;
}

// カテゴリ定義
export interface TaskCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  description?: string;
}

export const DEFAULT_CATEGORIES: TaskCategory[] = [
  { id: 'work', name: '仕事', color: '#3B82F6', icon: '💼', description: '業務・プロジェクト関連' },
  { id: 'health', name: '健康', color: '#10B981', icon: '🏃', description: '運動・食事・医療関連' },
  { id: 'study', name: '学習', color: '#8B5CF6', icon: '📚', description: '勉強・スキルアップ関連' },
  { id: 'personal', name: 'プライベート', color: '#F59E0B', icon: '🏠', description: '家庭・個人的な用事' },
  { id: 'hobby', name: '趣味', color: '#EF4444', icon: '🎨', description: '娯楽・趣味活動' },
  { id: 'other', name: 'その他', color: '#6B7280', icon: '📝', description: 'その他のタスク' }
];

// 優先度定義（既存のTEXT形式に合わせる）
export const PRIORITY_LABELS = {
  high: { name: '高', color: '#EF4444', icon: '🔴' },
  medium: { name: '中', color: '#F59E0B', icon: '🟡' },
  low: { name: '低', color: '#10B981', icon: '🟢' }
};

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

// 実行ログ機能のための型定義
export interface TaskExecutionSession {
  id: string;
  task_id: string;
  start_time: string; // ISO string
  end_time?: string; // ISO string
  duration?: number; // 秒数
  is_active: boolean;
}

export interface ActiveTaskExecution {
  task_id: string;
  start_time: Date;
  elapsed_seconds: number;
}

// 新しい時間管理システムの型定義
export interface ExecutionLog {
  id: string;
  user_id: string;
  task_id: string;
  start_time: string; // ISO string
  end_time?: string; // ISO string
  duration: number; // 実行時間（秒）
  device_type: 'mobile' | 'desktop' | 'unknown';
  session_type: 'normal' | 'habit';
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActiveExecution {
  id: string;
  user_id: string;
  task_id: string;
  start_time: string; // ISO string
  device_type: 'mobile' | 'desktop' | 'unknown';
  is_paused: boolean;
  accumulated_time: number; // 累積時間（秒）
  created_at: string;
  updated_at: string;
}

// 時間統計情報
export interface TimeStatistics {
  today_total: number; // 今日の累計時間（秒）
  week_total: number; // 今週の累計時間（秒）
  month_total: number; // 今月の累計時間（秒）
  all_time_total: number; // 全期間累計時間（秒）
  session_count: number; // 実行回数
  average_session: number; // 平均セッション時間（秒）
  longest_session: number; // 最長セッション時間（秒）
  last_execution_date?: string; // 最終実行日
}

// 多層リセット機能の型定義
export type ResetType = 'session' | 'daily' | 'all';

export interface ResetConfirmation {
  type: ResetType;
  taskTitle: string;
  affectedData: {
    session_time?: number;
    today_total?: number;
    all_time_total?: number;
    execution_count?: number;
  };
} 