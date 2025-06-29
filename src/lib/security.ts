/**
 * セキュリティ関連のユーティリティ関数
 * XSS対策、入力値検証、サニタイズ処理
 */

/**
 * 基本的なHTMLタグとスクリプトを除去するサニタイズ関数
 * @param input サニタイズ対象の文字列
 * @returns サニタイズされた文字列
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    // スクリプトタグを除去
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // すべてのHTMLタグを除去
    .replace(/<[^>]*>/g, '')
    // javascript:プロトコルを除去
    .replace(/javascript:/gi, '')
    // イベントハンドラー属性を除去
    .replace(/on\w+\s*=/gi, '')
    // データURIを除去
    .replace(/data:text\/html/gi, '')
    // 前後の空白を除去
    .trim();
}

/**
 * タスク入力値のバリデーション
 * @param input 検証対象の文字列
 * @returns バリデーション結果
 */
export function validateTaskInput(input: string): { isValid: boolean; error?: string } {
  if (!input) {
    return { isValid: false, error: '入力内容を入力してください' };
  }
  
  if (input.length > 1000) {
    return { isValid: false, error: '入力内容は1000文字以内で入力してください' };
  }
  
  // 危険なパターンのチェック
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
    /vbscript:/i,
    /expression\(/i
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(input)) {
      return { isValid: false, error: '無効な文字が含まれています' };
    }
  }
  
  return { isValid: true };
}

/**
 * メールアドレスの基本的なバリデーション
 * @param email 検証対象のメールアドレス
 * @returns バリデーション結果
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email) {
    return { isValid: false, error: 'メールアドレスを入力してください' };
  }
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return { isValid: false, error: '有効なメールアドレスを入力してください' };
  }
  
  if (email.length > 254) {
    return { isValid: false, error: 'メールアドレスが長すぎます' };
  }
  
  return { isValid: true };
}

/**
 * パスワードの基本的なバリデーション
 * @param password 検証対象のパスワード
 * @returns バリデーション結果
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password) {
    return { isValid: false, error: 'パスワードを入力してください' };
  }
  
  if (password.length < 6) {
    return { isValid: false, error: 'パスワードは6文字以上で入力してください' };
  }
  
  if (password.length > 128) {
    return { isValid: false, error: 'パスワードが長すぎます' };
  }
  
  return { isValid: true };
} 