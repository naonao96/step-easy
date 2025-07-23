import { useExecutionStore } from '@/stores/executionStore';

export interface TimerErrorResult {
  success: false;
  error: string;
  message: string;
  conflictInfo?: {
    taskId: string;
    deviceType: string;
    isPaused: boolean;
    startTime: string;
  };
}

export interface TimerSuccessResult {
  success: true;
}

export type TimerResult = TimerSuccessResult | TimerErrorResult;

// 共通のエラーハンドリング関数
export const handleTimerError = async (
  result: TimerResult,
  action: 'start' | 'resume',
  onCleanup?: () => Promise<void>
): Promise<boolean> => {
  if (result.success) return true;

  switch (result.error) {
    case 'DEVICE_CONFLICT':
      const actionText = action === 'start' ? '開始' : '再開';
      const shouldCleanup = confirm(
        `⚠️ ${result.message}\n\n他のデバイス（${result.conflictInfo?.deviceType}）でタスクが実行中です。\n\n「OK」を押すと強制的に実行状態をクリーンアップして新しく${actionText}します。\n「キャンセル」を押すと操作を中止します。`
      );
      
      if (shouldCleanup) {
        const { forceCleanupActiveExecutions } = useExecutionStore.getState();
        await forceCleanupActiveExecutions();
        if (onCleanup) {
          await onCleanup();
        }
        return true;
      }
      return false;

    case 'DATABASE_ERROR':
      alert(`🔌 ${result.message}`);
      return false;

    case 'AUTH_ERROR':
      alert(`🔐 ${result.message}`);
      return false;

    case 'PERMISSION_ERROR':
      alert(`🚫 ${result.message}`);
      return false;

    default:
      alert(`❌ ${result.message || '予期しないエラーが発生しました。'}`);
      return false;
  }
};

// 共通のエラーメッセージ
export const getTimerErrorMessage = (action: 'start' | 'resume' | 'reset'): string => {
  const actionText = {
    start: '開始',
    resume: '再開',
    reset: 'リセット'
  }[action];
  
  return `タスクの${actionText}に失敗しました。もう一度お試しください。`;
}; 