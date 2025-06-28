/**
 * 環境設定ユーティリティ
 * 開発・本番環境の設定を適切に読み込むためのヘルパー関数
 */

export interface EnvironmentConfig {
  // Supabase設定
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceKey?: string;
  
  // AI設定
  geminiApiKey?: string;
  
  // アプリケーション設定
  appName: string;
  appVersion: string;
  appUrl: string;
  appEnv: 'development' | 'production';
  
  // 環境設定
  nodeEnv: 'development' | 'production';
  debugMode: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  
  // オプション設定
  analyticsId?: string;
  errorReportingUrl?: string;
}

/**
 * 環境変数から設定を読み込み
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  // 必須環境変数の検証
  const requiredVars = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
  
  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  const config: EnvironmentConfig = {
    // Supabase設定
    supabaseUrl: requiredVars.supabaseUrl!,
    supabaseAnonKey: requiredVars.supabaseAnonKey!,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    
    // AI設定
    geminiApiKey: process.env.GEMINI_API_KEY,
    
    // アプリケーション設定
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'StepEasy',
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    appEnv: (process.env.NEXT_PUBLIC_APP_ENV as 'development' | 'production') || 'development',
    
    // 環境設定
    nodeEnv: process.env.NODE_ENV as 'development' | 'production' || 'development',
    debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
    logLevel: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
    
    // オプション設定
    analyticsId: process.env.NEXT_PUBLIC_ANALYTICS_ID,
    errorReportingUrl: process.env.NEXT_PUBLIC_ERROR_REPORTING_URL,
  };
  
  return config;
}

/**
 * 環境設定の検証
 */
export function validateEnvironmentConfig(config: EnvironmentConfig): string[] {
  const errors: string[] = [];
  
  // Supabase設定の検証
  if (!config.supabaseUrl.startsWith('https://')) {
    errors.push('Supabase URL must start with https://');
  }
  
  if (!config.supabaseUrl.includes('.supabase.co')) {
    errors.push('Invalid Supabase URL format');
  }
  
  // 本番環境での追加検証
  if (config.appEnv === 'production') {
    if (!config.geminiApiKey) {
      errors.push('Gemini API key is required in production');
    }
    
    if (!config.supabaseServiceKey) {
      errors.push('Supabase service role key is required in production');
    }
  }
  
  return errors;
}

/**
 * 環境情報をログ出力（開発環境のみ）
 */
export function logEnvironmentInfo(config: EnvironmentConfig): void {
  if (config.nodeEnv === 'development' && config.debugMode) {
    console.log('🔧 Environment Configuration:', {
      appName: config.appName,
      appVersion: config.appVersion,
      appEnv: config.appEnv,
      nodeEnv: config.nodeEnv,
      supabaseUrl: config.supabaseUrl.substring(0, 30) + '...',
      hasGeminiApiKey: !!config.geminiApiKey,
      hasServiceKey: !!config.supabaseServiceKey,
      debugMode: config.debugMode,
      logLevel: config.logLevel,
    });
  }
}

/**
 * 環境別の設定を取得
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const config = loadEnvironmentConfig();
  const errors = validateEnvironmentConfig(config);
  
  if (errors.length > 0) {
    throw new Error(`Environment configuration errors: ${errors.join(', ')}`);
  }
  
  logEnvironmentInfo(config);
  return config;
}

/**
 * 環境判定ヘルパー
 */
export const isDevelopment = () => process.env.NODE_ENV === 'development';
export const isProduction = () => process.env.NODE_ENV === 'production';
export const isDebugMode = () => process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';

/**
 * 環境別のログ関数
 */
export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (isDevelopment() && isDebugMode()) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
  
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${message}`, ...args);
  },
  
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
};

/**
 * 環境別の設定値を取得
 */
export function getConfigValue<T>(
  developmentValue: T,
  productionValue: T,
  defaultValue?: T
): T {
  if (isProduction()) {
    return productionValue;
  }
  
  if (isDevelopment()) {
    return developmentValue;
  }
  
  return defaultValue !== undefined ? defaultValue : developmentValue;
}

// デフォルトエクスポート
export default getEnvironmentConfig; 