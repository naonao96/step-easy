import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface RequestBody {
  userType: 'free' | 'premium';
  userName?: string;
  tasks?: any[];
  statistics?: {
    selectedDateCompletedTasks: number;
    selectedDateTotalTasks: number;
    selectedDatePercentage: number;
    todayPercentage: number;
    overallPercentage: number;
  };
}

interface ExecutionData {
  totalExecutions: number;
  totalDuration: number;
  peakHour: number;
  peakDay: number;
  averageSessionDuration: number;
  mostProductiveTime: string;
  consistencyScore: number;
}

const MESSAGE_LIMITS = {
  free: {
    target: 100,    // 目標文字数
    max: 200,       // 許容上限（バッファ含む）
    database: 350   // データベース制限（安全上限）
  },
  premium: {
    target: 200,    // 目標文字数
    max: 300,       // 許容上限（バッファ含む）
    database: 350   // データベース制限（安全上限）
  }
};

// シンプルなメモリキャッシュ（本番環境ではRedisなどを推奨）
const messageCache = new Map<string, { message: string; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10分

// レート制限エラーの判定
function isRateLimitError(error: any): boolean {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorString = error?.toString?.()?.toLowerCase() || '';
  
  return (
    errorMessage.includes('rate limit') ||
    errorMessage.includes('quota') ||
    errorMessage.includes('429') ||
    errorString.includes('rate limit') ||
    errorString.includes('quota') ||
    error?.status === 429
  );
}

// 指数バックオフでの待機
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// スマートトリム関数：自然な切れ目で文章をカット
function smartTrim(text: string, targetLength: number): string {
  if (text.length <= targetLength) return text;
  
  // 自然な切れ目を探す範囲（目標文字数の前後20文字）
  const searchStart = Math.max(0, targetLength - 20);
  const searchEnd = Math.min(text.length, targetLength + 20);
  
  // 優先順位の高い切れ目
  const naturalBreaks = ['。', '！', '？', '♪', '\n'];
  const secondaryBreaks = ['、', ')', '）', '...', '…'];
  
  // 第一優先：強い区切り文字
  for (let i = searchEnd; i >= searchStart; i--) {
    if (naturalBreaks.includes(text[i])) {
      return text.substring(0, i + 1);
    }
  }
  
  // 第二優先：弱い区切り文字
  for (let i = searchEnd; i >= searchStart; i--) {
    if (secondaryBreaks.includes(text[i])) {
      return text.substring(0, i + 1);
    }
  }
  
  // 最後の手段：目標文字数で強制カットして省略記号
  return text.substring(0, targetLength - 3) + '...';
}

// レート制限対応リトライ付きメッセージ生成
async function generateWithRetry(
  model: any, 
  prompt: string, 
  targetLength: number, 
  maxLength: number, 
  maxRetries: number = 3
): Promise<string> {
  let attempt = 0;
  let bestMessage = '';
  
  while (attempt <= maxRetries) {
    try {
      const currentPrompt = attempt === 0 
        ? prompt 
        : prompt + `\n\n重要：前回のメッセージが長すぎました。必ず${targetLength}文字以内で、より簡潔にまとめてください。`;
      
      console.log(`Gemini API attempt ${attempt + 1}/${maxRetries + 1}`);
      
      const result = await model.generateContent(currentPrompt);
      const message = result.response.text().trim();
      
      console.log(`Generated message length: ${message.length}`);
      
      // 許容範囲内なら成功
      if (message.length <= maxLength) {
        // 目標文字数に近いほど良い
        if (message.length <= targetLength + 20) {
          return message;
        }
        bestMessage = message; // バックアップとして保存
      }
      
      attempt++;
    } catch (error) {
      console.error(`Gemini API attempt ${attempt + 1} failed:`, error);
      
      // レート制限エラーの場合は指数バックオフで待機
      if (isRateLimitError(error)) {
        const waitTime = Math.pow(2, attempt) * 1000 + Math.random() * 1000; // 1-2秒, 2-4秒, 4-8秒...
        console.log(`Rate limit detected, waiting ${Math.round(waitTime)}ms before retry`);
        await delay(waitTime);
      }
      
      attempt++;
      
      // 最後の試行でもエラーの場合はエラーを投げる
      if (attempt > maxRetries) {
        throw error;
      }
    }
  }
  
  // リトライ失敗時はベストメッセージをスマートトリム
  return bestMessage ? smartTrim(bestMessage, targetLength) : '';
}

// 実行データを取得する関数
async function getExecutionData(userId: string): Promise<ExecutionData | null> {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // 過去30日分の実行ログを取得
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: executionLogs, error } = await supabase
      .from('execution_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .gte('start_time', thirtyDaysAgo.toISOString());

    if (error || !executionLogs || executionLogs.length === 0) {
      return null;
    }

    // 統計データを計算
    const totalExecutions = executionLogs.length;
    const totalDuration = executionLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
    const averageSessionDuration = totalDuration / totalExecutions;

    // 時間帯別の実行回数を集計
    const hourCounts = Array(24).fill(0);
    executionLogs.forEach(log => {
      const startDate = new Date(log.start_time);
      const hour = startDate.getHours();
      hourCounts[hour]++;
    });
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

    // 曜日別の実行回数を集計
    const dayCounts = Array(7).fill(0);
    executionLogs.forEach(log => {
      const startDate = new Date(log.start_time);
      const day = startDate.getDay();
      dayCounts[day]++;
    });
    const peakDay = dayCounts.indexOf(Math.max(...dayCounts));

    // 最も生産的な時間帯の文字列
    const weekDays = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
    const mostProductiveTime = `${weekDays[peakDay]}の${peakHour}時`;

    // 継続性スコア（過去7日間の実行回数）
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentExecutions = executionLogs.filter(log => 
      new Date(log.start_time) >= sevenDaysAgo
    ).length;
    const consistencyScore = Math.min(recentExecutions / 7, 1); // 0-1の範囲

    return {
      totalExecutions,
      totalDuration,
      peakHour,
      peakDay,
      averageSessionDuration,
      mostProductiveTime,
      consistencyScore
    };
  } catch (error) {
    console.error('実行データ取得エラー:', error);
    return null;
  }
}

// 感情分析ヘルパー関数（実行データも含める）
function analyzeEmotionalState(data: {
  recentCompletionRate: number;
  overallRate: number;
  overdueCount: number;
  recentCompletions: number;
  todayTasks: number;
  todayCompleted: number;
  executionData?: ExecutionData | null;
}) {
  const { recentCompletionRate, overallRate, overdueCount, recentCompletions, todayTasks, todayCompleted, executionData } = data;
  
  // ストレスレベル判定
  let stressLevel = 'low';
  if (overdueCount > 3) stressLevel = 'high';
  else if (overdueCount > 1) stressLevel = 'medium';
  
  // モチベーション状態判定
  let motivation = 'stable';
  if (recentCompletionRate >= 80) motivation = 'high';
  else if (recentCompletionRate <= 30) motivation = 'low';
  
  // 進捗状況判定
  let progress = 'steady';
  if (todayCompleted === todayTasks && todayTasks > 0) progress = 'excellent';
  else if (todayCompleted === 0 && todayTasks > 0) progress = 'struggling';
  
  // 継続性判定（実行データも考慮）
  let consistency = 'regular';
  if (executionData) {
    if (executionData.consistencyScore >= 0.7) consistency = 'excellent';
    else if (executionData.consistencyScore <= 0.3) consistency = 'concerning';
  } else {
    if (recentCompletions >= 3) consistency = 'excellent';
    else if (recentCompletions === 0) consistency = 'concerning';
  }
  
  // 生産性パターン
  let productivityPattern = 'unknown';
  if (executionData) {
    if (executionData.averageSessionDuration >= 3600) productivityPattern = 'long_sessions';
    else if (executionData.averageSessionDuration <= 900) productivityPattern = 'short_sessions';
    else productivityPattern = 'balanced';
  }
  
  return {
    stressLevel,
    motivation,
    progress,
    consistency,
    productivityPattern,
    needsEncouragement: motivation === 'low' || progress === 'struggling',
    needsRest: stressLevel === 'high' && motivation === 'low',
    needsOptimization: executionData && executionData.consistencyScore < 0.5
  };
}

export async function POST(req: NextRequest) {
  try {
    const { userType, userName, tasks, statistics }: RequestBody = await req.json();

    // ユーザーIDを取得
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 実行データを取得
    const executionData = await getExecutionData(user.id);

    if (userType === 'free') {
      return await generateFreeMessage(userName, executionData);
    } else if (userType === 'premium') {
      return await generatePremiumMessage(userName, tasks, statistics, executionData);
    }

    return NextResponse.json({ error: 'Invalid user type' }, { status: 400 });
  } catch (error) {
    console.error('Character message API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate message' },
      { status: 500 }
    );
  }
}

async function generateFreeMessage(userName?: string, executionData?: ExecutionData | null) {
  try {
    // 日本時間での日付取得（統一処理）
    const getJSTDateString = (): string => {
      const now = new Date();
      const jstOffset = 9 * 60;
      const jstTime = new Date(now.getTime() + (jstOffset * 60 * 1000));
      return jstTime.toISOString().split('T')[0];
    };

    // キャッシュキーの生成
    const today = getJSTDateString();
    const executionHash = executionData ? 
      `${executionData.totalExecutions}_${executionData.peakHour}_${executionData.consistencyScore}` : 
      'noexec';
    const cacheKey = `free_${userName || 'anonymous'}_${today}_${executionHash}`;
    
    // キャッシュチェック
    const cached = messageCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Returning cached message for free user');
      return NextResponse.json({ message: cached.message });
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    console.log('Generating new message for free user:', userName || 'anonymous');
    console.log('Execution data:', executionData);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 日本時間での日付取得（統一処理）
    const getJSTDate = (): Date => {
      const now = new Date();
      const jstOffset = 9 * 60; // 日本時間は UTC+9
      return new Date(now.getTime() + (jstOffset * 60 * 1000));
    };

    const todayFormatted = getJSTDate().toLocaleDateString('ja-JP', {
      weekday: 'long',
      month: 'long', 
      day: 'numeric'
    });

    const userGreeting = userName ? `${userName}さん、` : '';
    
    // 実行データに基づく個別化されたメッセージ
    let executionInsight = '';
    if (executionData) {
      const avgMinutes = Math.floor(executionData.averageSessionDuration / 60);
      const totalHours = Math.floor(executionData.totalDuration / 3600);
      
      if (executionData.consistencyScore >= 0.7) {
        executionInsight = `過去30日間で${executionData.totalExecutions}回のタスク実行、平均${avgMinutes}分の集中時間を記録しています。特に${executionData.mostProductiveTime}が最も生産的ですね。`;
      } else if (executionData.consistencyScore >= 0.4) {
        executionInsight = `過去30日間で${executionData.totalExecutions}回のタスク実行、合計${totalHours}時間の作業時間を積み重ねています。継続が力になりますよ。`;
      } else {
        executionInsight = `過去30日間で${executionData.totalExecutions}回のタスク実行を記録しています。小さな一歩から始めて、習慣を築いていきましょう。`;
      }
    }

    const prompt = `
あなたは優しく寄り添うタスク管理アプリのキャラクターです。
今日は${todayFormatted}です。
${userName ? `ユーザーの名前は「${userName}」です。` : ''}

${executionData ? `実行データ分析：
${executionInsight}` : ''}

【重要】無料ユーザー向けの励ましメッセージを以下の条件で生成してください：
- 必ず100文字以内（絶対条件）
- ${userName ? `「${userName}さん」という呼びかけを自然に含める` : ''}
- 優しく寄り添う口調
- ${executionData ? '実行データに基づいた具体的な励まし' : '一般的な励まし'}
- 絵文字は使わない
- シンプルで分かりやすい言葉

例：
${userGreeting}${executionData ? executionInsight : '今日も一緒に頑張りましょう！小さな進歩が大きな成果につながります。'}
`;

    // レート制限対応リトライ付き生成
    const finalMessage = await generateWithRetry(
      model, 
      prompt, 
      MESSAGE_LIMITS.free.target, 
      MESSAGE_LIMITS.free.max
    );
    
    // 最終安全チェック
    const truncatedMessage = finalMessage || 'メッセージの生成に失敗しました。';
    
    // キャッシュに保存
    messageCache.set(cacheKey, {
      message: truncatedMessage,
      timestamp: Date.now()
    });

    console.log('Free message generated successfully');
    return NextResponse.json({ message: truncatedMessage });

  } catch (error) {
    console.error('Free message generation failed:', error);
    console.error('Gemini API key configured:', !!process.env.GEMINI_API_KEY);
    
    // エラー時のフォールバック
    const fallbackMessage = userName ? 
      `${userName}さん、今日も一緒に頑張りましょう！` : 
      '今日も頑張りましょう！';
    
    return NextResponse.json(
      { message: fallbackMessage },
      { status: 200 } // エラーでもメッセージは返す
    );
  }
}

async function generatePremiumMessage(userName?: string, tasks?: any[], statistics?: any, executionData?: ExecutionData | null) {
  try {
    // 日本時間での日付取得（統一処理）
    const getJSTDateString = (): string => {
      const now = new Date();
      const jstOffset = 9 * 60;
      const jstTime = new Date(now.getTime() + (jstOffset * 60 * 1000));
      return jstTime.toISOString().split('T')[0];
    };

    // キャッシュキーの生成（統計情報と実行データも含める）
    const today = getJSTDateString(); // YYYY-MM-DD (JST)
    const statsHash = statistics ? 
      `${statistics.selectedDatePercentage}_${statistics.todayPercentage}_${statistics.overallPercentage}` : 
      'nostats';
    const executionHash = executionData ? 
      `${executionData.totalExecutions}_${executionData.peakHour}_${executionData.consistencyScore}` : 
      'noexec';
    const cacheKey = `premium_${userName || 'anonymous'}_${today}_${statsHash}_${executionHash}`;
    
    // キャッシュチェック（プレミアムは5分キャッシュで頻度高め）
    const cached = messageCache.get(cacheKey);
    const premiumCacheDuration = 5 * 60 * 1000; // 5分
    if (cached && Date.now() - cached.timestamp < premiumCacheDuration) {
      console.log('Returning cached message for premium user');
      return NextResponse.json({ message: cached.message });
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    console.log('Generating new message for premium user:', userName || 'anonymous');
    console.log('Statistics:', statistics);
    console.log('Execution data:', executionData);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 日本時間での日付取得（統一処理）
    const getJSTDate = (): Date => {
      const now = new Date();
      const jstOffset = 9 * 60; // 日本時間は UTC+9
      return new Date(now.getTime() + (jstOffset * 60 * 1000));
    };

    const todayFormatted = getJSTDate().toLocaleDateString('ja-JP', {
      weekday: 'long',
      month: 'long', 
      day: 'numeric'
    });

    // 高度なタスクデータ分析と感情分析
    const recentTasks = tasks?.slice(-10) || [];
    const completedCount = recentTasks.filter(t => t.status === 'done').length;
    const totalCount = recentTasks.length;
    const recentCompletionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // 感情分析のためのデータ収集
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    // 最近のタスク傾向分析
    const recentCompletions = tasks?.filter(t => 
      t.status === 'done' && t.completed_at && new Date(t.completed_at) >= threeDaysAgo
    ) || [];
    
    const overdueCount = tasks?.filter(t => 
      t.due_date && new Date(t.due_date) < now && t.status !== 'done'
    ).length || 0;

    // 感情状態の推定（実行データも含める）
    const emotionalState = analyzeEmotionalState({
      recentCompletionRate,
      overallRate: statistics?.overallPercentage || 0,
      overdueCount,
      recentCompletions: recentCompletions.length,
      todayTasks: statistics?.selectedDateTotalTasks || 0,
      todayCompleted: statistics?.selectedDateCompletedTasks || 0,
      executionData
    });

    const userGreeting = userName ? `${userName}さん、` : '';
    
    // 実行データに基づく高度な分析
    let executionAnalysis = '';
    if (executionData) {
      const avgMinutes = Math.floor(executionData.averageSessionDuration / 60);
      const totalHours = Math.floor(executionData.totalDuration / 3600);
      const weekDays = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
      
      executionAnalysis = `
実行パターン分析：
- 過去30日間の総実行回数: ${executionData.totalExecutions}回
- 総実行時間: ${totalHours}時間
- 平均セッション時間: ${avgMinutes}分
- 最も生産的な時間: ${executionData.mostProductiveTime}
- 継続性スコア: ${Math.round(executionData.consistencyScore * 100)}%
- 生産性パターン: ${emotionalState.productivityPattern === 'long_sessions' ? '長時間集中型' : emotionalState.productivityPattern === 'short_sessions' ? '短時間効率型' : 'バランス型'}
`;
    }
    
    const prompt = `
あなたは優しく寄り添うタスク管理アプリのキャラクターです。
今日は${todayFormatted}です。
${userName ? `ユーザーの名前は「${userName}」です。` : ''}

ユーザーの状況：
- 今日の達成率: ${statistics?.selectedDatePercentage || 0}%
- 今日のタスク: ${statistics?.selectedDateTotalTasks || 0}個
- 今日の完了: ${statistics?.selectedDateCompletedTasks || 0}個
- 全体の完了率: ${statistics?.overallPercentage || 0}%
- 直近のタスク完了率: ${recentCompletionRate}%
- 期限切れタスク: ${overdueCount}個
- 最近3日間の完了: ${recentCompletions.length}個

${executionAnalysis}

感情分析結果：
- ストレスレベル: ${emotionalState.stressLevel}
- モチベーション: ${emotionalState.motivation}
- 進捗状況: ${emotionalState.progress}
- 継続性: ${emotionalState.consistency}
- 生産性パターン: ${emotionalState.productivityPattern}
- 励ましが必要: ${emotionalState.needsEncouragement ? 'はい' : 'いいえ'}
- 休息が必要: ${emotionalState.needsRest ? 'はい' : 'いいえ'}
- 最適化が必要: ${emotionalState.needsOptimization ? 'はい' : 'いいえ'}

【重要】プレミアムユーザー向けの特別なメッセージを以下の条件で生成してください：
- 必ず200文字以内（絶対条件）
- ${userName ? `「${userName}さん」という呼びかけを自然に含める` : ''}
- 感情分析と実行データに基づいた深い心理的サポートと具体的な行動提案
- データに基づいた個人化されたアドバイス
- プレミアムユーザーとしての特別感を演出
- 優しく寄り添う専属コーチのような口調
- 絵文字は使わない

【プレミアム専用機能】以下の要素を含めてください：
1. パーソナライズされた行動パターン分析
2. 今日の感情状態に基づく最適な行動提案
3. 継続性向上のための具体的なアドバイス
4. 成長を実感できる励ましの言葉
5. ${executionData ? '実行データに基づいた生産性向上の提案' : '習慣形成のための戦略'}

例（感情状態と実行データに応じて）：
- 高ストレス時: 「${userGreeting}データを見ると期限切れタスクでプレッシャーを感じていますね。${executionData ? `あなたの最適な作業時間は${executionData.mostProductiveTime}です。` : ''}まずは最も重要なタスク1つに集中し、15分間の作業から始めてみませんか？あなたの継続力なら必ず乗り越えられます。」
- 好調時: 「${userGreeting}今日は${statistics?.selectedDatePercentage || 0}%の達成率、素晴らしいペースです！${executionData ? `過去30日間で${executionData.totalExecutions}回の実行を記録し、継続性スコア${Math.round(executionData.consistencyScore * 100)}%と着実に成長しています。` : ''}この調子を維持しつつ、明日のタスクも1つ準備しておくと、さらに効率的になりそうですね。」
- 低調時: 「${userGreeting}今日は${statistics?.selectedDatePercentage || 0}%の達成率ですが、焦る必要はありません。${executionData ? `過去の実行データを見ると、あなたは平均${Math.floor(executionData.averageSessionDuration / 60)}分の集中時間で着実に成果を上げています。` : ''}小さなタスクから始めて、達成感を積み重ねていきましょう。」
`;

    // レート制限対応リトライ付き生成
    const finalMessage = await generateWithRetry(
      model, 
      prompt, 
      MESSAGE_LIMITS.premium.target, 
      MESSAGE_LIMITS.premium.max
    );
    
    // 最終安全チェック
    const truncatedMessage = finalMessage || 'メッセージの生成に失敗しました。';

    // キャッシュに保存
    messageCache.set(cacheKey, {
      message: truncatedMessage,
      timestamp: Date.now()
    });

    console.log('Successfully generated and cached premium message');
    return NextResponse.json({ message: truncatedMessage });
  } catch (error) {
    console.error('Gemini API error (Premium):', error);
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Gemini API key configured:', !!process.env.GEMINI_API_KEY);
    
    // エラータイプに応じたフォールバック
    let fallbackMessage;
    if (isRateLimitError(error)) {
      fallbackMessage = userName 
        ? `${userName}さん、現在メッセージ生成が混雑しています。プレミアムメンバーとして優先的に処理いたしますので、少しお待ちください。`
        : '現在メッセージ生成が混雑しています。プレミアムメンバーとして優先的に処理いたしますので、少しお待ちください。';
    } else {
      fallbackMessage = userName 
        ? `${userName}さん、あなたのペースで大丈夫です。プレミアムメンバーとして、きっと目標を達成できますよ！`
        : 'あなたのペースで大丈夫です。プレミアムメンバーとして、きっと目標を達成できますよ！';
    }
    
    return NextResponse.json({ message: fallbackMessage });
  }
} 