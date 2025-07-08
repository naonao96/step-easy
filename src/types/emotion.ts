export type EmotionType = 'joy' | 'sadness' | 'anger' | 'surprise' | 'fear' | 'calm';
export type TimePeriod = 'morning' | 'afternoon' | 'evening';

export interface EmotionRecord {
  id: string;
  user_id: string;
  emotion_type: EmotionType;
  intensity: number;
  note?: string;
  time_period: TimePeriod;
  created_at: string;
  updated_at: string;
}

export interface EmotionRecordStatus {
  morning: EmotionRecord | null;
  afternoon: EmotionRecord | null;
  evening: EmotionRecord | null;
}

export interface TodayEmotionsData {
  todayEmotions: EmotionRecord[];
  recordStatus: EmotionRecordStatus;
  currentTimePeriod: TimePeriod;
  isComplete: boolean;
}

export interface EmotionIcon {
  type: EmotionType;
  icon: string;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
}

export const EMOTION_ICONS: EmotionIcon[] = [
  {
    type: 'joy',
    icon: '✓',
    label: '達成',
    shortLabel: '達成',
    description: 'タスク完了、習慣継続、達成感',
    color: 'green'
  },
  {
    type: 'sadness',
    icon: '×',
    label: '挫折',
    shortLabel: '挫折',
    description: 'タスク失敗、習慣中断、落ち込み',
    color: 'red'
  },
  {
    type: 'anger',
    icon: '!',
    label: 'イライラ',
    shortLabel: 'イライラ',
    description: 'タスク困難、時間不足、イライラ',
    color: 'orange'
  },
  {
    type: 'surprise',
    icon: '★',
    label: '驚き',
    shortLabel: '驚き',
    description: '予想外の結果、新しい発見、感動',
    color: 'purple'
  },
  {
    type: 'fear',
    icon: '?',
    label: '不安',
    shortLabel: '不安',
    description: '締切迫る、難しいタスク、不安',
    color: 'yellow'
  },
  {
    type: 'calm',
    icon: '○',
    label: '平穏',
    shortLabel: '平穏',
    description: '日常的なタスク、リラックス、安定',
    color: 'blue'
  }
];

export const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  morning: '朝',
  afternoon: '昼',
  evening: '晩'
};

export const TIME_PERIOD_RANGES: Record<TimePeriod, string> = {
  morning: '6:00-12:00',
  afternoon: '12:00-18:00',
  evening: '18:00-24:00'
}; 