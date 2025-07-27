/**
 * 環境変数の管理
 * フロントエンドに露出する変数とサーバーサイドのみの変数を分離
 */

// フロントエンドに露出する環境変数（最小限）
export const clientEnv = {
  // Supabase設定（公開用）
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  
  // アプリケーション設定
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'StepEasy',
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  appEnv: (process.env.NEXT_PUBLIC_APP_ENV as 'development' | 'production') || 'development',
  
  // 開発用設定
  debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
  
  // 外部サービス（公開用キーのみ）
  analyticsId: process.env.NEXT_PUBLIC_ANALYTICS_ID,
  errorReportingUrl: process.env.NEXT_PUBLIC_ERROR_REPORTING_URL,
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
};

// サーバーサイドのみの環境変数（機密情報）
export const serverEnv = {
  // Supabase設定（機密）
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  
  // Stripe設定（機密）
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  
  // その他の機密設定
  jwtSecret: process.env.JWT_SECRET,
  encryptionKey: process.env.ENCRYPTION_KEY,
  
  // 外部サービス（機密）
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};

// 環境変数の検証
export const validateEnv = () => {
  const requiredClientVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const requiredServerVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missingClientVars = requiredClientVars.filter(
    varName => !process.env[varName]
  );

  const missingServerVars = requiredServerVars.filter(
    varName => !process.env[varName]
  );

  if (missingClientVars.length > 0) {
    throw new Error(`Missing required client environment variables: ${missingClientVars.join(', ')}`);
  }

  if (missingServerVars.length > 0) {
    throw new Error(`Missing required server environment variables: ${missingServerVars.join(', ')}`);
  }
};

// 開発環境でのみデバッグ情報を出力
export const logEnvConfig = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Environment Configuration:', {
      appName: clientEnv.appName,
      appVersion: clientEnv.appVersion,
      appEnv: clientEnv.appEnv,
      debugMode: clientEnv.debugMode,
      hasSupabaseUrl: !!clientEnv.supabaseUrl,
      hasSupabaseAnonKey: !!clientEnv.supabaseAnonKey,
      hasServiceKey: !!serverEnv.supabaseServiceKey,
    });
  }
};

// 環境変数の初期化
validateEnv();
logEnvConfig();

// 後方互換性のため、既存のexportを維持
export const {
  supabaseUrl,
  supabaseAnonKey,
  appName,
  appVersion,
  appUrl,
  appEnv,
  debugMode,
  analyticsId,
  errorReportingUrl,
  stripePublishableKey,
} = clientEnv;

// デバッグ用ログ関数
export const debugLog = (message: string, ...args: any[]) => {
  if (debugMode) {
    console.log(`[DEBUG] ${message}`, ...args);
  }
};

export const infoLog = (message: string, ...args: any[]) => {
  if (debugMode) {
    console.log(`[INFO] ${message}`, ...args);
  }
};

export const errorLog = (message: string, ...args: any[]) => {
  console.error(`[ERROR] ${message}`, ...args);
};

// 環境判定ヘルパー
export const isDevelopment = () => appEnv === 'development';
export const isProduction = () => appEnv === 'production';
export const isDebugMode = () => debugMode; 