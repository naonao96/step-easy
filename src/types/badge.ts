// 達成バッジシステムの型定義

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  level: BadgeLevel;
  icon: string;
  colorScheme: BadgeColorScheme;
  requirement: BadgeRequirement;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress?: number; // 0-100
}

export type BadgeCategory = 
  | 'task_completion'    // タスク完了
  | 'streak'            // 継続
  | 'time_management'   // 時間管理
  | 'productivity'      // 生産性
  | 'special'           // 特別
  | 'milestone';        // マイルストーン

export type BadgeLevel = 
  | 'bronze'    // 銅 (初級)
  | 'silver'    // 銀 (中級)
  | 'gold'      // 金 (上級)
  | 'platinum'  // プラチナ (マスター)
  | 'diamond';  // ダイヤモンド (伝説)

export interface BadgeColorScheme {
  primary: string;    // メインカラー
  secondary: string;  // サブカラー
  accent: string;     // アクセントカラー
  text: string;       // テキストカラー
  border: string;     // ボーダーカラー
}

export interface BadgeRequirement {
  type: 'task_count' | 'streak_days' | 'total_time' | 'completion_rate' | 'special';
  value: number;
  description: string;
}

// バッジデザイン仕様
export const BADGE_DESIGN_SPECS = {
  // サイズ設定
  sizes: {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-20 h-20 text-lg'
  },
  
  // レベル別カラースキーム
  levelColors: {
    bronze: {
      primary: '#CD7F32',
      secondary: '#D2691E',
      accent: '#FFD700',
      text: '#8B4513',
      border: '#A0522D'
    },
    silver: {
      primary: '#C0C0C0',
      secondary: '#A9A9A9',
      accent: '#E6E6FA',
      text: '#696969',
      border: '#808080'
    },
    gold: {
      primary: '#FFD700',
      secondary: '#FFA500',
      accent: '#FFF8DC',
      text: '#8B4513',
      border: '#DAA520'
    },
    platinum: {
      primary: '#E5E4E2',
      secondary: '#B8B8B8',
      accent: '#F0F8FF',
      text: '#2F4F4F',
      border: '#708090'
    },
    diamond: {
      primary: '#B9F2FF',
      secondary: '#87CEEB',
      accent: '#F0F8FF',
      text: '#191970',
      border: '#4169E1'
    }
  },
  
  // カテゴリ別アイコン
  categoryIcons: {
    task_completion: '🎯',
    streak: '🔥',
    time_management: '⏰',
    productivity: '📈',
    special: '⭐',
    milestone: '🏆'
  }
};

// デフォルトバッジ定義
export const DEFAULT_BADGES: Badge[] = [
  // タスク完了系
  {
    id: 'first_task',
    name: '最初の一歩',
    description: '初めてタスクを完了しました',
    category: 'task_completion',
    level: 'bronze',
    icon: '🌱',
    colorScheme: BADGE_DESIGN_SPECS.levelColors.bronze,
    requirement: {
      type: 'task_count',
      value: 1,
      description: '1個のタスクを完了'
    },
    isUnlocked: false
  },
  {
    id: 'task_master_10',
    name: 'タスクマスター',
    description: '10個のタスクを完了しました',
    category: 'task_completion',
    level: 'silver',
    icon: '🎯',
    colorScheme: BADGE_DESIGN_SPECS.levelColors.silver,
    requirement: {
      type: 'task_count',
      value: 10,
      description: '10個のタスクを完了'
    },
    isUnlocked: false
  },
  {
    id: 'task_master_50',
    name: 'タスクエキスパート',
    description: '50個のタスクを完了しました',
    category: 'task_completion',
    level: 'gold',
    icon: '🏆',
    colorScheme: BADGE_DESIGN_SPECS.levelColors.gold,
    requirement: {
      type: 'task_count',
      value: 50,
      description: '50個のタスクを完了'
    },
    isUnlocked: false
  },
  
  // 継続系
  {
    id: 'streak_3',
    name: '継続の芽',
    description: '3日間連続でタスクを完了',
    category: 'streak',
    level: 'bronze',
    icon: '🌿',
    colorScheme: BADGE_DESIGN_SPECS.levelColors.bronze,
    requirement: {
      type: 'streak_days',
      value: 3,
      description: '3日間連続'
    },
    isUnlocked: false
  },
  {
    id: 'streak_7',
    name: '習慣の花',
    description: '7日間連続でタスクを完了',
    category: 'streak',
    level: 'silver',
    icon: '🌸',
    colorScheme: BADGE_DESIGN_SPECS.levelColors.silver,
    requirement: {
      type: 'streak_days',
      value: 7,
      description: '7日間連続'
    },
    isUnlocked: false
  },
  {
    id: 'streak_30',
    name: '継続の樹',
    description: '30日間連続でタスクを完了',
    category: 'streak',
    level: 'gold',
    icon: '🌳',
    colorScheme: BADGE_DESIGN_SPECS.levelColors.gold,
    requirement: {
      type: 'streak_days',
      value: 30,
      description: '30日間連続'
    },
    isUnlocked: false
  },
  
  // 時間管理系
  {
    id: 'time_master_1h',
    name: '時間の芽',
    description: '累計1時間のタスクを実行',
    category: 'time_management',
    level: 'bronze',
    icon: '⏱️',
    colorScheme: BADGE_DESIGN_SPECS.levelColors.bronze,
    requirement: {
      type: 'total_time',
      value: 3600, // 1時間（秒）
      description: '累計1時間実行'
    },
    isUnlocked: false
  },
  {
    id: 'time_master_10h',
    name: '時間の花',
    description: '累計10時間のタスクを実行',
    category: 'time_management',
    level: 'silver',
    icon: '⏰',
    colorScheme: BADGE_DESIGN_SPECS.levelColors.silver,
    requirement: {
      type: 'total_time',
      value: 36000, // 10時間（秒）
      description: '累計10時間実行'
    },
    isUnlocked: false
  },
  
  // 生産性系
  {
    id: 'productivity_80',
    name: '高効率',
    description: '1日の完了率80%を達成',
    category: 'productivity',
    level: 'silver',
    icon: '📈',
    colorScheme: BADGE_DESIGN_SPECS.levelColors.silver,
    requirement: {
      type: 'completion_rate',
      value: 80,
      description: '1日の完了率80%'
    },
    isUnlocked: false
  },
  
  // 特別系
  {
    id: 'early_bird',
    name: '早起き',
    description: '朝6時前にタスクを完了',
    category: 'special',
    level: 'bronze',
    icon: '🌅',
    colorScheme: BADGE_DESIGN_SPECS.levelColors.bronze,
    requirement: {
      type: 'special',
      value: 1,
      description: '朝6時前にタスク完了'
    },
    isUnlocked: false
  },
  {
    id: 'night_owl',
    name: '夜型',
    description: '夜10時以降にタスクを完了',
    category: 'special',
    level: 'bronze',
    icon: '🌙',
    colorScheme: BADGE_DESIGN_SPECS.levelColors.bronze,
    requirement: {
      type: 'special',
      value: 1,
      description: '夜10時以降にタスク完了'
    },
    isUnlocked: false
  }
]; 