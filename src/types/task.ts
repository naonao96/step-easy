export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  completed_at: string | null;
  is_habit: boolean;
  habit_frequency: 'daily' | 'weekly' | 'monthly' | null;
  streak_count: number;
  best_streak: number;
  ai_support_count: number;
  completion_rate: number;
  tags: string[];
  difficulty_level: number;
  estimated_minutes: number;
  created_at: string;
  updated_at: string;
} 