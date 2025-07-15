import { create } from 'zustand';
import { EmotionType, TimePeriod, EmotionRecord } from '@/types/emotion';
import { getEmotionTimePeriod, getJapanTimeNow } from '@/lib/timeUtils';

interface EmotionStore {
  // 状態
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

  // アクション
  setTodayEmotions: (emotions: EmotionRecord[]) => void;
  setRecordStatus: (status: {
    morning: EmotionRecord | null;
    afternoon: EmotionRecord | null;
    evening: EmotionRecord | null;
  }) => void;
  setCurrentTimePeriod: (period: TimePeriod) => void;
  setIsComplete: (complete: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // 感情記録関連
  recordEmotion: (emotionType: EmotionType, timePeriod?: TimePeriod) => Promise<boolean>;
  refreshTodayEmotions: () => Promise<void>;
  
  // 楽観的更新
  setOptimisticRecord: (timePeriod: TimePeriod, emotionType: EmotionType) => void;
  clearOptimisticRecord: (timePeriod: TimePeriod) => void;
}

export const useEmotionStore = create<EmotionStore>((set, get) => ({
  // 初期状態
  todayEmotions: [],
  recordStatus: {
    morning: null,
    afternoon: null,
    evening: null
  },
  currentTimePeriod: 'morning',
  isComplete: false,
  isLoading: true,
  error: null,

  // 状態設定アクション
  setTodayEmotions: (emotions) => set({ todayEmotions: emotions }),
  setRecordStatus: (status) => set({ recordStatus: status }),
  setCurrentTimePeriod: (period) => set({ currentTimePeriod: period }),
  setIsComplete: (complete) => set({ isComplete: complete }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // 楽観的更新
  setOptimisticRecord: (timePeriod, emotionType) => {
    const optimisticRecord = {
      id: `temp-${Date.now()}`,
      user_id: 'temp',
      emotion_type: emotionType,
      time_period: timePeriod,
      intensity: 3,
      note: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    set((state) => {
      const newRecordStatus = {
        ...state.recordStatus,
        [timePeriod]: optimisticRecord
      };
      
      const newIsComplete = Object.values(newRecordStatus).every(record => record !== null);
      
      return {
        recordStatus: newRecordStatus,
        isComplete: newIsComplete
      };
    });
  },

  clearOptimisticRecord: (timePeriod) => {
    set((state) => {
      const newRecordStatus = {
        ...state.recordStatus,
        [timePeriod]: null
      };
      
      const newIsComplete = Object.values(newRecordStatus).every(record => record !== null);
      
      return {
        recordStatus: newRecordStatus,
        isComplete: newIsComplete
      };
    });
  },

  // 感情記録を保存
  recordEmotion: async (emotionType, timePeriod) => {
    try {
      set({ error: null });
      const currentPeriod = timePeriod || getEmotionTimePeriod();

      // 楽観的更新
      get().setOptimisticRecord(currentPeriod, emotionType);

      const response = await fetch('/api/emotions/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emotion_type: emotionType
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

      // サーバーからの実際のデータで更新
      set((state) => {
        const newRecordStatus = {
          ...state.recordStatus,
          [result.data.time_period]: result.data
        };
        
        // 楽観的更新の一時的なデータを削除
        if (newRecordStatus[currentPeriod]?.id?.toString().startsWith('temp-')) {
          delete newRecordStatus[currentPeriod];
        }
        
        const newIsComplete = Object.values(newRecordStatus).every(record => record !== null);
        
        return {
          recordStatus: newRecordStatus,
          isComplete: newIsComplete
        };
      });

      // todayEmotionsも部分更新
      set((state) => {
        const existingIndex = state.todayEmotions.findIndex(e => e.time_period === result.data.time_period);
        if (existingIndex >= 0) {
          const updated = [...state.todayEmotions];
          updated[existingIndex] = result.data;
          return { todayEmotions: updated };
        } else {
          return { todayEmotions: [...state.todayEmotions, result.data] };
        }
      });

      return true;

    } catch (err) {
      console.error('感情記録保存エラー:', err);
      set({ error: err instanceof Error ? err.message : '感情記録の保存に失敗しました' });
      
      // エラー時は楽観的更新を元に戻す
      get().clearOptimisticRecord(currentPeriod);
      
      return false;
    }
  },

  // 今日の感情記録を取得
  refreshTodayEmotions: async () => {
    try {
      set({ isLoading: true, error: null });

      const response = await fetch('/api/emotions/today');
      if (!response.ok) {
        throw new Error('感情記録の取得に失敗しました');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '感情記録の取得に失敗しました');
      }

      const data = result.data;
      set({
        todayEmotions: data.todayEmotions,
        recordStatus: data.recordStatus,
        currentTimePeriod: data.currentTimePeriod,
        isComplete: data.isComplete,
        isLoading: false
      });

    } catch (err) {
      console.error('感情記録取得エラー:', err);
      set({
        error: err instanceof Error ? err.message : '感情記録の取得に失敗しました',
        isLoading: false
      });
    }
  }
})); 