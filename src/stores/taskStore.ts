import { create } from 'zustand';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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
  createTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
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
      const supabase = createClientComponentClient();
      const { data: { user } } = await supabase.auth.getUser();
      console.log('fetchTasks - 認証ユーザー情報:', user);
      
      // ゲストユーザーの場合はローカルストレージから取得
      if (!user) {
        console.log('ゲストユーザー - ローカルストレージから取得');
        const guestTasks = JSON.parse(localStorage.getItem('guestTasks') || '[]');
        console.log('ゲストタスク:', guestTasks);
        set({ tasks: guestTasks });
        return;
      }
      
      console.log('認証済みユーザー - Supabaseから取得');
      const isGuest = user?.user_metadata?.is_guest;

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Supabase select結果:', { data, error });

      if (error) throw error;

      // ゲストユーザーの場合は3件までに制限
      const limitedTasks = isGuest ? data.slice(0, GUEST_TASK_LIMIT) : data;
      console.log('設定するタスク:', limitedTasks);
      set({ tasks: limitedTasks });
    } catch (error) {
      console.error('fetchTasks エラー:', error);
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  createTask: async (task) => {
    set({ loading: true, error: null });
    try {
      const supabase = createClientComponentClient();
      const { data: { user } } = await supabase.auth.getUser();
      console.log('認証ユーザー情報:', user);
      
      // ゲストユーザーの場合の処理
      if (!user) {
        console.log('ゲストユーザーとしてローカルストレージに保存');
        // ローカルストレージからゲストタスクを取得
        const guestTasks = JSON.parse(localStorage.getItem('guestTasks') || '[]');
        
        if (guestTasks.length >= GUEST_TASK_LIMIT) {
          throw new Error('ゲストユーザーは3件までしかタスクを作成できません。アカウントを作成して続けるには、ログインしてください。');
        }

        // ゲストタスクをローカルストレージに保存
        const newTask = {
          ...task,
          id: `guest-${Date.now()}`,
          user_id: 'guest',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        guestTasks.push(newTask);
        localStorage.setItem('guestTasks', JSON.stringify(guestTasks));
        
        // ローカルタスクを再読み込み
        await get().fetchTasks();
        return;
      }
      
      console.log('認証済みユーザーとしてSupabaseに保存');
      const isGuest = user?.user_metadata?.is_guest;

      if (isGuest && get().tasks.length >= GUEST_TASK_LIMIT) {
        throw new Error('ゲストユーザーは3件までしかタスクを作成できません。アカウントを作成して続けるには、ログインしてください。');
      }

      const taskWithUserId = {
        ...task,
        user_id: user.id
      };

      console.log('保存するタスクデータ:', taskWithUserId);

      const { data, error } = await supabase
        .from('tasks')
        .insert([taskWithUserId])
        .select();

      console.log('Supabase insert結果:', { data, error });

      if (error) throw error;
      await get().fetchTasks();
    } catch (error) {
      set({ error: (error as Error).message });
      console.error('タスク作成エラー:', error);
    } finally {
      set({ loading: false });
    }
  },

  updateTask: async (id, task) => {
    set({ loading: true, error: null });
    try {
      const supabase = createClientComponentClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      // ゲストユーザーの場合はローカルストレージを更新
      if (!user) {
        const guestTasks = JSON.parse(localStorage.getItem('guestTasks') || '[]');
        const taskIndex = guestTasks.findIndex((t: Task) => t.id === id);
        
        if (taskIndex !== -1) {
          guestTasks[taskIndex] = {
            ...guestTasks[taskIndex],
            ...task,
            updated_at: new Date().toISOString()
          };
          localStorage.setItem('guestTasks', JSON.stringify(guestTasks));
        }
        
        await get().fetchTasks();
        return;
      }

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
      const supabase = createClientComponentClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      // ゲストユーザーの場合はローカルストレージから削除
      if (!user) {
        const guestTasks = JSON.parse(localStorage.getItem('guestTasks') || '[]');
        const filteredTasks = guestTasks.filter((t: Task) => t.id !== id);
        localStorage.setItem('guestTasks', JSON.stringify(filteredTasks));
        
        await get().fetchTasks();
        return;
      }

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