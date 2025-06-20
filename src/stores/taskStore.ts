import { create } from 'zustand';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/contexts/AuthContext';
import { getExpiredStreakTasks } from '@/lib/streakUtils';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  start_date: string | null;  // 開始日
  created_at: string;
  updated_at: string;
  user_id: string;
  is_habit: boolean;
  habit_frequency?: 'daily' | 'weekly' | 'monthly';
  
  // 継続日数関連フィールド
  current_streak: number;        // 現在の継続日数
  longest_streak: number;        // 最長継続日数
  last_completed_date: string | null;  // 最後に完了した日付
  streak_start_date: string | null;    // 現在のストリーク開始日
  
  // 実行時間関連フィールド
  estimated_duration?: number;   // 予想所要時間（分）
  actual_duration?: number;      // 実際の所要時間（分）
  
  // カテゴリ
  category?: string;             // カテゴリ（work, health, study, personal, hobby, other）
  
  // 互換性のために残す（後で削除予定）
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
  // 開発用のダミーデータ作成
  createDummyTasks: () => Promise<void>;
  // 期限切れストリークの自動リセット
  resetExpiredStreaks: () => Promise<void>;
  // 無料ユーザーの30日経過データクリーンアップ
  cleanupExpiredData: () => Promise<void>;
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
          updated_at: new Date().toISOString(),
          // 開始日のデフォルト値（今日）
          start_date: task.start_date || new Date().toISOString().split('T')[0],
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

  // 開発用のダミーデータ作成
  createDummyTasks: async () => {
    const dummyTasks = [
      {
        title: '朝の運動',
        description: '30分のジョギングまたはストレッチ',
        status: 'todo' as const,
        priority: 'medium' as const,
        due_date: null,
        start_date: new Date().toISOString().split('T')[0], // 今日
        is_habit: true,
        habit_frequency: 'daily' as const,
        current_streak: 5,
        longest_streak: 12,
        last_completed_date: '2024-12-18',
        streak_start_date: '2024-12-14'
      },
      {
        title: '読書タイム',
        description: '技術書を30分読む',
        status: 'done' as const,
        priority: 'low' as const,
        due_date: null,
        start_date: new Date().toISOString().split('T')[0], // 今日
        is_habit: true,
        habit_frequency: 'daily' as const,
        current_streak: 3,
        longest_streak: 8,
        last_completed_date: new Date().toISOString().split('T')[0],
        streak_start_date: '2024-12-17',
        completed_at: new Date().toISOString()
      },
      {
        title: 'プロジェクト資料作成',
        description: '来週のプレゼン用資料を準備',
        status: 'doing' as const,
        priority: 'high' as const,
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 明日
        start_date: new Date().toISOString().split('T')[0], // 今日
        is_habit: false,
        current_streak: 0,
        longest_streak: 0,
        last_completed_date: null,
        streak_start_date: null
      },
      {
        title: '今日のタスク完了テスト',
        description: 'このタスクを完了して円グラフの動作確認',
        status: 'todo' as const,
        priority: 'high' as const,
        due_date: null,
        start_date: new Date().toISOString().split('T')[0], // 今日
        is_habit: false,
        current_streak: 0,
        longest_streak: 0,
        last_completed_date: null,
        streak_start_date: null
      }
    ];

    for (const task of dummyTasks) {
      await get().createTask(task);
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

  // 無料ユーザーの30日経過データクリーンアップ
  cleanupExpiredData: async () => {
    try {
      const supabase = createClientComponentClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      // ゲストユーザーは処理不要（ローカルストレージ管理）
      if (!user) {
        console.log('ゲストユーザー - データクリーンアップは不要');
        return;
      }

      // プレミアムユーザーは無制限保存なので処理不要
      const isGuest = user?.user_metadata?.is_guest;
      const isPremium = user?.user_metadata?.is_premium;
      
      if (isPremium) {
        console.log('プレミアムユーザー - データクリーンアップは不要');
        return;
      }

      // 無料ユーザーのみ30日経過データを削除
      console.log('無料ユーザー - 30日経過データのクリーンアップを開始');
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoffDate = thirtyDaysAgo.toISOString();

      // 30日以上前に作成されたタスクを削除
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', user.id)
        .lt('created_at', cutoffDate);

      if (deleteError) {
        console.error('データクリーンアップエラー:', deleteError);
        throw deleteError;
      }

      console.log('データクリーンアップ完了');
      
      // タスクリストを再取得
      await get().fetchTasks();
      
    } catch (error) {
      console.error('データクリーンアップエラー:', error);
      set({ error: (error as Error).message });
    }
  },
})); 