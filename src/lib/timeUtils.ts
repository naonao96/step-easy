/**
 * 分数を人間が読みやすい形式に変換する
 */
export const formatDuration = (minutes: number): string => {
  if (!minutes || minutes <= 0) return '0分';
  
  if (minutes < 60) {
    return `${minutes}分`;
  } else if (minutes < 1440) { // 24時間未満
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}時間` : `${h}時間${m}分`;
  } else { // 1日以上
    const days = Math.floor(minutes / 1440);
    const remainingMinutes = minutes % 1440;
    const h = Math.floor(remainingMinutes / 60);
    const m = remainingMinutes % 60;
    
    let result = `${days}日`;
    if (h > 0) result += `${h}時間`;
    if (m > 0) result += `${m}分`;
    return result;
  }
};

/**
 * 分数を短縮形式で表示する（バッジなどで使用）
 */
export const formatDurationShort = (minutes: number): string => {
  if (!minutes || minutes <= 0) return '0分';
  
  if (minutes < 60) {
    return `${minutes}分`;
  } else if (minutes < 1440) { // 24時間未満
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h${m}m`;
  } else { // 1日以上
    const days = Math.floor(minutes / 1440);
    const remainingMinutes = minutes % 1440;
    const h = Math.floor(remainingMinutes / 60);
    
    if (h === 0) {
      return `${days}日`;
    } else {
      return `${days}d${h}h`;
    }
  }
};

/**
 * 秒数を時間:分:秒形式に変換する（タイマー表示用）
 */
export const formatTimer = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * 時間の比較と達成率を計算する
 */
export const calculateTimeComparison = (estimatedMinutes: number, actualMinutes: number) => {
  const difference = actualMinutes - estimatedMinutes;
  const achievementRate = Math.round((estimatedMinutes / actualMinutes) * 100);
  const isUnderEstimate = actualMinutes <= estimatedMinutes;
  
  return {
    difference: Math.abs(difference),
    differenceText: isUnderEstimate 
      ? `${formatDuration(difference)} 短縮` 
      : `${formatDuration(difference)} 超過`,
    achievementRate,
    isUnderEstimate,
    status: isUnderEstimate ? 'success' : 'warning'
  };
};

/**
 * 安全な日本語日付フォーマット（ロケールエラー回避）
 */
export const formatDateJP = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return '無効な日付';
    }
    
    // デフォルトオプション
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      ...options
    };
    
    // まず ja-JP を試す
    try {
      return dateObj.toLocaleDateString('ja-JP', defaultOptions);
    } catch (localeError) {
      // ja-JP が失敗した場合は ja を試す
      try {
        return dateObj.toLocaleDateString('ja', defaultOptions);
      } catch (jaError) {
        // それも失敗した場合はデフォルトロケールを使用
        return dateObj.toLocaleDateString(undefined, defaultOptions);
      }
    }
  } catch (error) {
    console.warn('Date formatting error:', error);
    return '日付エラー';
  }
};

/**
 * 安全な日本語時刻フォーマット（ロケールエラー回避）
 */
export const formatTimeJP = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return '無効な時刻';
    }
    
    // デフォルトオプション
    const defaultOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      ...options
    };
    
    // まず ja-JP を試す
    try {
      return dateObj.toLocaleTimeString('ja-JP', defaultOptions);
    } catch (localeError) {
      // ja-JP が失敗した場合は ja を試す
      try {
        return dateObj.toLocaleTimeString('ja', defaultOptions);
      } catch (jaError) {
        // それも失敗した場合はデフォルトロケールを使用
        return dateObj.toLocaleTimeString(undefined, defaultOptions);
      }
    }
  } catch (error) {
    console.warn('Time formatting error:', error);
    return '時刻エラー';
  }
};

/**
 * 安全な日本語日時フォーマット（ロケールエラー回避）
 */
export const formatDateTimeJP = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return '無効な日時';
    }
    
    // デフォルトオプション
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options
    };
    
    // まず ja-JP を試す
    try {
      return dateObj.toLocaleString('ja-JP', defaultOptions);
    } catch (localeError) {
      // ja-JP が失敗した場合は ja を試す
      try {
        return dateObj.toLocaleString('ja', defaultOptions);
      } catch (jaError) {
        // それも失敗した場合はデフォルトロケールを使用
        return dateObj.toLocaleString(undefined, defaultOptions);
      }
    }
  } catch (error) {
    console.warn('DateTime formatting error:', error);
    return '日時エラー';
  }
};

/**
 * 日本時間を取得する共通関数
 */
export const getJapanTime = (): Date => {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", {timeZone: "Asia/Tokyo"}));
};

/**
 * 日本時間での現在時刻を取得する共通関数
 */
export const getJapanTimeNow = (): { date: Date; hour: number; minute: number; second: number } => {
  const japanTime = getJapanTime();
  return {
    date: japanTime,
    hour: japanTime.getHours(),
    minute: japanTime.getMinutes(),
    second: japanTime.getSeconds()
  };
};

/**
 * 感情ログ用の統一された時間帯判定関数
 */
export const getEmotionTimePeriod = (): 'morning' | 'afternoon' | 'evening' => {
  const { hour } = getJapanTimeNow();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
};

/**
 * 感情ログ用の統一された時間帯ラベル取得関数
 */
export const getEmotionTimePeriodLabel = (): string => {
  const { hour } = getJapanTimeNow();
  if (hour >= 6 && hour < 12) return '朝';
  if (hour >= 12 && hour < 18) return '昼';
  return '晩'; // 18:00-6:00（18:00-24:00 + 0:00-6:00）
};

export function getTimeBasedGreeting(): string {
  const { hour } = getJapanTimeNow();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening'; // 18:00-6:00（18:00-24:00 + 0:00-6:00）
}

export function getDayOfWeek(): string {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[new Date().getDay()];
}

export function getTimeBasedMessage(userName?: string): string {
  const timeGreeting = getTimeBasedGreeting();
  const userGreeting = userName ? `${userName}さん、` : '';
  
  switch (timeGreeting) {
    case 'morning':
      return `${userGreeting}おはようございます！今日も習慣を継続するのにぴったりの日ですね。`;
    case 'afternoon':
      return `${userGreeting}お疲れ様です！午前中の頑張りを活かして、午後も習慣を続けていきましょう。`;
    case 'evening':
      return `${userGreeting}今日もお疲れ様でした。明日も素晴らしい一日になるよう、今日の習慣を大切にしてくださいね。`;
    default:
      return `${userGreeting}お疲れ様でした。明日も習慣を頑張りましょう！`;
  }
}

export function getDayBasedMessage(userName?: string): string {
  const dayOfWeek = getDayOfWeek();
  const userGreeting = userName ? `${userName}さん、` : '';
  
  switch (dayOfWeek) {
    case '月':
      return `${userGreeting}新しい一週間の始まりですね！今週も習慣を頑張りましょう`;
    case '水':
      return `${userGreeting}週の真ん中です。ここまで習慣をよく継続されましたね`;
    case '金':
      return `${userGreeting}金曜日ですね！今週の習慣継続を振り返ってみませんか`;
    default:
      return `${userGreeting}今日も習慣を頑張りましょう！`;
  }
} 

/**
 * 日付をJSTで統一してYYYY-MM-DD形式の文字列に変換（統一実装）
 * @param date 変換対象の日付
 * @returns JST基準のYYYY-MM-DD形式文字列
 */
export function toJSTDateString(date: Date): string {
  // 正確な日本時間変換（en-CAロケールでYYYY-MM-DD形式を取得）
  return date.toLocaleDateString("en-CA", {timeZone: "Asia/Tokyo"});
}

/**
 * 日付をISO文字列に変換（データベース用）
 * @param date 変換対象の日付
 * @returns ISO文字列（YYYY-MM-DDTHH:mm:ss.sssZ）
 */
export function toISODateString(date: Date): string {
  return date.toISOString();
}

/**
 * 日付をISO文字列に変換（null対応）
 * @param date 変換対象の日付（null可）
 * @returns ISO文字列またはnull
 */
export function toISODateStringOrNull(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

/**
 * 今日の日付をJSTで取得してYYYY-MM-DD形式の文字列に変換
 * @returns 今日のJST基準YYYY-MM-DD形式文字列
 */
export function getTodayJSTString(): string {
  const today = new Date();
  return toJSTDateString(today);
}

/**
 * 日付文字列をJST基準のDateオブジェクトに変換
 * @param dateString YYYY-MM-DD形式の日付文字列
 * @returns JST基準のDateオブジェクト
 */
export function fromJSTDateString(dateString: string): Date {
  const utcDate = new Date(dateString + 'T00:00:00Z');
  return new Date(utcDate.getTime() - (9 * 60 * 60 * 1000));
}

/**
 * 日付をDATE型用のYYYY-MM-DD形式に変換（start_date用）
 * @param date 変換対象の日付（null可）
 * @returns YYYY-MM-DD形式文字列またはnull
 */
export function toDateStringOrNull(date: Date | null): string | null {
  return date ? date.toISOString().split('T')[0] : null;
}

/**
 * 日付をTIMESTAMP WITH TIME ZONE型用のISO文字列に変換（due_date用）
 * @param date 変換対象の日付（null可）
 * @returns ISO文字列またはnull
 */
export function toTimestampStringOrNull(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

 