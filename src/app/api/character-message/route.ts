import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

// 感情分析ヘルパー関数
function analyzeEmotionalState(data: {
  recentCompletionRate: number;
  overallRate: number;
  overdueCount: number;
  recentCompletions: number;
  todayTasks: number;
  todayCompleted: number;
}) {
  const { recentCompletionRate, overallRate, overdueCount, recentCompletions, todayTasks, todayCompleted } = data;
  
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
  
  // 継続性判定
  let consistency = 'regular';
  if (recentCompletions >= 3) consistency = 'excellent';
  else if (recentCompletions === 0) consistency = 'concerning';
  
  return {
    stressLevel,
    motivation,
    progress,
    consistency,
    needsEncouragement: motivation === 'low' || progress === 'struggling',
    needsRest: stressLevel === 'high' && motivation === 'low'
  };
}

export async function POST(req: NextRequest) {
  try {
    const { userType, userName, tasks, statistics }: RequestBody = await req.json();

    if (userType === 'free') {
      return await generateFreeMessage(userName);
    } else if (userType === 'premium') {
      return await generatePremiumMessage(userName, tasks, statistics);
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

async function generateFreeMessage(userName?: string) {
  try {
    // キャッシュキーの生成
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const cacheKey = `free_${userName || 'anonymous'}_${today}`;
    
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

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const todayFormatted = new Date().toLocaleDateString('ja-JP', {
      weekday: 'long',
      month: 'long', 
      day: 'numeric'
    });

    const userGreeting = userName ? `${userName}さん、` : '';
    
    const prompt = `
あなたは優しいタスク管理アプリのキャラクターです。
今日は${todayFormatted}です。
${userName ? `ユーザーの名前は「${userName}」です。` : ''}

【重要】以下の条件でメッセージを生成してください：
- 必ず100文字以内（絶対条件）
- 親しみやすく優しい口調
- ${userName ? `「${userName}さん」という呼びかけを自然に含める` : ''}
- 今日の天気や季節感を含める
- タスク管理へのモチベーションを上げる内容
- 絵文字は使わない

例：「${userGreeting}今日は晴れて気持ちの良い一日ですね！新しいタスクにチャレンジするのにぴったりです。一歩ずつゆっくりと進んでいきましょう。」
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

    console.log('Successfully generated and cached free message');
    return NextResponse.json({ message: truncatedMessage });
  } catch (error) {
    console.error('Gemini API error (Free):', error);
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Gemini API key configured:', !!process.env.GEMINI_API_KEY);
    
    // エラータイプに応じたフォールバック
    let fallbackMessage;
    if (isRateLimitError(error)) {
      fallbackMessage = userName 
        ? `${userName}さん、現在メッセージ生成が混雑しています。少し時間をおいてから再度お試しください。`
        : '現在メッセージ生成が混雑しています。少し時間をおいてから再度お試しください。';
    } else {
      fallbackMessage = userName 
        ? `${userName}さん、今日も一緒に頑張りましょう！新しいタスクを作成してみませんか？`
        : '今日も一緒に頑張りましょう！新しいタスクを作成してみませんか？';
    }
    
    return NextResponse.json({ message: fallbackMessage });
  }
}

async function generatePremiumMessage(userName?: string, tasks?: any[], statistics?: any) {
  try {
    // キャッシュキーの生成（統計情報も含める）
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const statsHash = statistics ? 
      `${statistics.selectedDatePercentage}_${statistics.todayPercentage}_${statistics.overallPercentage}` : 
      'nostats';
    const cacheKey = `premium_${userName || 'anonymous'}_${today}_${statsHash}`;
    
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

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const todayFormatted = new Date().toLocaleDateString('ja-JP', {
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

    // 感情状態の推定
    const emotionalState = analyzeEmotionalState({
      recentCompletionRate,
      overallRate: statistics?.overallPercentage || 0,
      overdueCount,
      recentCompletions: recentCompletions.length,
      todayTasks: statistics?.selectedDateTotalTasks || 0,
      todayCompleted: statistics?.selectedDateCompletedTasks || 0
    });

    const userGreeting = userName ? `${userName}さん、` : '';
    
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

感情分析結果：
- ストレスレベル: ${emotionalState.stressLevel}
- モチベーション: ${emotionalState.motivation}
- 進捗状況: ${emotionalState.progress}
- 継続性: ${emotionalState.consistency}
- 励ましが必要: ${emotionalState.needsEncouragement ? 'はい' : 'いいえ'}
- 休息が必要: ${emotionalState.needsRest ? 'はい' : 'いいえ'}

【重要】プレミアムユーザー向けの特別なメッセージを以下の条件で生成してください：
- 必ず200文字以内（絶対条件）
- ${userName ? `「${userName}さん」という呼びかけを自然に含める` : ''}
- 感情分析に基づいた深い心理的サポートと具体的な行動提案
- データに基づいた個人化されたアドバイス
- プレミアムユーザーとしての特別感を演出
- 優しく寄り添う専属コーチのような口調
- 絵文字は使わない

【プレミアム専用機能】以下の要素を含めてください：
1. パーソナライズされた行動パターン分析
2. 今日の感情状態に基づく最適な行動提案
3. 継続性向上のための具体的なアドバイス
4. 成長を実感できる励ましの言葉

例（感情状態に応じて）：
- 高ストレス時: 「${userGreeting}データを見ると期限切れタスクでプレッシャーを感じていますね。まずは最も重要なタスク1つに集中し、15分間の作業から始めてみませんか？あなたの継続力なら必ず乗り越えられます。」
- 好調時: 「${userGreeting}今日は${statistics?.selectedDatePercentage || 0}%の達成率、素晴らしいペースです！この調子を維持しつつ、明日のタスクも1つ準備しておくと、さらに効率的になりそうですね。」
- 低調時: 「${userGreeting}今日は${statistics?.selectedDatePercentage || 0}%の達成率ですが、焦る必要はありません。過去のデータを見ると、あなたは着実に成長しています。小さなタスクから始めて、達成感を積み重ねていきましょう。」
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