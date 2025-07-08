import { useState, useCallback } from 'react';
import { InteractiveMessage, MessageOption } from '@/types/message';

interface UseInteractiveMessageReturn {
  message: InteractiveMessage | null;
  isLoading: boolean;
  error: string | null;
  generateMessage: (context: string, userType?: string, userName?: string) => Promise<void>;
  handleOptionSelect: (option: MessageOption) => void;
  clearMessage: () => void;
}

export const useInteractiveMessage = (): UseInteractiveMessageReturn => {
  const [message, setMessage] = useState<InteractiveMessage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateMessage = useCallback(async (
    context: string, 
    userType: string = 'free', 
    userName?: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-interactive-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context,
          userType,
          userName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate message');
      }

      if (data.success && data.message) {
        setMessage(data.message);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Failed to generate interactive message:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleOptionSelect = useCallback((option: MessageOption) => {
    // オプション選択時の処理
    console.log('Selected option:', option);
    
    // ここでオプションに応じた処理を実装
    // 例: 統計画面への遷移、新しいタスク追加など
    switch (option.action) {
      case 'feeling_great':
        // ポジティブな反応への処理
        break;
      case 'feeling_normal':
        // 中立的な反応への処理
        break;
      case 'feeling_tired':
        // 疲れている反応への処理
        break;
      case 'add_task':
        // タスク追加への処理
        break;
      case 'view_stats':
        // 統計表示への処理
        break;
      default:
        // デフォルト処理
        break;
    }
  }, []);

  const clearMessage = useCallback(() => {
    setMessage(null);
    setError(null);
  }, []);

  return {
    message,
    isLoading,
    error,
    generateMessage,
    handleOptionSelect,
    clearMessage,
  };
}; 