/**
 * StepEasy定数定義
 * プロジェクト全体で使用される定数を統合
 */

// =====================================================
// タスク関連定数
// =====================================================

export const TASK_CONSTANTS = {
  // デフォルト値
  DEFAULT_PRIORITY: 'medium' as const,
  DEFAULT_CATEGORY: 'other',
  DEFAULT_STATUS: 'todo' as const,
  
  // 制限値
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_ESTIMATED_DURATION: 1440, // 24時間（分）
  
  // 保存遅延
  SAVE_DELAY_MS: 300,
  
  // ゲスト制限
  GUEST_TASK_LIMIT: 3,
  
  // 優先度
  PRIORITIES: ['low', 'medium', 'high'] as const,
  
  // カテゴリ
  CATEGORIES: [
    'work',
    'personal',
    'health',
    'study',
    'home',
    'other'
  ] as const,
  
  // ステータス
  STATUSES: ['todo', 'doing', 'done'] as const
} as const;

// =====================================================
// 習慣関連定数
// =====================================================

export const HABIT_CONSTANTS = {
  // デフォルト値
  DEFAULT_FREQUENCY: 'daily' as const,
  DEFAULT_STATUS: 'active' as const,
  
  // 制限値
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_ESTIMATED_DURATION: 1440, // 24時間（分）
  
  // 頻度
  FREQUENCIES: ['daily', 'weekly', 'monthly'] as const,
  
  // ステータス
  STATUSES: ['active', 'paused', 'stopped'] as const,

// プラン別制限
  PLAN_LIMITS: {
    guest: { maxHabits: 0, maxStreakDays: 0 },
    free: { maxHabits: 3, maxStreakDays: 14 },
    premium: { maxHabits: Infinity, maxStreakDays: Infinity }
  } as const
} as const;

// =====================================================
// モーダル関連定数
// =====================================================

export const MODAL_CONSTANTS = {
  // アニメーション時間
  ANIMATION_DURATION: 300,
  
  // オーバーレイのz-index
  OVERLAY_Z_INDEX: 1000,
  
  // モーダルのz-index
  MODAL_Z_INDEX: 1001,
  
  // 確認ダイアログのz-index
  CONFIRM_DIALOG_Z_INDEX: 1002
} as const;

// =====================================================
// タイマー関連定数
// =====================================================

export const TIMER_CONSTANTS = {
  // 更新間隔
  UPDATE_INTERVAL: 1000, // 1秒
  
  // セッション時間の制限
  MAX_SESSION_TIME: 24 * 60 * 60, // 24時間（秒）
  
  // 自動保存間隔
  AUTO_SAVE_INTERVAL: 30 * 1000, // 30秒
  
  // デバイス競合チェック間隔
  CONFLICT_CHECK_INTERVAL: 5 * 1000 // 5秒
} as const;

// =====================================================
// 感情記録関連定数
// =====================================================

export const EMOTION_CONSTANTS = {
  // 時間帯
  TIME_PERIODS: ['morning', 'afternoon', 'evening'] as const,
  
  // 感情タイプ
  EMOTION_TYPES: [
    'happy',
    'excited',
    'calm',
    'neutral',
    'sad',
    'angry',
    'anxious',
    'tired'
  ] as const,
  
  // 時間帯のラベル
  TIME_PERIOD_LABELS: {
    morning: '朝',
    afternoon: '昼',
    evening: '夜'
  } as const,
  
  // 感情のラベル
  EMOTION_LABELS: {
    happy: '😊 嬉しい',
    excited: '🎉 興奮',
    calm: '😌 落ち着いている',
    neutral: '😐 普通',
    sad: '😢 悲しい',
    angry: '😠 怒っている',
    anxious: '😰 不安',
    tired: '😴 疲れている'
  } as const
} as const;

// =====================================================
// メッセージ関連定数
// =====================================================

export const MESSAGE_CONSTANTS = {
  // 表示時間
  DISPLAY_DURATION: 5000, // 5秒
  
  // タイプライター速度
  TYPEWRITER_SPEED: 30, // ミリ秒
  
  // メッセージの最大長
  MAX_MESSAGE_LENGTH: 500,
  
  // ゲストメッセージ
  GUEST_MESSAGES: [
    '今日も頑張りましょう！',
    '小さな一歩が大きな変化を生みます',
    'あなたのペースで進んでいきましょう',
    '今日の目標を設定してみませんか？'
  ] as const
} as const;

// =====================================================
// カレンダー関連定数
// =====================================================

export const CALENDAR_CONSTANTS = {
  // 表示モード
  DISPLAY_MODES: ['month', 'week'] as const,
  
  // カレンダーモード
  CALENDAR_MODES: ['habits', 'tasks'] as const,
  
  // 色設定
  COLORS: {
    habits: '#D2691E', // チョコレート色
    tasks: '#8B4513',  // 濃い茶色
    completed: '#228B22', // 緑色
    overdue: '#DC143C' // 赤色
  } as const,
  
  // 高さ設定
  HEIGHTS: {
    base: 28, // 基本28rem
    habits: 4, // 習慣エリア4rem
    stats: 6   // 統計エリア6rem
  } as const
} as const;

// =====================================================
// ローカルストレージキー
// =====================================================

export const STORAGE_KEYS = {
  // ゲストデータ
  GUEST_TASKS: 'guestTasks',
  GUEST_HABITS: 'guestHabits',
  
  // 設定
  SORT_OPTION: 'sortOption',
  THEME: 'theme',
  LANGUAGE: 'language',
  
  // 一時データ
  TEMP_DATA: 'tempData',
  
  // キャッシュ
  CACHE_PREFIX: 'stepEasy_cache_'
} as const;

// =====================================================
// API関連定数
// =====================================================

export const API_CONSTANTS = {
  // タイムアウト
  TIMEOUT: 30000, // 30秒
  
  // リトライ回数
  MAX_RETRIES: 3,
  
  // リトライ間隔
  RETRY_DELAY: 1000, // 1秒
  
  // レート制限
  RATE_LIMIT: {
    requests: 100,
    window: 60000 // 1分
  }
} as const;

// =====================================================
// 日付関連定数
// =====================================================

export const DATE_CONSTANTS = {
  // タイムゾーン
  TIMEZONE: 'Asia/Tokyo',
  
  // 日付フォーマット
  FORMATS: {
    DISPLAY: 'ja-JP',
    DATABASE: 'en-CA',
    ISO: 'en-CA'
  } as const,
  
  // 曜日
  WEEKDAYS: ['日', '月', '火', '水', '木', '金', '土'] as const,
  
  // 月
  MONTHS: [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ] as const
} as const;

// =====================================================
// エラー関連定数
// =====================================================

export const ERROR_CONSTANTS = {
  // エラーメッセージ
  MESSAGES: {
    HABIT_LIMIT_EXCEEDED: '習慣の作成上限に達しました',
    TASK_LIMIT_EXCEEDED: 'タスクの作成上限に達しました',
    GUEST_RESTRICTION: 'ゲストユーザーはこの機能を利用できません',
    AUTH_REQUIRED: 'ログインが必要です',
    DATABASE_ERROR: 'データベースエラーが発生しました',
    NETWORK_ERROR: 'ネットワークエラーが発生しました',
    VALIDATION_ERROR: '入力内容に問題があります',
    PERMISSION_ERROR: '権限がありません',
    UNKNOWN_ERROR: '予期しないエラーが発生しました'
  } as const,
  
  // エラーコード
  CODES: {
    DUPLICATE: '23505',
    FOREIGN_KEY: '23503',
    TABLE_NOT_FOUND: '42P01',
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT: 'TIMEOUT'
  } as const
} as const; 