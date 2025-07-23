/**
 * StepEasy共通ユーティリティ関数
 * プロジェクト全体で使用される共通機能を統合
 */

import { Task } from '@/types/task';
import { Habit } from '@/types/habit';

/**
 * 日付フォーマット用の統一関数
 */
export const formatDateForDisplay = (date: Date): string => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[date.getDay()];
  return `${month}月${day}日 (${weekday})`;
};

/**
 * 今日かどうかを判定する統一関数
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  return targetDate.getTime() === today.getTime();
};

/**
 * 昨日かどうかを判定する統一関数
 */
export const isYesterday = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  return targetDate.getTime() === yesterday.getTime();
};

/**
 * 明日かどうかを判定する統一関数
 */
export const isTomorrow = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  return targetDate.getTime() === tomorrow.getTime();
};

/**
 * 選択日に応じたタイトルを生成する統一関数
 */
export const generateDateTitle = (
  selectedDate: Date | null, 
  activeTab: 'habits' | 'tasks'
): string => {
  if (!selectedDate) {
    return activeTab === 'habits' ? '今日の習慣' : '今日のタスク';
  }
  
  if (isToday(selectedDate)) {
    return activeTab === 'habits' ? '今日の習慣' : '今日のタスク';
  }
  
  if (isTomorrow(selectedDate)) {
    return activeTab === 'habits' ? '明日の習慣' : '明日のタスク';
  }
  
  if (isYesterday(selectedDate)) {
    return activeTab === 'habits' ? '昨日の習慣' : '昨日のタスク';
  }
  
  // その他の日付
  const month = selectedDate.getMonth() + 1;
  const day = selectedDate.getDate();
  const year = selectedDate.getFullYear();
  const currentYear = new Date().getFullYear();
  
  if (year === currentYear) {
    return activeTab === 'habits' ? `${month}月${day}日の習慣` : `${month}月${day}日のタスク`;
  } else {
    return activeTab === 'habits' ? `${year}年${month}月${day}日の習慣` : `${year}年${month}月${day}日のタスク`;
  }
};

/**
 * 未完了タスク数を計算する統一関数
 */
export const getIncompleteTaskCount = (tasks: Task[]): number => {
  return tasks.filter(task => task.status !== 'done').length;
};

/**
 * 習慣の頻度ラベルを取得する統一関数
 */
export const getFrequencyLabel = (frequency?: string): string => {
  switch (frequency) {
    case 'daily': return '毎日';
    case 'weekly': return '週1回';
    case 'monthly': return '月1回';
    default: return '毎日';
  }
};

/**
 * プラン別制限を取得する統一関数
 */
export const getPlanLimits = (planType: 'guest' | 'free' | 'premium') => {
  switch (planType) {
    case 'guest': 
      return { 
        maxHabits: 0, 
        maxStreakDays: 0, 
        maxTasks: 3,
        canSetDueDate: false,
        canAddPastTask: false
      };
    case 'free': 
      return { 
        maxHabits: 3, 
        maxStreakDays: 14, 
        maxTasks: Infinity,
        canSetDueDate: true,
        canAddPastTask: false
      };
    case 'premium': 
      return { 
        maxHabits: Infinity, 
        maxStreakDays: Infinity, 
        maxTasks: Infinity,
        canSetDueDate: true,
        canAddPastTask: true
      };
    default: 
      return { 
        maxHabits: 0, 
        maxStreakDays: 0, 
        maxTasks: 3,
        canSetDueDate: false,
        canAddPastTask: false
      };
  }
};

/**
 * エラーメッセージを統一する関数
 */
export const getErrorMessage = (error: string, context?: string): string => {
  const errorMessages: Record<string, string> = {
    'HABIT_LIMIT_EXCEEDED': '習慣の作成上限に達しました',
    'TASK_LIMIT_EXCEEDED': 'タスクの作成上限に達しました',
    'GUEST_RESTRICTION': 'ゲストユーザーはこの機能を利用できません',
    'AUTH_REQUIRED': 'ログインが必要です',
    'DATABASE_ERROR': 'データベースエラーが発生しました',
    'NETWORK_ERROR': 'ネットワークエラーが発生しました',
    'VALIDATION_ERROR': '入力内容に問題があります',
    'PERMISSION_ERROR': '権限がありません',
    'UNKNOWN_ERROR': '予期しないエラーが発生しました'
  };
  
  return errorMessages[error] || errorMessages['UNKNOWN_ERROR'];
};

/**
 * デバウンス関数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * スロットル関数
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

/**
 * ローカルストレージの安全な操作
 */
export const safeLocalStorage = {
  get: (key: string, defaultValue: any = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn('LocalStorage get error:', error);
      return defaultValue;
    }
  },
  
  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('LocalStorage set error:', error);
      return false;
    }
  },
  
  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('LocalStorage remove error:', error);
      return false;
    }
  }
};

/**
 * 配列の安全な操作
 */
export const safeArrayOperations = {
  find: <T>(array: T[], predicate: (item: T) => boolean): T | undefined => {
    return Array.isArray(array) ? array.find(predicate) : undefined;
  },
  
  filter: <T>(array: T[], predicate: (item: T) => boolean): T[] => {
    return Array.isArray(array) ? array.filter(predicate) : [];
  },
  
  map: <T, U>(array: T[], mapper: (item: T) => U): U[] => {
    return Array.isArray(array) ? array.map(mapper) : [];
  }
}; 