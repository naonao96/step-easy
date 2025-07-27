/**
 * 基本的なメモリベースのレート制限
 * 本番環境ではRedisなどの外部ストレージを使用することを推奨
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const requestLog = new Map<string, RateLimitRecord>();

/**
 * レート制限チェック
 * @param identifier 識別子（IPアドレス、ユーザーIDなど）
 * @param limit 制限回数
 * @param windowMs 時間窓（ミリ秒）
 * @returns 制限内かどうか
 */
export const checkRateLimit = (
  identifier: string,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000
): { allowed: boolean; remaining: number; resetTime: number } => {
  const now = Date.now();
  const record = requestLog.get(identifier);
  
  if (!record || now > record.resetTime) {
    // 新しい時間窓または初回アクセス
    const resetTime = now + windowMs;
    requestLog.set(identifier, { count: 1, resetTime });
    return { allowed: true, remaining: limit - 1, resetTime };
  }
  
  if (record.count >= limit) {
    // 制限超過
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }
  
  // 制限内
  record.count++;
  return { allowed: true, remaining: limit - record.count, resetTime: record.resetTime };
};

/**
 * 認証専用レート制限
 * @param identifier 識別子
 * @returns 制限内かどうか
 */
export const checkAuthRateLimit = (identifier: string) => {
  return checkRateLimit(identifier, 5, 5 * 60 * 1000); // 5分間に5回
};

/**
 * API専用レート制限
 * @param identifier 識別子
 * @returns 制限内かどうか
 */
export const checkApiRateLimit = (identifier: string) => {
  return checkRateLimit(identifier, 100, 15 * 60 * 1000); // 15分間に100回
};

/**
 * 古いレコードのクリーンアップ
 * メモリリークを防ぐため定期的に実行
 */
export const cleanupRateLimit = () => {
  const now = Date.now();
  requestLog.forEach((record, identifier) => {
    if (now > record.resetTime) {
      requestLog.delete(identifier);
    }
  });
};

// 1時間ごとにクリーンアップを実行
setInterval(cleanupRateLimit, 60 * 60 * 1000); 