import { useState, useEffect, useCallback } from 'react';
import { EmotionType, TimePeriod, EmotionRecord, TodayEmotionsData } from '@/types/emotion';
import { getEmotionTimePeriod, getJapanTimeNow } from '@/lib/timeUtils';

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

  // 現在の時間帯を判定（共通関数を使用）
  const getCurrentTimePeriod = (): TimePeriod => {
    return getEmotionTimePeriod();
  };

  // デバッグ用：現在の時間帯をログ出力（開発環境のみ）
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const debugTimePeriod = getCurrentTimePeriod();
      const { date: japanTime, hour } = getJapanTimeNow();
      console.log('useEmotionLog - 現在の時間帯デバッグ:', {
        utcTime: new Date().toISOString(),
        japanTime: japanTime.toISOString(),
        hour: hour,
        timePeriod: debugTimePeriod
      });
    }
  }, []);

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
  const recordEmotion = useCallback(async (emotionType: EmotionType, timePeriod?: TimePeriod): Promise<boolean> => {
    // 現在の時間帯を取得（サーバー側と同期）
    const currentPeriod = getCurrentTimePeriod();
    
    try {
      setError(null);

      // 即座に楽観的更新（視覚的フィードバックを即座に消すため）
      const optimisticRecord = {
        id: `temp-${Date.now()}`,
        user_id: 'temp',
        emotion_type: emotionType,
        time_period: currentPeriod,
        intensity: 3,
        note: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setRecordStatus(prev => {
        const newRecordStatus = {
          ...prev,
          [currentPeriod]: optimisticRecord
        };
        
        // isCompleteの状態も更新
        const newIsComplete = Object.values(newRecordStatus).every(record => record !== null);
        setIsComplete(newIsComplete);
        
        return newRecordStatus;
      });

      const response = await fetch('/api/emotions/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emotion_type: emotionType
          // time_periodはサーバー側で現在時刻から判定
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
        timePeriod: result.data.time_period,
        recordId: result.data.id
      });

      // サーバーからの実際のデータで更新
      setRecordStatus(prev => {
        console.log('🔍 楽観的更新を実際のデータで置換:', {
          optimisticPeriod: currentPeriod,
          serverPeriod: result.data.time_period,
          optimisticId: prev[currentPeriod]?.id,
          serverId: result.data.id
        });
        
        const newRecordStatus = {
          ...prev,
          [result.data.time_period]: result.data
        };
        
        // 楽観的更新の一時的なデータを削除
        if (newRecordStatus[currentPeriod]?.id?.toString().startsWith('temp-')) {
          delete newRecordStatus[currentPeriod];
        }
        
        // isCompleteの状態も更新
        const newIsComplete = Object.values(newRecordStatus).every(record => record !== null);
        setIsComplete(newIsComplete);
        
        console.log('🔍 useEmotionLog setRecordStatus 更新後:', {
          newRecordStatus,
          newIsComplete,
          eveningRecord: newRecordStatus.evening,
          eveningId: newRecordStatus.evening?.id,
          currentPeriod: result.data.time_period
        });
        
        return newRecordStatus;
      });

      // todayEmotionsも部分更新
      setTodayEmotions(prev => {
        const existingIndex = prev.findIndex(e => e.time_period === result.data.time_period);
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
      
      // エラー時は楽観的更新を元に戻す
      setRecordStatus(prev => {
        console.log('🔍 エラー時: 楽観的更新を元に戻す:', {
          currentPeriod,
          optimisticId: prev[currentPeriod]?.id
        });
        
        const newRecordStatus = {
          ...prev,
          [currentPeriod]: null
        };
        
        // isCompleteの状態も更新
        const newIsComplete = Object.values(newRecordStatus).every(record => record !== null);
        setIsComplete(newIsComplete);
        
        return newRecordStatus;
      });
      
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
  }, [fetchTodayEmotions]); // fetchTodayEmotionsを依存配列に追加

  // recordStatusの変更を監視（開発環境のみ）
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 useEmotionLog recordStatus 変更:', {
        recordStatus,
        currentTimePeriod,
        recordStatusKeys: recordStatus ? Object.keys(recordStatus) : [],
        allRecordIds: recordStatus ? {
          morning: recordStatus.morning?.id,
          afternoon: recordStatus.afternoon?.id,
          evening: recordStatus.evening?.id
        } : {}
      });
    }
  }, [recordStatus, currentTimePeriod]);

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