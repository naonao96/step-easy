import { create } from 'zustand';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getExpiredStreakTasks } from '@/lib/streakUtils';
import { Task } from '@/types/task';

// モジュールレベルでSupabaseクライアントを一度だけ作成
const supabase = createClientComponentClient();

interface TaskStore {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // 期限切れストリークの自動リセット
  resetExpiredStreaks: () => Promise<void>;
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
  
      
      // ゲストユーザーの場合はローカルストレージから取得
      if (!user) {
        const guestTasks = JSON.parse(localStorage.getItem('guestTasks') || '[]');
        set({ tasks: guestTasks });
        return;
      }
      
      const isGuest = user?.user_metadata?.is_guest;

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // ゲストユーザーの場合は3件までに制限
      const limitedTasks = isGuest ? data.slice(0, GUEST_TASK_LIMIT) : data;
      set({ tasks: limitedTasks as unknown as Task[] });
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
      const { data: { user } } = await supabase.auth.getUser();
      
      // ゲストユーザーの場合の処理
      if (!user) {
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
          updated_at: new Date().toISOString(),
          // ゲストタスクは日付なしタスクとして扱う（今日のみ表示）
          start_date: null,
          due_date: null,
          // 継続日数関連のデフォルト値
          current_streak: 0,
          longest_streak: 0,
          last_completed_date: null,
          streak_start_date: null
        };
        
        guestTasks.push(newTask);
        localStorage.setItem('guestTasks', JSON.stringify(guestTasks));
        
        // ローカルタスクを再読み込み
        await get().fetchTasks();
        return;
      }
      
      const isGuest = user?.user_metadata?.is_guest;

      if (isGuest && get().tasks.length >= GUEST_TASK_LIMIT) {
        throw new Error('ゲストユーザーは3件までしかタスクを作成できません。アカウントを作成して続けるには、ログインしてください。');
      }

      const taskWithUserId = {
        ...task,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([taskWithUserId])
        .select();

      if (error) throw error;
      
      await get().fetchTasks();
    } catch (error) {
      console.error('createTask エラー:', error);
      set({ error: (error as Error).message });
      console.error('タスク作成エラー:', error);
    } finally {
      set({ loading: false });
    }
  },

  updateTask: async (id, task) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // ゲストユーザーの場合はローカルストレージを更新
      if (!user) {
        const guestTasks = JSON.parse(localStorage.getItem('guestTasks') || '[]');
        const taskIndex = guestTasks.findIndex((t: Task) => t.id === id);
        
        if (taskIndex !== -1) {
          const updatedTask = {
            ...guestTasks[taskIndex],
            ...task,
            updated_at: new Date().toISOString()
          };
          
          // ゲストユーザーの場合、タスクが完了状態になった時の継続日数計算
          if (task.status === 'done' && guestTasks[taskIndex].status !== 'done') {
            const today = new Date().toISOString().split('T')[0];
            const lastCompleted = updatedTask.last_completed_date;
            
            if (!lastCompleted) {
              // 初回完了
              updatedTask.current_streak = 1;
              updatedTask.longest_streak = Math.max(updatedTask.longest_streak || 0, 1);
              updatedTask.last_completed_date = today;
              updatedTask.streak_start_date = today;
            } else {
              const daysDiff = Math.floor((new Date(today).getTime() - new Date(lastCompleted).getTime()) / (1000 * 60 * 60 * 24));
              
              if (daysDiff === 1) {
                // 連続日
                updatedTask.current_streak = (updatedTask.current_streak || 0) + 1;
                updatedTask.longest_streak = Math.max(updatedTask.longest_streak || 0, updatedTask.current_streak);
                updatedTask.last_completed_date = today;
              } else if (daysDiff === 0) {
                // 同日完了（ストリークは変更なし）
                updatedTask.last_completed_date = today;
              } else {
                // ストリーク切れ
                updatedTask.current_streak = 1;
                updatedTask.longest_streak = Math.max(updatedTask.longest_streak || 0, 1);
                updatedTask.last_completed_date = today;
                updatedTask.streak_start_date = today;
              }
            }
          }
          
          guestTasks[taskIndex] = updatedTask;
          localStorage.setItem('guestTasks', JSON.stringify(guestTasks));
        }
        
        await get().fetchTasks();
        return;
      }

      // 認証済みユーザーの場合、データベースで継続日数を自動計算
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



  // 期限切れストリークの自動リセット
  resetExpiredStreaks: async () => {
    const currentTasks = get().tasks;
    const expiredTasks = getExpiredStreakTasks(currentTasks as any);
    
    if (expiredTasks.length === 0) return;

    console.log(`期限切れストリークをリセット: ${expiredTasks.length}件`);
    
    try {
      // 各期限切れタスクのストリークをリセット
      for (const task of expiredTasks) {
        await get().updateTask(task.id, {
          current_streak: 0,
          streak_start_date: null
        });
      }
      
      console.log('期限切れストリークのリセットが完了しました');
    } catch (error) {
      console.error('ストリークリセットエラー:', error);
      set({ error: (error as Error).message });
    }
  },


})); 