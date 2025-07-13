import { create } from 'zustand';
import { ActiveTaskExecution, Task } from '@/types/task';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Supabaseクライアントはシングルトンとしてモジュールレベルで一度だけ生成
const supabase = createClientComponentClient();

interface ExecutionStore {
  activeExecution: ActiveTaskExecution | null;
  elapsedTime: number; // 現在の経過時間（秒）
  accumulatedTime: number; // 累積時間（一時停止前の時間）
  isRunning: boolean;
  deviceType: 'mobile' | 'desktop';
  
  // アクション
  startExecution: (taskId: string) => Promise<{ success: boolean; error?: string; message?: string; conflictInfo?: any } | void>;
  stopExecution: () => Promise<void>;
  pauseExecution: () => Promise<void>;
  resumeExecution: () => Promise<{ success: boolean; error?: string; message?: string; conflictInfo?: any } | void>;
  updateElapsedTime: () => void;
  resetExecution: (resetType?: 'session' | 'today' | 'total') => Promise<void>;
  
  // 新しいアクション  
  checkActiveExecution: () => Promise<void>;
  syncWithDatabase: () => Promise<void>;
  forceCleanupActiveExecutions: () => Promise<void>;
}

export const useExecutionStore = create<ExecutionStore>((set, get) => {
  let timerInterval: NodeJS.Timeout | null = null;
  let syncTimer: NodeJS.Timeout | null = null;

  // デバイスタイプを判定
  const detectDeviceType = (): 'mobile' | 'desktop' => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768 ? 'mobile' : 'desktop';
    }
    return 'desktop';
  };

  const startTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      const state = get();
      if (state.isRunning && state.activeExecution) {
        const now = new Date();
        const currentSessionTime = Math.floor((now.getTime() - state.activeExecution.start_time.getTime()) / 1000);
        const totalElapsed = state.accumulatedTime + currentSessionTime;
        set({ elapsedTime: totalElapsed });
      }
    }, 1000);
    
    // 定期同期も開始
    startSyncTimer();
  };

  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    stopSyncTimer();
  };

  const startSyncTimer = () => {
    if (syncTimer) clearInterval(syncTimer);
    // 30秒ごとにデータベースと同期
    syncTimer = setInterval(() => {
      const state = get();
      if (state.activeExecution) {
        get().syncWithDatabase();
      }
    }, 30000);
  };

  const stopSyncTimer = () => {
    if (syncTimer) {
      clearInterval(syncTimer);
      syncTimer = null;
    }
  };

  // 今日の日付を取得（YYYY-MM-DD形式）
  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // 今日の累積時間を計算
  const calculateTodayTotal = async (taskId: string, newDuration: number): Promise<number> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return newDuration;

      const today = getTodayString();
      
      // 今日の実行履歴を取得
      const { data: todayLogs } = await supabase
        .from('execution_logs')
        .select('duration')
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .gte('start_time', `${today}T00:00:00.000Z`)
        .lt('start_time', `${today}T23:59:59.999Z`)
        .eq('is_completed', true);

      const todayTotal = (todayLogs || []).reduce((sum, log) => sum + (log.duration as number), 0);
      return todayTotal + newDuration;
    } catch (error) {
      console.error('今日の累積時間計算エラー:', error);
      return newDuration;
    }
  };

  return {
    activeExecution: null,
    elapsedTime: 0,
    accumulatedTime: 0,
    isRunning: false,
    deviceType: detectDeviceType(),

    // 他のデバイスでの実行状態をチェック
    checkActiveExecution: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        const { data: activeExec } = await supabase
          .from('active_executions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (activeExec && !get().activeExecution) {
          // 他のデバイスで実行中の場合、ローカル状態を同期
          set({
            activeExecution: {
              task_id: activeExec.task_id as string,
              start_time: new Date(activeExec.start_time as string),
              elapsed_seconds: 0
            },
            accumulatedTime: activeExec.accumulated_time as number,
            isRunning: !activeExec.is_paused,
            deviceType: activeExec.device_type as 'mobile' | 'desktop'
          });
          
          if (!activeExec.is_paused) {
            startTimer();
          }
        }
      } catch (error) {
        console.error('実行状態チェックエラー:', error);
      }
    },

    startExecution: async (taskId: string) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // ゲストユーザーの場合（既存ロジック）
          const now = new Date();
          set({
            activeExecution: {
              task_id: taskId,
              start_time: now,
              elapsed_seconds: 0
            },
            elapsedTime: 0,
            accumulatedTime: 0,
            isRunning: true,
            deviceType: detectDeviceType()
          });
          startTimer();
          return;
        }

        // 他のタスクが実行中でないかチェック
        const { data: existingExec } = await supabase
          .from('active_executions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (existingExec) {
          // ランタイムエラーではなく、制御された戻り値で処理
          return {
            success: false,
            error: 'DEVICE_CONFLICT',
            message: '他のデバイスでタスクが実行中です',
            conflictInfo: {
              taskId: existingExec.task_id,
              deviceType: existingExec.device_type,
              isPaused: existingExec.is_paused,
              startTime: existingExec.start_time
            }
          };
        }

        const now = new Date();
        const deviceType = detectDeviceType();

        // active_executionsに記録
        const { error: activeError } = await supabase
          .from('active_executions')
          .insert({
            user_id: user.id,
            task_id: taskId,
            start_time: now.toISOString(),
            device_type: deviceType,
            is_paused: false,
            accumulated_time: 0
          });

        if (activeError) throw activeError;

        // ローカル状態を更新
        set({
          activeExecution: {
            task_id: taskId,
            start_time: now,
            elapsed_seconds: 0
          },
          elapsedTime: 0,
          accumulatedTime: 0,
          isRunning: true,
          deviceType
        });
        
        startTimer();
        
        return { success: true };
      } catch (error) {
        console.error('実行開始エラー:', error);
        
        // エラー種別に応じた処理
        if (error instanceof Error) {
          if (error.message.includes('PGRST301')) {
            return { success: false, error: 'DATABASE_ERROR', message: 'データベースに接続できません。ネットワーク接続を確認してください。' };
          } else if (error.message.includes('JWT')) {
            return { success: false, error: 'AUTH_ERROR', message: 'セッションが期限切れです。再ログインしてください。' };
          } else if (error.message.includes('permission')) {
            return { success: false, error: 'PERMISSION_ERROR', message: 'アクセス権限がありません。' };
          }
        }
        
        return { success: false, error: 'UNKNOWN_ERROR', message: '予期しないエラーが発生しました。もう一度お試しください。' };
      }
    },

    stopExecution: async () => {
      const state = get();
      if (!state.activeExecution) return;

      stopTimer();
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // データベース状態確認：他デバイスで強制クリーンアップされていないかチェック
        if (user) {
          const { data: existingExec } = await supabase
            .from('active_executions')
            .select('*')
            .eq('user_id', user.id)
            .eq('task_id', state.activeExecution.task_id)
            .single();

          if (!existingExec) {
            // 他デバイスで強制クリーンアップされている場合
            console.warn('他デバイスで実行状態がクリーンアップされています');
            set({
              activeExecution: null,
              elapsedTime: 0,
              accumulatedTime: 0,
              isRunning: false
            });
            return;
          }
        }
        
        const sessionDuration = Math.floor(state.elapsedTime);
        const endTime = new Date();
        
        if (user) {
          // 現在のタスクが習慣かどうかを判定
          const { data: currentTask } = await supabase
            .from('tasks')
            .select('is_habit')
            .eq('id', state.activeExecution.task_id)
            .single();

          const sessionType = currentTask?.is_habit ? 'habit' : 'normal';

          // 実行履歴に記録
          const { error: logError } = await supabase
            .from('execution_logs')
            .insert({
              user_id: user.id,
              task_id: state.activeExecution.task_id,
              start_time: state.activeExecution.start_time.toISOString(),
              end_time: endTime.toISOString(),
              duration: sessionDuration,
              device_type: state.deviceType,
              session_type: sessionType,
              is_completed: true
            });

          if (logError) throw logError;

          // 今日の累積時間を計算
          const todayTotal = await calculateTodayTotal(state.activeExecution.task_id, sessionDuration);

          // タスクテーブルを更新（累積加算）
          const { data: taskData } = await supabase
            .from('tasks')
            .select('all_time_total, execution_count')
            .eq('id', state.activeExecution.task_id)
            .eq('user_id', user.id)
            .single();

          const newAllTimeTotal = ((taskData?.all_time_total as number) || 0) + sessionDuration;
          const newExecutionCount = ((taskData?.execution_count as number) || 0) + 1;

          const { error: updateError } = await supabase
            .from('tasks')
            .update({ 
              all_time_total: newAllTimeTotal,
              today_total: todayTotal,
              actual_duration: Math.floor(newAllTimeTotal / 60), // 制約緩和により0も許可
              execution_count: newExecutionCount,
              last_execution_date: getTodayString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', state.activeExecution.task_id)
            .eq('user_id', user.id);

          if (updateError) throw updateError;

          // active_executionsから削除（特定タスクのみ）
          await supabase
            .from('active_executions')
            .delete()
            .eq('user_id', user.id)
            .eq('task_id', state.activeExecution.task_id);

        } else {
          // ゲストユーザーの場合（既存ロジック）
          const guestTasks = JSON.parse(localStorage.getItem('guestTasks') || '[]');
          const taskIndex = guestTasks.findIndex((t: Task) => t.id === state.activeExecution?.task_id);
          
          if (taskIndex !== -1) {
            const currentTotal = guestTasks[taskIndex].actual_duration || 0;
            guestTasks[taskIndex] = {
              ...guestTasks[taskIndex],
              actual_duration: currentTotal + Math.floor(sessionDuration / 60), // 分単位で加算
              updated_at: new Date().toISOString()
            };
            localStorage.setItem('guestTasks', JSON.stringify(guestTasks));
          }
        }

        set({
          activeExecution: null,
          elapsedTime: 0,
          accumulatedTime: 0,
          isRunning: false
        });
      } catch (error) {
        console.error('実行時間保存エラー:', error);
        throw error;
      }
    },

    pauseExecution: async () => {
      const state = get();
      if (!state.activeExecution || !state.isRunning) return;

      try {
        // 現在のセッション時間を累積時間に追加
        const now = new Date();
        const currentSessionTime = Math.floor((now.getTime() - state.activeExecution.start_time.getTime()) / 1000);
        const newAccumulatedTime = state.accumulatedTime + currentSessionTime;
        
        stopTimer();

        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // active_executionsを更新（特定タスクのみ）
          await supabase
            .from('active_executions')
            .update({
              is_paused: true,
              accumulated_time: newAccumulatedTime
            })
            .eq('user_id', user.id)
            .eq('task_id', state.activeExecution.task_id);
        }

        set({ 
          isRunning: false,
          accumulatedTime: newAccumulatedTime,
          elapsedTime: newAccumulatedTime
        });
      } catch (error) {
        console.error('一時停止エラー:', error);
      }
    },

    resumeExecution: async () => {
      const state = get();
      if (!state.activeExecution || state.isRunning) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // 他のタスクが実行中でないかチェック（休憩中の競合検出）
          const { data: existingExec } = await supabase
            .from('active_executions')
            .select('*')
            .eq('user_id', user.id)
            .neq('task_id', state.activeExecution.task_id) // 自分以外のタスク
            .single();

          if (existingExec) {
            // 競合発生時の処理
            console.warn('他のタスクが実行中のため再開できません');
            return {
              success: false,
              error: 'DEVICE_CONFLICT',
              message: '他のデバイスで別のタスクが実行中です',
              conflictInfo: {
                taskId: existingExec.task_id,
                deviceType: existingExec.device_type,
                isPaused: existingExec.is_paused,
                startTime: existingExec.start_time
              }
            };
          }
        }

        // 新しい開始時間を設定
        const now = new Date();
        
        if (user) {
          // active_executionsを更新（特定タスクのみ）
          await supabase
            .from('active_executions')
            .update({
              start_time: now.toISOString(),
              is_paused: false
            })
            .eq('user_id', user.id)
            .eq('task_id', state.activeExecution?.task_id);
        }

        // ローカル状態を更新
        set({ 
          isRunning: true,
          activeExecution: {
            ...state.activeExecution!,
            start_time: now
          }
        });
        
        startTimer();
        return { success: true };
        
      } catch (error) {
        console.error('再開エラー:', error);
        return { success: false, error: 'RESUME_ERROR', message: '再開に失敗しました。' };
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

    resetExecution: async (resetType: 'session' | 'today' | 'total' = 'session') => {
      const { activeExecution } = get();
      
      stopTimer();
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && activeExecution) {
          const today = getTodayString();
          
          // データベースリセット処理
          if (resetType === 'today' || resetType === 'total') {
            const updates: any = {};
            
            if (resetType === 'today') {
              // 現在のタスク情報を取得
              const { data: currentTask } = await supabase
                .from('tasks')
                .select('all_time_total, today_total')
                .eq('id', activeExecution.task_id)
                .eq('user_id', user.id)
                .single();
              
              const currentAllTimeTotal = currentTask?.all_time_total || 0;
              const currentTodayTotal = currentTask?.today_total || 0;
              
              // 今日累計リセット: 総累計から今日分を引く
              updates.all_time_total = Math.max(0, (currentAllTimeTotal as number) - (currentTodayTotal as number));
              updates.today_total = 0;
              updates.actual_duration = updates.all_time_total > 0 ? Math.floor(updates.all_time_total / 60) : null;
              
              // 今日の実行回数も調整（今日削除されるログの数を引く）
              const { data: todayLogs } = await supabase
                .from('execution_logs')
                .select('id')
                .eq('task_id', activeExecution.task_id)
                .eq('user_id', user.id)
                .gte('start_time', `${today}T00:00:00.000Z`)
                .lt('start_time', `${today}T23:59:59.999Z`);
              
              let todayLogsCount = 0;
              if (todayLogs && todayLogs.length > 0) {
                todayLogsCount = todayLogs.length;
                const { data: currentTaskCount } = await supabase
                  .from('tasks')
                  .select('execution_count')
                  .eq('id', activeExecution.task_id)
                  .eq('user_id', user.id)
                  .single();
                  
                const currentExecutionCount = (currentTaskCount?.execution_count as number) || 0;
                updates.execution_count = Math.max(0, currentExecutionCount - todayLogsCount);
              }
              
              console.log(`今日累計リセット実行: ${today}`, {
                元の総累計: currentAllTimeTotal,
                今日累計: currentTodayTotal,
                新しい総累計: updates.all_time_total,
                今日の実行回数: todayLogsCount,
                新しい実行回数: updates.execution_count
              });
              
              // 今日のexecution_logsを削除
              const { data: deletedLogs, error: deleteError } = await supabase
                .from('execution_logs')
                .delete()
                .eq('task_id', activeExecution.task_id)
                .eq('user_id', user.id)
                .gte('start_time', `${today}T00:00:00.000Z`)
                .lt('start_time', `${today}T23:59:59.999Z`)
                .select();
              
              if (deleteError) {
                console.error('今日のログ削除エラー:', deleteError);
              } else {
                console.log('削除された今日のログ:', deletedLogs);
              }
              
            } else if (resetType === 'total') {
              // 総累計リセット
              updates.all_time_total = 0;
              updates.today_total = 0;
              updates.actual_duration = null; // NULLに設定（制約対応）
              updates.execution_count = 0;
              
              console.log('総累計リセット実行');
              
              // 全てのexecution_logsを削除
              const { data: deletedLogs, error: deleteError } = await supabase
                .from('execution_logs')
                .delete()
                .eq('task_id', activeExecution.task_id)
                .eq('user_id', user.id)
                .select();
              
              if (deleteError) {
                console.error('全ログ削除エラー:', deleteError);
              } else {
                console.log('削除された全ログ:', deletedLogs);
              }
            }
            
            console.log('tasksテーブル更新:', updates);
            
            // tasksテーブルを更新
            const { data: updatedTask, error: updateError } = await supabase
              .from('tasks')
              .update(updates)
              .eq('id', activeExecution.task_id)
              .eq('user_id', user.id)
              .select();
            
            if (updateError) {
              console.error('tasksテーブル更新エラー:', updateError);
              throw updateError;
            } else {
              console.log('更新されたタスク:', updatedTask);
            }
          }
          
          // active_executionsからも削除（特定タスクのみ）
          await supabase
            .from('active_executions')
            .delete()
            .eq('user_id', user.id)
            .eq('task_id', activeExecution.task_id);
        }
        
        // ローカル状態リセット
        set({
          activeExecution: null,
          elapsedTime: 0,
          accumulatedTime: 0,
          isRunning: false
        });
        
        console.log(`実行状態をリセットしました (${resetType})`);
        
        // 直接的なタスクストア更新（カスタムイベント廃止）
        const { useTaskStore } = await import('@/stores/taskStore');
        await useTaskStore.getState().fetchTasks();
        
      } catch (error) {
        console.error('リセットエラー:', error);
        throw error; // エラーを上位に伝播
      }
    },

    syncWithDatabase: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        // 最新の実行状態を取得
        const { data: activeExec } = await supabase
          .from('active_executions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        const currentState = get();

        if (activeExec && !currentState.activeExecution) {
          // データベースに実行中のタスクがあるが、ローカルにない場合
          console.log('データベースから実行状態を復元します');
          set({
            activeExecution: {
              task_id: activeExec.task_id as string,
              start_time: new Date(activeExec.start_time as string),
              elapsed_seconds: 0
            },
            accumulatedTime: activeExec.accumulated_time as number,
            isRunning: !activeExec.is_paused,
            deviceType: activeExec.device_type as 'mobile' | 'desktop'
          });
          
          if (!activeExec.is_paused) {
            startTimer();
          }
        } else if (!activeExec && currentState.activeExecution) {
          // ローカルに実行中のタスクがあるが、データベースにない場合（他デバイスでクリーンアップ済み）
          console.warn('他デバイスで実行状態がクリーンアップされました。ローカル状態を同期します。');
          set({
            activeExecution: null,
            elapsedTime: 0,
            accumulatedTime: 0,
            isRunning: false
          });
          stopTimer();
        } else if (activeExec && currentState.activeExecution && 
                   activeExec.task_id !== currentState.activeExecution.task_id) {
          // 異なるタスクが実行中の場合（他デバイスで別タスク開始）
          console.warn('他デバイスで別のタスクが開始されました。ローカル状態を同期します。');
          set({
            activeExecution: {
              task_id: activeExec.task_id as string,
              start_time: new Date(activeExec.start_time as string),
              elapsed_seconds: 0
            },
            accumulatedTime: activeExec.accumulated_time as number,
            isRunning: !activeExec.is_paused,
            deviceType: activeExec.device_type as 'mobile' | 'desktop'
          });
          
          if (!activeExec.is_paused) {
            startTimer();
          } else {
            stopTimer();
          }
        }
      } catch (error) {
        console.error('データベース同期エラー:', error);
      }
    },

    forceCleanupActiveExecutions: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        // 全てのactive_executionsを強制削除
        const { error } = await supabase
          .from('active_executions')
          .delete()
          .eq('user_id', user.id);

        if (error) throw error;

        // ローカル状態もリセット
        set({
          activeExecution: null,
          elapsedTime: 0,
          accumulatedTime: 0,
          isRunning: false
        });

        console.log('active_executionsを強制クリーンアップしました');
      } catch (error) {
        console.error('強制クリーンアップエラー:', error);
      }
    }
  };
}); 