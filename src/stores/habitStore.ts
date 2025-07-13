import { create } from 'zustand';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Habit, HabitCompletion, HabitFormData, HabitCompletionError, HabitCompletionResult } from '@/types/habit';

const supabase = createClientComponentClient();

interface HabitStore {
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  isLoading: boolean;
  fetchHabits: () => Promise<void>;
  createHabit: (habit: HabitFormData) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  completeHabit: (habitId: string) => Promise<HabitCompletionResult>;
  toggleHabitCompletion: (habitId: string, completed: boolean, targetDate?: string) => Promise<HabitCompletionResult>;
  recalculateHabitStreak: (habitId: string) => Promise<void>;
  getTodayCompletions: () => HabitCompletion[];
  getHabitsWithCompletion: () => HabitWithCompletion[];
  getHabitsWithCompletionForDate: (targetDate: Date) => HabitWithCompletion[];
  getDisplayStreak: (habitId: string) => number;
}

interface HabitWithCompletion extends Habit {
  isCompleted: boolean;
}

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],
  habitCompletions: [],
  isLoading: false,

  fetchHabits: async () => {
    set({ isLoading: true });
    try {
      const { data: habits, error } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: completions, error: completionsError } = await supabase
        .from('habit_completions')
        .select('*');

      if (completionsError) throw completionsError;

      set({ habits: habits || [], habitCompletions: completions || [] });
    } catch (error) {
      console.error('習慣取得エラー:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createHabit: async (habitData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザーが認証されていません');

      const habit = {
        ...habitData,
        user_id: user.id,
        habit_status: habitData.habit_status || 'active',
        frequency: 'daily' as const,
        current_streak: 0,
        longest_streak: 0
      };

      const { error } = await supabase
        .from('habits')
        .insert([habit]);

      if (error) throw error;
      await get().fetchHabits();
    } catch (error) {
      console.error('習慣作成エラー:', error);
      throw error;
    }
  },

  updateHabit: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('habits')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      // fetchHabits()は呼び出し元で行うため、ここでは削除
    } catch (error) {
      console.error('習慣更新エラー:', error);
      throw error;
    }
  },

  deleteHabit: async (id) => {
    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await get().fetchHabits();
    } catch (error) {
      console.error('習慣削除エラー:', error);
      throw error;
    }
  },

  completeHabit: async (habitId): Promise<HabitCompletionResult> => {
    try {
      // 日本時間での今日の日付を取得
      const now = new Date();
      const japanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
      const today = japanTime.toISOString().split('T')[0];
      
      // フロントエンド側での重複チェック
      const { habits, habitCompletions } = get();
      const isAlreadyCompleted = habitCompletions.some(
        completion => completion.habit_id === habitId && completion.completed_date === today
      );
      
      if (isAlreadyCompleted) {
        return {
          success: false,
          error: 'ALREADY_COMPLETED',
          message: 'この日付は既に完了済みです'
        };
      }
      
      // トランザクション関数が利用可能かチェック
      try {
        const { data, error } = await supabase.rpc('complete_habit_transaction', {
          p_habit_id: habitId,
          p_completed_date: today
        });

        if (error) {
          // エラーメッセージを日本語化
          let errorType: HabitCompletionError = 'UNKNOWN_ERROR';
          let errorMessage = '習慣の完了に失敗しました';
          
          if (error.message.includes('既に完了済み')) {
            errorType = 'ALREADY_COMPLETED';
            errorMessage = 'この日付は既に完了済みです';
          } else if (error.message.includes('習慣が見つかりません')) {
            errorType = 'HABIT_NOT_FOUND';
            errorMessage = '習慣が見つかりません';
          } else if (error.message.includes('unique_habit_date')) {
            errorType = 'DUPLICATE_COMPLETION';
            errorMessage = 'この日付は既に完了済みです';
          }
          
          return {
            success: false,
            error: errorType,
            message: errorMessage
          };
        }
      } catch (rpcError) {
        // トランザクション関数が利用できない場合は従来の方法で実行
        console.warn('トランザクション関数が利用できません。従来の方法で実行します:', rpcError);
        
        // 従来の完了処理
        const { error: completionError } = await supabase
          .from('habit_completions')
          .insert([{
            habit_id: habitId,
            completed_date: today
          }]);

        if (completionError) {
          return {
            success: false,
            error: 'DATABASE_ERROR',
            message: 'データベースエラーが発生しました'
          };
        }

              // 正確な継続日数を計算
      await get().recalculateHabitStreak(habitId);
    }

    // データを再取得してUIを更新
    await get().fetchHabits();
      
      return {
        success: true,
        message: '習慣を完了しました'
      };
    } catch (error) {
      console.error('習慣完了エラー:', error);
      return {
        success: false,
        error: 'UNKNOWN_ERROR',
        message: '予期しないエラーが発生しました'
      };
    }
  },

  toggleHabitCompletion: async (habitId: string, completed: boolean, targetDate?: string): Promise<HabitCompletionResult> => {
    try {
      // 指定された日付または日本時間での今日の日付を取得
      const dateString = targetDate || (() => {
        const now = new Date();
        const japanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
        return japanTime.toISOString().split('T')[0];
      })();
      
      const { habits, habitCompletions } = get();
      const isCurrentlyCompleted = habitCompletions.some(
        completion => completion.habit_id === habitId && completion.completed_date === dateString
      );
      
      if (completed === isCurrentlyCompleted) {
        // 既に目的の状態になっている場合
        return {
          success: true,
          message: completed ? '既に完了済みです' : '既に未完了です'
        };
      }
      
      if (completed) {
        // 完了にする場合
        const { error: completionError } = await supabase
          .from('habit_completions')
          .insert([{
            habit_id: habitId,
            completed_date: dateString
          }]);

        if (completionError) {
          return {
            success: false,
            error: 'DATABASE_ERROR',
            message: '完了処理に失敗しました'
          };
        }
      } else {
        // 未完了にする場合（完了記録を削除）
        const { error: deletionError } = await supabase
          .from('habit_completions')
          .delete()
          .eq('habit_id', habitId)
          .eq('completed_date', dateString);

        if (deletionError) {
          return {
            success: false,
            error: 'DATABASE_ERROR',
            message: '未完了処理に失敗しました'
          };
        }
      }
      
      // データを再取得してUIを更新（ストリーク計算前に最新データを取得）
      await get().fetchHabits();
      
      // 最新データで正確な継続日数を計算
      await get().recalculateHabitStreak(habitId);
      
      return {
        success: true,
        message: completed ? '習慣を完了しました' : '習慣を未完了に戻しました'
      };
    } catch (error) {
      console.error('習慣切り替えエラー:', error);
      return {
        success: false,
        error: 'UNKNOWN_ERROR',
        message: '予期しないエラーが発生しました'
      };
    }
  },

  getTodayCompletions: () => {
    // 日本時間での今日の日付を取得
    const now = new Date();
    const japanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    const today = japanTime.toISOString().split('T')[0];
    return get().habitCompletions.filter(c => c.completed_date === today);
  },

  getHabitsWithCompletion: () => {
    const { habits, habitCompletions } = get();
    // 日本時間での今日の日付を取得
    const now = new Date();
    const japanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    const today = japanTime.toISOString().split('T')[0];
    const todayCompletions = habitCompletions.filter(c => c.completed_date === today);

    return habits.map(habit => ({
      ...habit,
      isCompleted: todayCompletions.some(c => c.habit_id === habit.id)
    }));
  },

  getHabitsWithCompletionForDate: (targetDate: Date) => {
    const { habits, habitCompletions } = get();
    const dateString = targetDate.toISOString().split('T')[0];
    const dateCompletions = habitCompletions.filter(c => c.completed_date === dateString);

    return habits.map(habit => ({
      ...habit,
      isCompleted: dateCompletions.some(c => c.habit_id === habit.id)
    }));
  },

  // 表示用の継続日数を取得（今日の完了状態を考慮）
  getDisplayStreak: (habitId: string) => {
    const { habits, habitCompletions } = get();
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return 0;

    // 今日の完了状態を確認
    const now = new Date();
    const japanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    const today = japanTime.toISOString().split('T')[0];
    const isCompletedToday = habitCompletions.some(
      completion => completion.habit_id === habitId && completion.completed_date === today
    );

    // データベース上の継続日数（前日まで）+ 今日の完了状態
    return isCompletedToday ? habit.current_streak + 1 : habit.current_streak;
  },

  recalculateHabitStreak: async (habitId: string) => {
    try {
      // 最新の完了データを直接データベースから取得（確実性のため）
      const { data: habitCompletions, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('habit_id', habitId);
      
      if (error) throw error;
      
      // この習慣の完了記録を取得
      const habitCompletionsForHabit = habitCompletions || [];
      
      // 前日までの正確なストリーク計算（今日は含めない）
      const { calculateHabitStreak } = await import('@/lib/streakUtils');
      const currentStreak = calculateHabitStreak(habitCompletionsForHabit, false);
      
      // 最長ストリークを計算（過去の完了記録から）
      let longestStreak = 0;
      let tempStreak = 0;
      const sortedDates = habitCompletionsForHabit
        .map(c => c.completed_date)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      
      for (let i = 0; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i]);
        const previousDate = i > 0 ? new Date(sortedDates[i-1]) : null;
        
        if (!previousDate || getDaysDifference(currentDate, previousDate) <= 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
        
        longestStreak = Math.max(longestStreak, tempStreak);
      }
      
      // 最後の完了日を取得
      const lastCompletedDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null;
      
      // 習慣テーブルを更新
      await get().updateHabit(habitId, {
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_completed_date: lastCompletedDate
      });
      
      // 更新されたデータを即座に反映
      const updatedHabits = get().habits.map(habit => 
        habit.id === habitId 
          ? { ...habit, current_streak: currentStreak, longest_streak: longestStreak, last_completed_date: lastCompletedDate }
          : habit
      );
      set({ habits: updatedHabits });
    } catch (error) {
      console.error('継続日数計算エラー:', error);
    }
  }
}));

// 日付の差分を計算するヘルパー関数
const getDaysDifference = (date1: Date, date2: Date): number => {
  const timeDiff = Math.abs(date1.getTime() - date2.getTime());
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}; 