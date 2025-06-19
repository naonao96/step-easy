export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'done';
  priority?: 'low' | 'medium' | 'high'; // 既存のTEXT型に合わせる
  due_date?: string;
  start_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_habit?: boolean;
  habit_frequency?: 'daily' | 'weekly' | 'monthly';
  current_streak?: number;
  max_streak?: number;
  last_completed_date?: string;
  category?: string; // カテゴリ（work, health, study, personal, hobby, other）
  estimated_duration?: number; // 予想所要時間（分）
  actual_duration?: number; // 実際の所要時間（分）
  
  // 継続日数関連フィールド
  streak_count?: number;
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