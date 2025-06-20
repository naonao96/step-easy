import { create } from 'zustand';
import { ActiveTaskExecution, Task } from '@/types/task';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ExecutionStore {
  activeExecution: ActiveTaskExecution | null;
  elapsedTime: number; // 現在の経過時間（秒）
  isRunning: boolean;
  
  // アクション
  startExecution: (taskId: string) => void;
  stopExecution: () => Promise<void>;
  pauseExecution: () => void;
  resumeExecution: () => void;
  updateElapsedTime: () => void;
  resetExecution: () => void;
}

export const useExecutionStore = create<ExecutionStore>((set, get) => {
  let timerInterval: NodeJS.Timeout | null = null;

  const startTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      const state = get();
      if (state.isRunning && state.activeExecution) {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - state.activeExecution.start_time.getTime()) / 1000);
        set({ elapsedTime: elapsed });
      }
    }, 1000);
  };

  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  };

  return {
    activeExecution: null,
    elapsedTime: 0,
    isRunning: false,

    startExecution: (taskId: string) => {
      const now = new Date();
      set({
        activeExecution: {
          task_id: taskId,
          start_time: now,
          elapsed_seconds: 0
        },
        elapsedTime: 0,
        isRunning: true
      });
      startTimer();
    },

    stopExecution: async () => {
      const state = get();
      if (!state.activeExecution) return;

      stopTimer();
      
      try {
        const supabase = createClientComponentClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        const totalDuration = Math.floor(state.elapsedTime / 60); // 分に変換
        
        if (user) {
          // Supabaseでタスクのactual_durationを更新
          const { error } = await supabase
            .from('tasks')
            .update({ 
              actual_duration: totalDuration,
              updated_at: new Date().toISOString()
            })
            .eq('id', state.activeExecution.task_id)
            .eq('user_id', user.id);

          if (error) {
            console.error('実行時間の保存エラー:', error);
          }
        } else {
          // ゲストユーザーの場合はローカルストレージを更新
          const guestTasks = JSON.parse(localStorage.getItem('guestTasks') || '[]');
          const taskIndex = guestTasks.findIndex((t: Task) => t.id === state.activeExecution?.task_id);
          
          if (taskIndex !== -1) {
            guestTasks[taskIndex] = {
              ...guestTasks[taskIndex],
              actual_duration: totalDuration,
              updated_at: new Date().toISOString()
            };
            localStorage.setItem('guestTasks', JSON.stringify(guestTasks));
          }
        }

        set({
          activeExecution: null,
          elapsedTime: 0,
          isRunning: false
        });
      } catch (error) {
        console.error('実行時間保存エラー:', error);
      }
    },

    pauseExecution: () => {
      stopTimer();
      set({ isRunning: false });
    },

    resumeExecution: () => {
      const state = get();
      if (state.activeExecution) {
        set({ isRunning: true });
        startTimer();
      }
    },

    updateElapsedTime: () => {
      const state = get();
      if (state.activeExecution && state.isRunning) {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - state.activeExecution.start_time.getTime()) / 1000);
        set({ elapsedTime: elapsed });
      }
    },

    resetExecution: () => {
      stopTimer();
      set({
        activeExecution: null,
        elapsedTime: 0,
        isRunning: false
      });
    }
  };
}); 