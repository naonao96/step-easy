import { useState, useEffect, useCallback } from 'react';
import { EmotionType, TimePeriod, EmotionRecord, TodayEmotionsData } from '@/types/emotion';

interface UseEmotionLogReturn {
  todayEmotions: EmotionRecord[];
  recordStatus: {
    morning: EmotionRecord | null;
    afternoon: EmotionRecord | null;
    evening: EmotionRecord | null;
  };
  currentTimePeriod: TimePeriod;
  isComplete: boolean;
  isLoading: boolean;
  error: string | null;
  recordEmotion: (emotionType: EmotionType, timePeriod: TimePeriod) => Promise<boolean>;
  refreshTodayEmotions: () => Promise<void>;
}

export const useEmotionLog = (): UseEmotionLogReturn => {
  const [todayEmotions, setTodayEmotions] = useState<EmotionRecord[]>([]);
  const [recordStatus, setRecordStatus] = useState({
    morning: null as EmotionRecord | null,
    afternoon: null as EmotionRecord | null,
    evening: null as EmotionRecord | null
  });
  const [currentTimePeriod, setCurrentTimePeriod] = useState<TimePeriod>('morning');
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 現在の時間帯を判定
  const getCurrentTimePeriod = (): TimePeriod => {
    const now = new Date();
    const japanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    const hour = japanTime.getHours();
    
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'evening';
  };

  // 今日の感情記録を取得
  const fetchTodayEmotions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/emotions/today');
      if (!response.ok) {
        throw new Error('感情記録の取得に失敗しました');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '感情記録の取得に失敗しました');
      }

      const data: TodayEmotionsData = result.data;
      setTodayEmotions(data.todayEmotions);
      setRecordStatus(data.recordStatus);
      setCurrentTimePeriod(data.currentTimePeriod);
      setIsComplete(data.isComplete);

      // データ取得完了

    } catch (err) {
      console.error('感情記録取得エラー:', err);
      setError(err instanceof Error ? err.message : '感情記録の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 感情記録を保存
  const recordEmotion = useCallback(async (emotionType: EmotionType, timePeriod: TimePeriod): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch('/api/emotions/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emotion_type: emotionType,
          time_period: timePeriod
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '感情記録の保存に失敗しました');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '感情記録の保存に失敗しました');
      }

      console.log('感情記録保存完了:', {
        emotionType,
        timePeriod,
        recordId: result.data.id
      });

      // 記録後に部分更新のみ実行
      setRecordStatus(prev => {
        const newRecordStatus = {
          ...prev,
          [timePeriod]: result.data
        };
        
        // isCompleteの状態も更新
        const newIsComplete = Object.values(newRecordStatus).every(record => record !== null);
        setIsComplete(newIsComplete);
        
        return newRecordStatus;
      });

      // todayEmotionsも部分更新
      setTodayEmotions(prev => {
        const existingIndex = prev.findIndex(e => e.time_period === timePeriod);
        if (existingIndex >= 0) {
          // 既存の記録を更新
          const updated = [...prev];
          updated[existingIndex] = result.data;
          return updated;
        } else {
          // 新規記録を追加
          return [...prev, result.data];
        }
      });

      return true;

    } catch (err) {
      console.error('感情記録保存エラー:', err);
      setError(err instanceof Error ? err.message : '感情記録の保存に失敗しました');
      return false;
    }
  }, []);

  // 初期化と定期的な更新
  useEffect(() => {
    fetchTodayEmotions();
    
    // 5分ごとに現在の時間帯を更新
    const interval = setInterval(() => {
      const newTimePeriod = getCurrentTimePeriod();
      setCurrentTimePeriod(prev => {
        if (newTimePeriod !== prev) {
          // 時間帯が変わったらデータを再取得
          fetchTodayEmotions();
          return newTimePeriod;
        }
        return prev;
      });
    }, 300000); // 5分

    return () => clearInterval(interval);
  }, []); // 依存配列を空にして無限ループを防ぐ

  return {
    todayEmotions,
    recordStatus,
    currentTimePeriod,
    isComplete,
    isLoading,
    error,
    recordEmotion,
    refreshTodayEmotions: fetchTodayEmotions
  };
}; 