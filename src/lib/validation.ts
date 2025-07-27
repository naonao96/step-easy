/**
 * 入力検証ライブラリ
 */

// 文字数制限
export const LIMITS = {
  TITLE: { min: 1, max: 100 },
  DESCRIPTION: { min: 0, max: 1000 },
  EMAIL: { min: 5, max: 254 },
  DISPLAY_NAME: { min: 1, max: 50 },
  CHARACTER_NAME: { min: 1, max: 30 },
  MESSAGE: { min: 1, max: 500 },
  CATEGORY: { min: 1, max: 50 }
};

// 正規表現パターン
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  DATETIME: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
};

/**
 * 基本的な文字列検証
 */
export function validateString(
  value: any,
  fieldName: string,
  options: { required?: boolean; minLength?: number; maxLength?: number; pattern?: RegExp } = {}
): { isValid: boolean; error?: string } {
  const { required = true, minLength, maxLength, pattern } = options;

  // 必須チェック
  if (required && (!value || typeof value !== 'string')) {
    return { isValid: false, error: `${fieldName}は必須です` };
  }

  // 空文字列チェック
  if (required && value.trim() === '') {
    return { isValid: false, error: `${fieldName}は空にできません` };
  }

  // 最小文字数チェック
  if (minLength && value.length < minLength) {
    return { isValid: false, error: `${fieldName}は${minLength}文字以上である必要があります` };
  }

  // 最大文字数チェック
  if (maxLength && value.length > maxLength) {
    return { isValid: false, error: `${fieldName}は${maxLength}文字以下である必要があります` };
  }

  // パターンチェック
  if (pattern && !pattern.test(value)) {
    return { isValid: false, error: `${fieldName}の形式が正しくありません` };
  }

  return { isValid: true };
}

/**
 * 数値検証
 */
export function validateNumber(
  value: any,
  fieldName: string,
  options: { required?: boolean; min?: number; max?: number; integer?: boolean } = {}
): { isValid: boolean; error?: string } {
  const { required = true, min, max, integer = false } = options;

  // 必須チェック
  if (required && (value === null || value === undefined || value === '')) {
    return { isValid: false, error: `${fieldName}は必須です` };
  }

  // 数値チェック
  const numValue = Number(value);
  if (isNaN(numValue)) {
    return { isValid: false, error: `${fieldName}は数値である必要があります` };
  }

  // 整数チェック
  if (integer && !Number.isInteger(numValue)) {
    return { isValid: false, error: `${fieldName}は整数である必要があります` };
  }

  // 最小値チェック
  if (min !== undefined && numValue < min) {
    return { isValid: false, error: `${fieldName}は${min}以上である必要があります` };
  }

  // 最大値チェック
  if (max !== undefined && numValue > max) {
    return { isValid: false, error: `${fieldName}は${max}以下である必要があります` };
  }

  return { isValid: true };
}

/**
 * UUID検証
 */
export function validateUUID(value: any, fieldName: string): { isValid: boolean; error?: string } {
  return validateString(value, fieldName, {
    required: true,
    pattern: PATTERNS.UUID
  });
}

/**
 * 日付検証
 */
export function validateDate(value: any, fieldName: string): { isValid: boolean; error?: string } {
  const result = validateString(value, fieldName, {
    required: true,
    pattern: PATTERNS.DATE
  });

  if (!result.isValid) return result;

  // 有効な日付かチェック
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return { isValid: false, error: `${fieldName}は有効な日付である必要があります` };
  }

  return { isValid: true };
}

/**
 * タスクデータ検証
 */
export function validateTaskData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // タイトル検証
  const titleResult = validateString(data.title, 'タイトル', {
    required: true,
    minLength: LIMITS.TITLE.min,
    maxLength: LIMITS.TITLE.max
  });
  if (!titleResult.isValid) errors.push(titleResult.error!);

  // 説明検証
  if (data.description) {
    const descResult = validateString(data.description, '説明', {
      required: false,
      maxLength: LIMITS.DESCRIPTION.max
    });
    if (!descResult.isValid) errors.push(descResult.error!);
  }

  // 優先度検証
  if (data.priority && !['low', 'medium', 'high'].includes(data.priority)) {
    errors.push('優先度は low, medium, high のいずれかである必要があります');
  }

  // ステータス検証
  if (data.status && !['todo', 'in_progress', 'done'].includes(data.status)) {
    errors.push('ステータスは todo, in_progress, done のいずれかである必要があります');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * 習慣データ検証
 */
export function validateHabitData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // タイトル検証
  const titleResult = validateString(data.title, 'タイトル', {
    required: true,
    minLength: LIMITS.TITLE.min,
    maxLength: LIMITS.TITLE.max
  });
  if (!titleResult.isValid) errors.push(titleResult.error!);

  // 説明検証
  if (data.description) {
    const descResult = validateString(data.description, '説明', {
      required: false,
      maxLength: LIMITS.DESCRIPTION.max
    });
    if (!descResult.isValid) errors.push(descResult.error!);
  }

  // 優先度検証
  if (data.priority && !['low', 'medium', 'high'].includes(data.priority)) {
    errors.push('優先度は low, medium, high のいずれかである必要があります');
  }

  // 頻度検証
  if (data.frequency && !['daily', 'weekly', 'monthly'].includes(data.frequency)) {
    errors.push('頻度は daily, weekly, monthly のいずれかである必要があります');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * 通知データ検証
 */
export function validateNotificationData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // タイトル検証
  const titleResult = validateString(data.title, 'タイトル', {
    required: true,
    minLength: 1,
    maxLength: LIMITS.TITLE.max
  });
  if (!titleResult.isValid) errors.push(titleResult.error!);

  // メッセージ検証
  const messageResult = validateString(data.message, 'メッセージ', {
    required: true,
    minLength: 1,
    maxLength: LIMITS.MESSAGE.max
  });
  if (!messageResult.isValid) errors.push(messageResult.error!);

  // タイプ検証
  const validTypes = [
    'task_completed', 'task_due_soon', 'task_overdue', 'task_created',
    'habit_streak', 'habit_completed', 'habit_missed', 'habit_goal_reached',
    'subscription_payment_success', 'subscription_payment_failed',
    'trial_ending', 'subscription_canceled', 'subscription_renewed',
    'system_info', 'system_warning', 'system_error',
    'ai_message_generated', 'ai_analysis_complete',
    'trial_started', 'migration_complete'
  ];

  if (data.type && !validTypes.includes(data.type)) {
    errors.push('無効な通知タイプです');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * 実行ログデータ検証
 */
export function validateExecutionData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 実行タイプ検証
  if (data.execution_type && !['task', 'habit'].includes(data.execution_type)) {
    errors.push('実行タイプは task または habit である必要があります');
  }

  // デバイスタイプ検証
  if (data.device_type && !['mobile', 'desktop'].includes(data.device_type)) {
    errors.push('デバイスタイプは mobile または desktop である必要があります');
  }

  // 開始時間検証
  if (data.start_time) {
    const startTimeResult = validateString(data.start_time, '開始時間', {
      required: true,
      pattern: PATTERNS.DATETIME
    });
    if (!startTimeResult.isValid) errors.push(startTimeResult.error!);
  }

  // 終了時間検証
  if (data.end_time) {
    const endTimeResult = validateString(data.end_time, '終了時間', {
      required: false,
      pattern: PATTERNS.DATETIME
    });
    if (!endTimeResult.isValid) errors.push(endTimeResult.error!);
  }

  // 実行時間検証
  if (data.duration !== undefined) {
    const durationResult = validateNumber(data.duration, '実行時間', {
      required: false,
      min: 0,
      integer: true
    });
    if (!durationResult.isValid) errors.push(durationResult.error!);
  }

  return { isValid: errors.length === 0, errors };
} 