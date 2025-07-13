// 共通の基底型
export interface BaseItem {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
  updated_at: string;
}

// 継続日数関連の共通型
export interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  streak_start_date: string | null;
}

export interface Habit extends BaseItem, StreakData {
  habit_status: 'active' | 'paused' | 'stopped';
  frequency: 'daily';
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  completed_date: string;
  completed_at: string;
  created_at: string;
}

export interface HabitFormData {
  title: string;
  description?: string;
  habit_status?: 'active' | 'paused' | 'stopped';
  category?: string;
}

export interface HabitWithCompletion extends Habit {
  isCompleted: boolean;
}

// 習慣完了処理のエラータイプ
export type HabitCompletionError = 
  | 'ALREADY_COMPLETED'
  | 'HABIT_NOT_FOUND'
  | 'DUPLICATE_COMPLETION'
  | 'DATABASE_ERROR'
  | 'UNKNOWN_ERROR';

export interface HabitCompletionResult {
  success: boolean;
  error?: HabitCompletionError;
  message?: string;
} 