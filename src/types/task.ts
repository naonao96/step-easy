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
  streak_count?: number;
  completed_at?: string;
} 