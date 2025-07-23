import { Task } from '@/types/task';

// 習慣タスクの頻度表示を取得
export const getFrequencyLabel = (frequency?: string): string => {
  switch (frequency) {
    case 'daily': return '毎日';
    case 'weekly': return '週1回';
    case 'monthly': return '月1回';
    default: return '毎日';
  }
};

// プラン別習慣制限を取得
export const getHabitLimits = (planType: string) => {
  switch (planType) {
    case 'guest': return { maxHabits: 0, maxStreakDays: 0 };
    case 'free': return { maxHabits: 3, maxStreakDays: 14 };
    case 'premium': return { maxHabits: Infinity, maxStreakDays: Infinity };
    default: return { maxHabits: 0, maxStreakDays: 0 };
  }
};

// 未完了タスク数を計算
export const getIncompleteCount = (tasks: Task[]): number => {
  return tasks.filter(task => task.status !== 'done').length;
};

// 通常タスクと習慣タスクを分離
export const separateTasks = (tasks: Task[]) => {
  const regular: Task[] = [];
  const habit: Task[] = [];
  
  tasks.forEach(task => {
    if (task.habit_status === 'active') {
      habit.push(task);
    } else {
      regular.push(task);
    }
  });
  
  return { regularTasks: regular, habitTasks: habit };
};

// 日付フォーマット
export const formatDate = (date: Date): string => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[date.getDay()];
  return `${month}月${day}日 (${weekday})`;
};

// 選択日に応じたタイトルを生成
export const getTitle = (selectedDate: Date, activeTab: 'tasks' | 'habits'): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDateTime = new Date(selectedDate);
  selectedDateTime.setHours(0, 0, 0, 0);
  const isToday = selectedDateTime.getTime() === today.getTime();

  if (isToday) {
    return activeTab === 'habits' ? '今日の習慣' : '今日のタスク';
  }
  
  const formattedDate = formatDate(selectedDate);
  return activeTab === 'habits' ? `${formattedDate}の習慣` : `${formattedDate}のタスク`;
}; 