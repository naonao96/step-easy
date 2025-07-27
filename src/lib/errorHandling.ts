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

/**
 * セキュアなエラーレスポンスを生成する
 */
export function createSecureErrorResponse(
  error: any,
  context: string,
  options: { 
    includeDetails?: boolean; 
    logLevel?: 'error' | 'warn' | 'info';
    userMessage?: string;
  } = {}
): { message: string; code?: string; details?: any } {
  const { includeDetails = false, logLevel = 'error', userMessage } = options;

  // エラーの種類を判定
  let errorType = 'UNKNOWN_ERROR';
  let message = userMessage || '予期しないエラーが発生しました';

  if (error instanceof Error) {
    if (error.message.includes('認証')) {
      errorType = 'AUTHENTICATION_ERROR';
      message = '認証に失敗しました';
    } else if (error.message.includes('権限')) {
      errorType = 'AUTHORIZATION_ERROR';
      message = '権限がありません';
    } else if (error.message.includes('検証')) {
      errorType = 'VALIDATION_ERROR';
      message = '入力内容に問題があります';
    } else if (error.message.includes('データベース')) {
      errorType = 'DATABASE_ERROR';
      message = 'データの処理に失敗しました';
    } else if (error.message.includes('ネットワーク')) {
      errorType = 'NETWORK_ERROR';
      message = '通信エラーが発生しました';
    }
  }

  // ログ出力（本番環境では詳細情報を制限）
  const logData = {
    type: errorType,
    context,
    timestamp: new Date().toISOString(),
    message: error.message || 'Unknown error',
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  };

  switch (logLevel) {
    case 'error':
      console.error(`[${context}] ${errorType}:`, logData);
      break;
    case 'warn':
      console.warn(`[${context}] ${errorType}:`, logData);
      break;
    case 'info':
      console.info(`[${context}] ${errorType}:`, logData);
      break;
  }

  // レスポンスを構築
  const response: any = { message };

  if (includeDetails && process.env.NODE_ENV === 'development') {
    response.code = errorType;
    response.details = {
      context,
      timestamp: logData.timestamp
    };
  }

  return response;
}

/**
 * API Routes用のエラーハンドラー
 */
export function handleApiError(
  error: any,
  context: string,
  options: { 
    statusCode?: number;
    includeDetails?: boolean;
    userMessage?: string;
  } = {}
): Response {
  const { statusCode = 500, includeDetails = false, userMessage } = options;

  const errorResponse = createSecureErrorResponse(error, context, {
    includeDetails,
    userMessage
  });

  return new Response(JSON.stringify(errorResponse), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}

/**
 * フロントエンド用のエラーハンドラー
 */
export function handleClientError(
  error: any,
  context: string,
  options: { 
    showNotification?: boolean;
    userMessage?: string;
  } = {}
): { success: false; error: string; type: string } {
  const { showNotification = true, userMessage } = options;

  const errorResponse = createSecureErrorResponse(error, context, {
    includeDetails: false,
    userMessage
  });

  // 通知を表示（オプション）
  if (showNotification) {
    // ここで通知システムを呼び出す
    console.warn(`[${context}] User notification:`, errorResponse.message);
  }

  return {
    success: false,
    error: errorResponse.message,
    type: errorResponse.code || 'UNKNOWN_ERROR'
  };
}

/**
 * データベースエラーの安全な処理（新バージョン）
 */
export function handleSecureDatabaseError(
  error: any,
  context: string,
  operation: string
): { success: false; error: string } {
  // データベースエラーの詳細を隠す
  const sanitizedError = createSecureErrorResponse(error, `${context}:${operation}`, {
    includeDetails: false,
    userMessage: 'データの処理に失敗しました'
  });

  return {
    success: false,
    error: sanitizedError.message
  };
}

/**
 * 認証エラーの安全な処理
 */
export function handleSecureAuthError(
  error: any,
  context: string
): { success: false; error: string; requiresReauth?: boolean } {
  const sanitizedError = createSecureErrorResponse(error, context, {
    includeDetails: false,
    userMessage: '認証に失敗しました'
  });

  return {
    success: false,
    error: sanitizedError.message,
    requiresReauth: true
  };
}

/**
 * 入力検証エラーの処理（新バージョン）
 */
export function handleSecureValidationError(
  errors: string[],
  context: string
): { success: false; error: string; details?: string[] } {
  const message = errors.length === 1 
    ? errors[0] 
    : '入力内容に複数の問題があります';

  console.warn(`[${context}] Validation failed:`, errors);

  return {
    success: false,
    error: message,
    details: process.env.NODE_ENV === 'development' ? errors : undefined
  };
} 