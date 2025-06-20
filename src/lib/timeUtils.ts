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