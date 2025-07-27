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

  // 今日の日付を取得（YYYY-MM-DD形式、日本時間）
  const getTodayString = () => {
    const now = new Date();
    const jstOffset = 9 * 60; // 分単位
    const jstTime = new Date(now.getTime() + (jstOffset * 60 * 1000));
    return jstTime.toISOString().split('T')[0];
  };

  // 今日の累積時間を計算
  const calculateTodayTotal = async (taskId: string, newDuration: number): Promise<number> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return newDuration;

      const today = getTodayString();
      
      // 習慣かどうかを判定（修正版）
      let isHabit = false;
      
      // まずhabitsテーブルで検索
      const { data: habitData, error: habitError } = await supabase
        .from('habits')
        .select('id')
        .eq('id', taskId)
        .single();

      if (habitData && !habitError) {
        // habitsテーブルに存在する場合は習慣
        isHabit = true;
      } else {
        // habitsテーブルに存在しない場合はtasksテーブルで検索
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select('id')
          .eq('id', taskId)
          .single();
        
        if (taskData && !taskError) {
          // tasksテーブルに存在する場合はタスク
          isHabit = false;
        } else {
          // どちらにも存在しない場合はエラー
          console.error('実行対象が見つかりません:', { taskId, habitError, taskError });
          return newDuration; // エラーの場合は新しい時間のみを返す
        }
      }

              // 今日の実行履歴を取得
        let todayLogs;
        const response = await fetch(`/api/executions/logs?${isHabit ? `habitId=${taskId}` : `taskId=${taskId}`}&today=${today}`);
        if (response.ok) {
          const { executionLogs } = await response.json();
          todayLogs = executionLogs;
        }

      const todayTotal = (todayLogs || []).reduce((sum: number, log: any) => sum + (log.duration as number), 0);
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

      // API経由でアクティブな実行を取得
      const response = await fetch('/api/executions/active');
      if (!response.ok) {
        console.error('実行状態取得エラー:', response.statusText);
        return;
      }
      
      const { activeExecutions, error } = await response.json();
      if (error) {
        console.error('実行状態取得エラー:', error);
        return;
      }

      // アクティブな実行があるかチェック
      const activeExec = activeExecutions?.find((exec: any) => 
        exec.task_id || exec.habit_id
      );

      if (activeExec && !get().activeExecution) {
        // 他のデバイスで実行中の場合、ローカル状態を同期
        const taskId = activeExec.task_id || activeExec.habit_id;
          set({
            activeExecution: {
              task_id: taskId as string,
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

        // 習慣かどうかを判定（修正版）
        let isHabit = false;
        
        // まずhabitsテーブルで検索
        const { data: habitData, error: habitError } = await supabase
          .from('habits')
          .select('id, user_id')
          .eq('id', taskId)
          .single();
        
        if (habitData && !habitError) {
          // habitsテーブルに存在する場合は習慣
          isHabit = true;
        } else {
          // habitsテーブルに存在しない場合はtasksテーブルで検索
          const { data: taskData, error: taskError } = await supabase
            .from('tasks')
            .select('id, user_id')
            .eq('id', taskId)
            .single();
          
          if (taskData && !taskError) {
            // tasksテーブルに存在する場合はタスク
            isHabit = false;
          } else {
            // どちらにも存在しない場合はエラー
            console.error('実行対象が見つかりません:', { taskId, habitError, taskError });
            throw new Error('実行対象が見つかりません');
          }
        }
        
        const executionType = isHabit ? 'habit' : 'task';

        // 他のタスクが実行中でないかチェック
        const response = await fetch('/api/executions');
        if (!response.ok) {
          throw new Error('実行状態の取得に失敗しました');
        }
        
        const { activeExecutions, error } = await response.json();
        if (error) {
          throw new Error(error);
        }

        const existingExec = activeExecutions?.find((exec: any) => 
          exec.task_id || exec.habit_id
        );

        if (existingExec) {
          // ランタイムエラーではなく、制御された戻り値で処理
          return {
            success: false,
            error: 'DEVICE_CONFLICT',
            message: '他のデバイスでタスクが実行中です',
            conflictInfo: {
              taskId: existingExec.task_id || existingExec.habit_id,
              deviceType: existingExec.device_type,
              isPaused: existingExec.is_paused,
              startTime: existingExec.start_time
            }
          };
        }

        const now = new Date();
        const deviceType = detectDeviceType();

        // active_executionsに記録
        const activeData: any = {
          user_id: user.id,
          start_time: now.toISOString(),
          device_type: deviceType,
          is_paused: false,
          accumulated_time: 0,
          execution_type: executionType
        };

        if (isHabit) {
          activeData.habit_id = taskId;
        } else {
          activeData.task_id = taskId;
        }

        // API経由でアクティブ実行を作成
        const createResponse = await fetch('/api/executions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'active_execution',
            ...activeData
          }),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(errorData.error || 'アクティブ実行の作成に失敗しました');
        }

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
          // 習慣かどうかを判定（修正版）
          let isHabit = false;
          
          // まずhabitsテーブルで検索
          const { data: habitData, error: habitError } = await supabase
            .from('habits')
            .select('id, user_id')
            .eq('id', state.activeExecution.task_id)
            .single();
          
          if (habitData && !habitError) {
            // habitsテーブルに存在する場合は習慣
            isHabit = true;
          } else {
            // habitsテーブルに存在しない場合はtasksテーブルで検索
            const { data: taskData, error: taskError } = await supabase
              .from('tasks')
              .select('id, user_id')
              .eq('id', state.activeExecution.task_id)
              .single();
            
            if (taskData && !taskError) {
              // tasksテーブルに存在する場合はタスク
              isHabit = false;
            } else {
              // どちらにも存在しない場合はエラー
              console.error('実行対象が見つかりません:', { taskId: state.activeExecution.task_id, habitError, taskError });
              throw new Error('実行対象が見つかりません');
            }
          }

          // 適切なフィールドで検索
          let existingExec;
          if (isHabit) {
            const { data } = await supabase
              .from('active_executions')
              .select('*')
              .eq('user_id', user.id)
              .eq('habit_id', state.activeExecution.task_id)
              .single();
            existingExec = data;
          } else {
            const { data } = await supabase
              .from('active_executions')
              .select('*')
              .eq('user_id', user.id)
              .eq('task_id', state.activeExecution.task_id)
              .single();
            existingExec = data;
          }

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
          // 習慣かどうかを判定（修正版）
          let isHabit = false;
          
          // まずhabitsテーブルで検索
          const { data: habitData, error: habitError } = await supabase
            .from('habits')
            .select('id')
            .eq('id', state.activeExecution.task_id)
            .single();
          
          if (habitData && !habitError) {
            // habitsテーブルに存在する場合は習慣
            isHabit = true;
          } else {
            // habitsテーブルに存在しない場合はtasksテーブルで検索
            const { data: taskData, error: taskError } = await supabase
              .from('tasks')
              .select('id')
              .eq('id', state.activeExecution.task_id)
              .single();
            
            if (taskData && !taskError) {
              // tasksテーブルに存在する場合はタスク
              isHabit = false;
            } else {
              // どちらにも存在しない場合はエラー
              console.error('実行対象が見つかりません:', { taskId: state.activeExecution.task_id, habitError, taskError });
              throw new Error('実行対象が見つかりません');
            }
          }
          
          const executionType = isHabit ? 'habit' : 'task';
          const sessionType = isHabit ? 'habit' : 'normal'; // 後方互換性のため

          // 実行履歴に記録
          const logData: any = {
            user_id: user.id,
            start_time: state.activeExecution.start_time.toISOString(),
            end_time: endTime.toISOString(),
            duration: sessionDuration,
            device_type: state.deviceType,
            session_type: sessionType,
            execution_type: executionType,
            is_completed: true
          };

          if (isHabit) {
            logData.habit_id = state.activeExecution.task_id;
            logData.task_id = null; // 習慣の場合は明示的にNULL
          } else {
            logData.task_id = state.activeExecution.task_id;
            logData.habit_id = null; // タスクの場合は明示的にNULL
          }

          // API経由で実行ログを作成
          const logResponse = await fetch('/api/executions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'execution_log',
              ...logData
            }),
          });

          if (!logResponse.ok) {
            const errorData = await logResponse.json();
            throw new Error(errorData.error || '実行ログの作成に失敗しました');
          }

          // 今日の累積時間を計算
          const todayTotal = await calculateTodayTotal(state.activeExecution.task_id, sessionDuration);

          if (isHabit) {
            // 習慣の統計情報を更新
            const statsResponse = await fetch('/api/executions/stats', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                targetId: state.activeExecution.task_id,
                isHabit: true,
                updates: {
                  all_time_total: sessionDuration, // 新規追加分
                  today_total: todayTotal,
                  last_execution_date: getTodayString(),
                  updated_at: new Date().toISOString()
                }
              }),
            });

            if (!statsResponse.ok) {
              const errorData = await statsResponse.json();
              throw new Error(errorData.error || '習慣の統計更新に失敗しました');
            }

            console.log('習慣の実行時間を記録しました:', {
              habit_id: state.activeExecution.task_id,
              duration: sessionDuration,
              today_total: todayTotal
            });
          } else {
            // タスクの統計情報を更新
            const statsResponse = await fetch('/api/executions/stats', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                targetId: state.activeExecution.task_id,
                isHabit: false,
                updates: {
                  all_time_total: sessionDuration, // 新規追加分
                  today_total: todayTotal,
                  actual_duration: Math.floor(sessionDuration / 60),
                  execution_count: 1, // 新規追加分
                  last_execution_date: getTodayString(),
                  updated_at: new Date().toISOString()
                }
              }),
            });

            if (!statsResponse.ok) {
              const errorData = await statsResponse.json();
              throw new Error(errorData.error || 'タスクの統計更新に失敗しました');
            }
          }

          // API経由でactive_executionsから削除（特定タスクまたは習慣のみ）
          // まず該当するactive_executionのIDを取得
          const execResponse = await fetch('/api/executions');
          if (execResponse.ok) {
            const { activeExecutions } = await execResponse.json();
                         const targetExec = activeExecutions?.find((exec: any) => 
               isHabit ? exec.habit_id === state.activeExecution?.task_id : exec.task_id === state.activeExecution?.task_id
             );
            
            if (targetExec) {
              const deleteResponse = await fetch(`/api/executions?id=${targetExec.id}&type=active_execution`, {
                method: 'DELETE',
              });
              
              if (!deleteResponse.ok) {
                console.error('アクティブ実行の削除に失敗しました');
              }
            }
          }

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
          // 習慣かどうかを判定（修正版）
          let isHabit = false;
          
          // まずhabitsテーブルで検索
          const { data: habitData, error: habitError } = await supabase
            .from('habits')
            .select('id')
            .eq('id', state.activeExecution.task_id)
            .single();

          if (habitData && !habitError) {
            // habitsテーブルに存在する場合は習慣
            isHabit = true;
          } else {
            // habitsテーブルに存在しない場合はtasksテーブルで検索
            const { data: taskData, error: taskError } = await supabase
              .from('tasks')
              .select('id')
              .eq('id', state.activeExecution.task_id)
              .single();
            
            if (taskData && !taskError) {
              // tasksテーブルに存在する場合はタスク
              isHabit = false;
            } else {
              // どちらにも存在しない場合はエラー
              console.error('実行対象が見つかりません:', { taskId: state.activeExecution.task_id, habitError, taskError });
              throw new Error('実行対象が見つかりません');
            }
          }

          // active_executionsを更新（特定タスクまたは習慣のみ）
          if (isHabit) {
            await supabase
              .from('active_executions')
              .update({
                is_paused: true,
                accumulated_time: newAccumulatedTime
              })
              .eq('user_id', user.id)
              .eq('habit_id', state.activeExecution.task_id);
          } else {
            await supabase
              .from('active_executions')
              .update({
                is_paused: true,
                accumulated_time: newAccumulatedTime
              })
              .eq('user_id', user.id)
              .eq('task_id', state.activeExecution.task_id);
          }
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
          // 習慣かどうかを判定（修正版）
          let isHabit = false;
          
          // まずhabitsテーブルで検索
          const { data: habitData, error: habitError } = await supabase
            .from('habits')
            .select('id')
            .eq('id', state.activeExecution.task_id)
            .single();
          
          if (habitData && !habitError) {
            // habitsテーブルに存在する場合は習慣
            isHabit = true;
          } else {
            // habitsテーブルに存在しない場合はtasksテーブルで検索
            const { data: taskData, error: taskError } = await supabase
              .from('tasks')
              .select('id')
              .eq('id', state.activeExecution.task_id)
              .single();
            
            if (taskData && !taskError) {
              // tasksテーブルに存在する場合はタスク
              isHabit = false;
            } else {
              // どちらにも存在しない場合はエラー
              console.error('実行対象が見つかりません:', { taskId: state.activeExecution.task_id, habitError, taskError });
              throw new Error('実行対象が見つかりません');
            }
          }

          // 他のタスクが実行中でないかチェック（休憩中の競合検出）
          let existingExec;
          if (isHabit) {
            const { data } = await supabase
              .from('active_executions')
              .select('*')
              .eq('user_id', user.id)
              .neq('habit_id', state.activeExecution.task_id) // 自分以外の習慣
              .single();
            existingExec = data;
          } else {
            const { data } = await supabase
              .from('active_executions')
              .select('*')
              .eq('user_id', user.id)
              .neq('task_id', state.activeExecution.task_id) // 自分以外のタスク
              .single();
            existingExec = data;
          }

          if (existingExec) {
            // 競合発生時の処理
            console.warn('他のタスクが実行中のため再開できません');
            return {
              success: false,
              error: 'DEVICE_CONFLICT',
              message: '他のデバイスで別のタスクが実行中です',
              conflictInfo: {
                taskId: existingExec.task_id || existingExec.habit_id,
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
          // 習慣かどうかを判定（修正版）
          let isHabit = false;
          
          // まずhabitsテーブルで検索
          const { data: habitData, error: habitError } = await supabase
            .from('habits')
            .select('id')
            .eq('id', state.activeExecution?.task_id)
            .single();

          if (habitData && !habitError) {
            // habitsテーブルに存在する場合は習慣
            isHabit = true;
          } else {
            // habitsテーブルに存在しない場合はtasksテーブルで検索
            const { data: taskData, error: taskError } = await supabase
              .from('tasks')
              .select('id')
              .eq('id', state.activeExecution?.task_id)
              .single();
            
            if (taskData && !taskError) {
              // tasksテーブルに存在する場合はタスク
              isHabit = false;
            } else {
              // どちらにも存在しない場合はエラー
              console.error('実行対象が見つかりません:', { taskId: state.activeExecution?.task_id, habitError, taskError });
              throw new Error('実行対象が見つかりません');
            }
          }

          // active_executionsを更新（特定タスクまたは習慣のみ）
          if (isHabit) {
            await supabase
              .from('active_executions')
              .update({
                start_time: now.toISOString(),
                is_paused: false
              })
              .eq('user_id', user.id)
              .eq('habit_id', state.activeExecution?.task_id);
          } else {
            await supabase
              .from('active_executions')
              .update({
                start_time: now.toISOString(),
                is_paused: false
              })
              .eq('user_id', user.id)
              .eq('task_id', state.activeExecution?.task_id);
          }
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
          
          // 習慣かどうかを判定（修正版）
          let isHabit = false;
          
          // まずhabitsテーブルで検索
          const { data: habitData, error: habitError } = await supabase
            .from('habits')
            .select('id')
            .eq('id', activeExecution.task_id)
            .single();
          
          if (habitData && !habitError) {
            // habitsテーブルに存在する場合は習慣
            isHabit = true;
          } else {
            // habitsテーブルに存在しない場合はtasksテーブルで検索
            const { data: taskData, error: taskError } = await supabase
              .from('tasks')
              .select('id')
              .eq('id', activeExecution.task_id)
              .single();
            
            if (taskData && !taskError) {
              // tasksテーブルに存在する場合はタスク
              isHabit = false;
            } else {
              // どちらにも存在しない場合はエラー
              console.error('実行対象が見つかりません:', { taskId: activeExecution.task_id, habitError, taskError });
              throw new Error('実行対象が見つかりません');
            }
          }
          
          // データベースリセット処理
          if (resetType === 'today' || resetType === 'total') {
            const updates: any = {};
            
            if (resetType === 'today') {
              // 今日累計リセット
              if (isHabit) {
                // 習慣の場合
                const { data: currentHabit } = await supabase
                  .from('habits')
                  .select('all_time_total, today_total')
                  .eq('id', activeExecution.task_id)
                  .eq('user_id', user.id)
                  .single();
                
                const currentAllTimeTotal = currentHabit?.all_time_total || 0;
                const currentTodayTotal = currentHabit?.today_total || 0;
                
                updates.all_time_total = Math.max(0, currentAllTimeTotal - currentTodayTotal);
                updates.today_total = 0;
                
                console.log(`習慣の今日累計リセット実行: ${today}`, {
                  元の総累計: currentAllTimeTotal,
                  今日累計: currentTodayTotal,
                  新しい総累計: updates.all_time_total
                });
                
                // 今日のexecution_logsを削除（習慣用）
                const { data: deletedLogs, error: deleteError } = await supabase
                  .from('execution_logs')
                  .delete()
                  .eq('habit_id', activeExecution.task_id)
                  .eq('user_id', user.id)
                  .gte('start_time', `${today}T00:00:00.000Z`)
                  .lt('start_time', `${today}T23:59:59.999Z`)
                  .select();
                
                if (deleteError) {
                  console.error('習慣の今日のログ削除エラー:', deleteError);
                } else {
                  console.log('削除された習慣の今日のログ:', deletedLogs);
                }
                
              } else {
                // タスクの場合（既存ロジック）
                const { data: currentTask } = await supabase
                  .from('tasks')
                  .select('all_time_total, today_total, execution_count')
                  .eq('id', activeExecution.task_id)
                  .eq('user_id', user.id)
                  .single();
                
                const currentAllTimeTotal = currentTask?.all_time_total || 0;
                const currentTodayTotal = currentTask?.today_total || 0;
                
                updates.all_time_total = Math.max(0, currentAllTimeTotal - currentTodayTotal);
                updates.today_total = 0;
                updates.actual_duration = updates.all_time_total > 0 ? Math.floor(updates.all_time_total / 60) : null;
                
                // 今日の実行回数も調整
                const { data: todayLogs } = await supabase
                  .from('execution_logs')
                  .select('id')
                  .eq('task_id', activeExecution.task_id)
                  .eq('user_id', user.id)
                  .gte('start_time', `${today}T00:00:00.000Z`)
                  .lt('start_time', `${today}T23:59:59.999Z`);
                
                let todayLogsCount = todayLogs?.length || 0;
                const currentExecutionCount = currentTask?.execution_count || 0;
                updates.execution_count = Math.max(0, currentExecutionCount - todayLogsCount);
                
                console.log(`タスクの今日累計リセット実行: ${today}`, {
                  元の総累計: currentAllTimeTotal,
                  今日累計: currentTodayTotal,
                  新しい総累計: updates.all_time_total,
                  今日の実行回数: todayLogsCount,
                  新しい実行回数: updates.execution_count
                });
                
                // 今日のexecution_logsを削除（タスク用）
                const { data: deletedLogs, error: deleteError } = await supabase
                  .from('execution_logs')
                  .delete()
                  .eq('task_id', activeExecution.task_id)
                  .eq('user_id', user.id)
                  .gte('start_time', `${today}T00:00:00.000Z`)
                  .lt('start_time', `${today}T23:59:59.999Z`)
                  .select();
                
                if (deleteError) {
                  console.error('タスクの今日のログ削除エラー:', deleteError);
                } else {
                  console.log('削除されたタスクの今日のログ:', deletedLogs);
                }
              }
              
            } else if (resetType === 'total') {
              // 総累計リセット
              if (isHabit) {
                // 習慣の場合
                updates.all_time_total = 0;
                updates.today_total = 0;
                
                console.log('習慣の総累計リセット実行');
                
                // 全てのexecution_logsを削除（習慣用）
                const { data: deletedLogs, error: deleteError } = await supabase
                  .from('execution_logs')
                  .delete()
                  .eq('habit_id', activeExecution.task_id)
                  .eq('user_id', user.id)
                  .select();
                
                if (deleteError) {
                  console.error('習慣の全ログ削除エラー:', deleteError);
                } else {
                  console.log('削除された習慣の全ログ:', deletedLogs);
                }
                
              } else {
                // タスクの場合
                updates.all_time_total = 0;
                updates.today_total = 0;
                updates.actual_duration = null; // NULLに設定（制約対応）
                updates.execution_count = 0;
                
                console.log('タスクの総累計リセット実行');
                
                // 全てのexecution_logsを削除（タスク用）
                const { data: deletedLogs, error: deleteError } = await supabase
                  .from('execution_logs')
                  .delete()
                  .eq('task_id', activeExecution.task_id)
                  .eq('user_id', user.id)
                  .select();
                
                if (deleteError) {
                  console.error('タスクの全ログ削除エラー:', deleteError);
                } else {
                  console.log('削除されたタスクの全ログ:', deletedLogs);
                }
              }
            }
            
            // テーブル更新
            if (isHabit) {
              const { data: updatedHabit, error: updateError } = await supabase
                .from('habits')
                .update(updates)
                .eq('id', activeExecution.task_id)
                .eq('user_id', user.id)
                .select();
              
              if (updateError) {
                console.error('習慣テーブル更新エラー:', updateError);
                throw updateError;
              } else {
                console.log('更新された習慣:', updatedHabit);
              }
            } else {
              const { data: updatedTask, error: updateError } = await supabase
                .from('tasks')
                .update(updates)
                .eq('id', activeExecution.task_id)
                .eq('user_id', user.id)
                .select();
              
              if (updateError) {
                console.error('タスクテーブル更新エラー:', updateError);
                throw updateError;
              } else {
                console.log('更新されたタスク:', updatedTask);
              }
            }
          }
          
          // active_executionsから削除
          if (isHabit) {
            await supabase
              .from('active_executions')
              .delete()
              .eq('user_id', user.id)
              .eq('habit_id', activeExecution.task_id);
          } else {
            await supabase
              .from('active_executions')
              .delete()
              .eq('user_id', user.id)
              .eq('task_id', activeExecution.task_id);
          }
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
          .select(`
            id, user_id, task_id, habit_id, execution_type,
            start_time, device_type, is_paused, accumulated_time,
            created_at, updated_at
          `)
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
                   (activeExec.task_id || activeExec.habit_id) !== currentState.activeExecution.task_id) {
          // 異なるタスクが実行中の場合（他デバイスで別タスク開始）
          console.warn('他デバイスで別のタスクが開始されました。ローカル状態を同期します。');
          const taskId = activeExec.task_id || activeExec.habit_id;
          set({
            activeExecution: {
              task_id: taskId as string,
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