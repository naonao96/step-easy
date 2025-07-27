/**
 * StepEasy共通型定義
 * プロジェクト全体で使用される型を統合
 */

// =====================================================
// 基本型定義
// =====================================================

/**
 * プランタイプ
 */
export type PlanType = 'guest' | 'free' | 'premium';

/**
 * タブタイプ
 */
export type TabType = 'tasks' | 'habits';

/**
 * 優先度
 */
export type Priority = 'low' | 'medium' | 'high';

/**
 * ステータス
 */
export type TaskStatus = 'todo' | 'doing' | 'done';
export type HabitStatus = 'active' | 'paused' | 'stopped';

/**
 * カテゴリ
 */
export type Category = 'work' | 'personal' | 'health' | 'study' | 'home' | 'other';

/**
 * 頻度
 */
export type Frequency = 'daily' | 'weekly' | 'monthly';

/**
 * 感情タイプ
 */
export type EmotionType = 'happy' | 'excited' | 'calm' | 'neutral' | 'sad' | 'angry' | 'anxious' | 'tired';

/**
 * 時間帯
 */
export type TimePeriod = 'morning' | 'afternoon' | 'evening';

/**
 * 表示モード
 */
export type DisplayMode = 'month' | 'week';

/**
 * カレンダーモード
 */
export type CalendarMode = 'habits' | 'tasks';

/**
 * ソートオプション
 */
export type SortOption = 'default' | 'priority' | 'due_date' | 'created_at' | 'title';

/**
 * モーダルモード
 */
export type ModalMode = 'create' | 'edit' | 'preview';

// =====================================================
// 共通インターフェース
// =====================================================

/**
 * 基本エンティティ
 */
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

/**
 * タイトル付きエンティティ
 */
export interface TitledEntity extends BaseEntity {
  title: string;
  description?: string;
}

/**
 * 優先度付きエンティティ
 */
export interface PrioritizedEntity extends TitledEntity {
  priority: Priority;
}

/**
 * カテゴリ付きエンティティ
 */
export interface CategorizedEntity extends PrioritizedEntity {
  category: Category;
}

/**
 * 日付付きエンティティ
 */
export interface DatedEntity extends CategorizedEntity {
  start_date?: string | null;
  due_date?: string | null;
}

/**
 * 時間付きエンティティ
 */
export interface TimedEntity extends DatedEntity {
  estimated_duration?: number;
  actual_duration?: number;
}

/**
 * 完了可能エンティティ
 */
export interface CompletableEntity extends TimedEntity {
  status: TaskStatus;
  completed_at?: string;
}

/**
 * 継続日数付きエンティティ
 */
export interface StreakEntity extends CompletableEntity {
  current_streak: number;
  longest_streak: number;
  last_completed_date?: string | null;
  streak_start_date?: string | null;
}

// =====================================================
// フォームデータ型
// =====================================================

/**
 * 基本フォームデータ
 */
export interface BaseFormData {
  title: string;
  description?: string;
  priority: Priority;
  category: Category;
  estimated_duration?: number;
}

/**
 * タスクフォームデータ
 */
export interface TaskFormData extends BaseFormData {
  status: TaskStatus;
  start_date?: string | null;
  due_date?: string | null;
}

/**
 * 習慣フォームデータ（src/types/habit.tsで定義済み）
 */

// =====================================================
// 統計データ型
// =====================================================

/**
 * 基本統計
 */
export interface BaseStats {
  total: number;
  completed: number;
  incomplete: number;
  percentage: number;
}

/**
 * 日別統計
 */
export interface DailyStats extends BaseStats {
  date: string;
  overdue: number;
}

/**
 * 週別統計
 */
export interface WeeklyStats extends BaseStats {
  week: string;
  days: DailyStats[];
}

/**
 * 月別統計
 */
export interface MonthlyStats extends BaseStats {
  month: string;
  weeks: WeeklyStats[];
}

/**
 * 習慣統計
 */
export interface HabitStats extends BaseStats {
  current_streak: number;
  longest_streak: number;
  average_streak: number;
}

// =====================================================
// 設定型
// =====================================================

/**
 * ユーザー設定
 */
export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'ja' | 'en';
  notifications: {
    email: boolean;
    push: boolean;
    reminder: boolean;
  };
  display: {
    compact_mode: boolean;
    show_completed: boolean;
    default_sort: SortOption;
  };
}

/**
 * アプリ設定
 */
export interface AppSettings {
  version: string;
  last_update: string;
  features: {
    habits: boolean;
    emotions: boolean;
    premium: boolean;
  };
}

// =====================================================
// 通知型
// =====================================================

/**
 * 通知
 */
export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  action_url?: string;
}

/**
 * 通知設定
 */
export interface NotificationSettings {
  enabled: boolean;
  types: {
    task_reminder: boolean;
    habit_reminder: boolean;
    streak_alert: boolean;
    system_update: boolean;
  };
  schedule: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  };
}

// =====================================================
// エラー型
// =====================================================

/**
 * バリデーションエラー
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * バリデーション結果
 */
export interface ValidationResult {
  isValid: boolean;
  errors?: ValidationError[];
  message?: string;
}

/**
 * APIエラー
 */
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

/**
 * API結果
 */
export interface ApiResult<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// =====================================================
// イベント型
// =====================================================

/**
 * カスタムイベント
 */
export interface CustomEvent<T = any> extends Event {
  detail: T;
}

/**
 * タスクイベント
 */
export interface TaskEvent {
  type: 'create' | 'update' | 'delete' | 'complete';
  taskId: string;
  data?: any;
  timestamp: string;
}

/**
 * 習慣イベント
 */
export interface HabitEvent {
  type: 'create' | 'update' | 'delete' | 'complete' | 'streak_update';
  habitId: string;
  data?: any;
  timestamp: string;
}

// =====================================================
// ユーティリティ型
// =====================================================

/**
 * オプショナル型
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * 必須型（組み込み型との競合を避けるため別名）
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * 読み取り専用型（組み込み型との競合を避けるため別名）
 */
export type ReadonlyFields<T> = {
  readonly [P in keyof T]: T[P];
};

/**
 * ディープリードオンリー型
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * 部分型（組み込み型との競合を避けるため別名）
 */
export type PartialFields<T> = {
  [P in keyof T]?: T[P];
};

/**
 * ディープパーシャル型
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
}; 