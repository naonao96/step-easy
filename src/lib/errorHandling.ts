/**
 * StepEasy統一エラーハンドリング
 * プロジェクト全体で使用されるエラー処理を統合
 */

import { getErrorMessage } from './commonUtils';

/**
 * エラータイプの定義
 */
export type ErrorType = 
  | 'HABIT_LIMIT_EXCEEDED'
  | 'TASK_LIMIT_EXCEEDED'
  | 'GUEST_RESTRICTION'
  | 'AUTH_REQUIRED'
  | 'DATABASE_ERROR'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'PERMISSION_ERROR'
  | 'DEVICE_CONFLICT'
  | 'UNKNOWN_ERROR';

/**
 * エラー結果の型定義
 */
export interface ErrorResult {
  success: false;
  error: ErrorType;
  message: string;
  details?: any;
}

/**
 * 成功結果の型定義
 */
export interface SuccessResult<T = any> {
  success: true;
  data: T;
}

/**
 * 統一された結果型
 */
export type Result<T = any> = SuccessResult<T> | ErrorResult;

/**
 * エラーハンドリングの設定
 */
export interface ErrorHandlingConfig {
  showAlert?: boolean;
  logError?: boolean;
  context?: string;
}

/**
 * 統一されたエラーハンドリング関数
 */
export const handleError = (
  error: any,
  config: ErrorHandlingConfig = {}
): ErrorResult => {
  const { showAlert = true, logError = true, context } = config;
  
  // エラータイプの判定
  let errorType: ErrorType = 'UNKNOWN_ERROR';
  let message = '予期しないエラーが発生しました';
  
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('習慣の作成上限')) {
      errorType = 'HABIT_LIMIT_EXCEEDED';
      message = '習慣の作成上限に達しました';
    } else if (errorMessage.includes('タスクの作成上限')) {
      errorType = 'TASK_LIMIT_EXCEEDED';
      message = 'タスクの作成上限に達しました';
    } else if (errorMessage.includes('ゲストユーザー')) {
      errorType = 'GUEST_RESTRICTION';
      message = 'ゲストユーザーはこの機能を利用できません';
    } else if (errorMessage.includes('ログイン')) {
      errorType = 'AUTH_REQUIRED';
      message = 'ログインが必要です';
    } else if (errorMessage.includes('データベース')) {
      errorType = 'DATABASE_ERROR';
      message = 'データベースエラーが発生しました';
    } else if (errorMessage.includes('ネットワーク')) {
      errorType = 'NETWORK_ERROR';
      message = 'ネットワークエラーが発生しました';
    } else if (errorMessage.includes('入力内容')) {
      errorType = 'VALIDATION_ERROR';
      message = '入力内容に問題があります';
    } else if (errorMessage.includes('権限')) {
      errorType = 'PERMISSION_ERROR';
      message = '権限がありません';
    } else if (errorMessage.includes('デバイス')) {
      errorType = 'DEVICE_CONFLICT';
      message = '他のデバイスで実行中のタスクがあります';
    }
  }
  
  // エラーログの出力
  if (logError) {
    console.error(`[${context || 'Error'}]`, {
      type: errorType,
      message: message,
      originalError: error,
      timestamp: new Date().toISOString()
    });
  }
  
  // アラートの表示
  if (showAlert) {
    alert(message);
  }
  
  return {
    success: false,
    error: errorType,
    message: message,
    details: error
  };
};

/**
 * 成功結果を作成する関数
 */
export const createSuccessResult = <T>(data: T): SuccessResult<T> => ({
  success: true,
  data
});

/**
 * 非同期処理のエラーハンドリング
 */
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  config: ErrorHandlingConfig = {}
): Promise<Result<T>> => {
  try {
    const result = await operation();
    return createSuccessResult(result);
  } catch (error) {
    return handleError(error, config);
  }
};

/**
 * タイマー関連のエラーハンドリング
 */
export const handleTimerError = async (
  result: { success: boolean; error?: string; message?: string; conflictInfo?: any },
  action: 'start' | 'resume',
  onCleanup?: () => Promise<void>
): Promise<boolean> => {
  if (result.success) return true;

  const errorMessage = result.message || 'タイマーの操作に失敗しました';
  
  if (errorMessage.includes('デバイス')) {
    const actionText = action === 'start' ? '開始' : '再開';
    const shouldCleanup = confirm(
      `⚠️ ${errorMessage}\n\n他のデバイス（${result.conflictInfo?.deviceType}）でタスクが実行中です。\n\n「OK」を押すと強制的に実行状態をクリーンアップして新しく${actionText}します。\n「キャンセル」を押すと操作を中止します。`
    );
    
    if (shouldCleanup && onCleanup) {
      await onCleanup();
      return true;
    }
    return false;
  }

  alert(`❌ ${errorMessage}`);
  return false;
};

/**
 * バリデーションエラーの処理
 */
export const handleValidationError = (
  validation: { isValid: boolean; error?: string },
  context?: string
): boolean => {
  if (!validation.isValid) {
    const message = validation.error || '入力内容に問題があります';
    alert(`⚠️ ${message}`);
    
    if (context) {
      console.warn(`[${context}] Validation failed:`, validation);
    }
    
    return false;
  }
  
  return true;
};

/**
 * データベースエラーの処理
 */
export const handleDatabaseError = (
  error: any,
  operation: string
): ErrorResult => {
  console.error(`[Database] ${operation} failed:`, error);
  
  let errorType: ErrorType = 'DATABASE_ERROR';
  let message = 'データベースエラーが発生しました';
  
  if (error?.code === '23505') {
    message = '重複するデータが存在します';
  } else if (error?.code === '23503') {
    message = '関連するデータが見つかりません';
  } else if (error?.code === '42P01') {
    message = 'テーブルが見つかりません';
  }
  
  return {
    success: false,
    error: errorType,
    message: message,
    details: error
  };
};

/**
 * ネットワークエラーの処理
 */
export const handleNetworkError = (
  error: any,
  operation: string
): ErrorResult => {
  console.error(`[Network] ${operation} failed:`, error);
  
  let message = 'ネットワークエラーが発生しました';
  
  if (error?.code === 'NETWORK_ERROR') {
    message = 'インターネット接続を確認してください';
  } else if (error?.code === 'TIMEOUT') {
    message = 'リクエストがタイムアウトしました';
  }
  
  return {
    success: false,
    error: 'NETWORK_ERROR',
    message: message,
    details: error
  };
}; 