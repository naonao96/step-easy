import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

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

interface TaskStore {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

const GUEST_TASK_LIMIT = 3;

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const isGuest = user?.user_metadata?.is_guest;

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // ゲストユーザーの場合は3件までに制限
      const limitedTasks = isGuest ? data.slice(0, GUEST_TASK_LIMIT) : data;
      set({ tasks: limitedTasks });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  createTask: async (task) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const isGuest = user?.user_metadata?.is_guest;

      if (isGuest && get().tasks.length >= GUEST_TASK_LIMIT) {
        throw new Error('ゲストユーザーは3件までしかタスクを作成できません。アカウントを作成して続けるには、ログインしてください。');
      }

      const { error } = await supabase
        .from('tasks')
        .insert([task]);

      if (error) throw error;
      await get().fetchTasks();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  updateTask: async (id, task) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('tasks')
        .update(task)
        .eq('id', id);

      if (error) throw error;
      await get().fetchTasks();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  deleteTask: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await get().fetchTasks();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
})); 