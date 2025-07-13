import { Habit, HabitCompletionResult } from '@/types/habit';
import { Task } from '@/types/task';
import { isNewHabit, isLegacyHabit, isHabitCompleted } from './habitUtils';
import { useHabitStore } from '@/stores/habitStore';

// 習慣の完了処理
export const completeHabit = async (
  id: string,
  habits: Habit[],
  tasks: Task[],
  completeHabitFn: (id: string) => Promise<HabitCompletionResult>,
  updateTaskFn: (id: string, data: any) => Promise<void>,
  fetchHabitsFn: () => Promise<void>,
  toggleHabitCompletionFn?: (id: string, completed: boolean, targetDate?: string) => Promise<HabitCompletionResult>,
  selectedDate?: Date
): Promise<HabitCompletionResult> => {
  // 新しい習慣テーブルの習慣の場合
  const newHabit = habits.find(habit => habit.id === id);
  if (newHabit) {
    // 切り替え機能が利用可能な場合
    if (toggleHabitCompletionFn) {
      // 選択日付または今日の日付を取得（日本時間）
      const targetDate = selectedDate || new Date();
      const japanTime = new Date(targetDate.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
      const dateString = japanTime.toISOString().split('T')[0];
      
      // 現在の完了状態を確認（habit_completionsテーブルから）
      const { habitCompletions } = useHabitStore.getState();
      const isCurrentlyCompleted = habitCompletions.some(
        (completion: any) => completion.habit_id === id && completion.completed_date === dateString
      );
      
      const result = await toggleHabitCompletionFn(id, !isCurrentlyCompleted, dateString);
      await fetchHabitsFn(); // 習慣データを再取得
      return result;
    } else {
      // 従来の完了のみの処理
      const result = await completeHabitFn(id);
      await fetchHabitsFn(); // 習慣データを再取得
      return result;
    }
  }
  
  // 既存のタスクテーブルのタスクの場合
  const task = tasks.find(t => t.id === id);
  if (task && isLegacyHabit(task)) {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    const completedAt = newStatus === 'done' ? new Date().toISOString() : undefined;
    await updateTaskFn(id, { status: newStatus, completed_at: completedAt });
    return { success: true };
  }
  
  return { success: false, error: 'HABIT_NOT_FOUND', message: '習慣が見つかりません' };
};

// 習慣の削除処理
export const deleteHabit = async (
  id: string,
  habits: Habit[],
  tasks: Task[],
  deleteHabitFn: (id: string) => Promise<void>,
  deleteTaskFn: (id: string) => Promise<void>
) => {
  // 新しい習慣テーブルからの削除
  await deleteHabitFn(id);
  
  // 既存のタスクテーブルからの習慣削除も試行
  const legacyHabit = tasks.find(task => task.id === id && task.is_habit);
  if (legacyHabit) {
    await deleteTaskFn(id);
  }
};

// 習慣の編集処理
export const editHabit = async (
  id: string,
  updates: any,
  habits: Habit[],
  tasks: Task[],
  updateHabitFn: (id: string, updates: any) => Promise<void>,
  updateTaskFn: (id: string, updates: any) => Promise<void>
) => {
  // 新しい習慣テーブルの習慣の場合
  const newHabit = habits.find(habit => habit.id === id);
  if (newHabit) {
    await updateHabitFn(id, updates);
    return;
  }
  
  // 既存のタスクテーブルの習慣の場合
  const task = tasks.find(t => t.id === id);
  if (task && isLegacyHabit(task)) {
    await updateTaskFn(id, updates);
  }
}; 