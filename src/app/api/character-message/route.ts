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
    max: 200        // 許容上限（バッファ含む）
  },
  premium: {
    target: 200,    // 目標文字数
    max: 300        // 許容上限（バッファ含む）
  }
};

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

// リトライ付きメッセージ生成
async function generateWithRetry(
  model: any, 
  prompt: string, 
  targetLength: number, 
  maxLength: number, 
  maxRetries: number = 2
): Promise<string> {
  let attempt = 0;
  let bestMessage = '';
  
  while (attempt <= maxRetries) {
    try {
      const currentPrompt = attempt === 0 
        ? prompt 
        : prompt + `\n\n重要：前回のメッセージが長すぎました。必ず${targetLength}文字以内で、より簡潔にまとめてください。`;
      
      const result = await model.generateContent(currentPrompt);
      const message = result.response.text().trim();
      
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
      console.error(`Retry attempt ${attempt} failed:`, error);
      attempt++;
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
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const today = new Date().toLocaleDateString('ja-JP', {
      weekday: 'long',
      month: 'long', 
      day: 'numeric'
    });

    const userGreeting = userName ? `${userName}さん、` : '';
    
    const prompt = `
あなたは優しいタスク管理アプリのキャラクターです。
今日は${today}です。
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

    // 新システム：リトライ付き生成
    const finalMessage = await generateWithRetry(
      model, 
      prompt, 
      MESSAGE_LIMITS.free.target, 
      MESSAGE_LIMITS.free.max
    );
    
    // 最終安全チェック
    const truncatedMessage = finalMessage || 'メッセージの生成に失敗しました。';

    return NextResponse.json({ message: truncatedMessage });
  } catch (error) {
    console.error('Gemini API error:', error);
    // フォールバック
    const fallbackMessage = userName 
      ? `${userName}さん、今日も一緒に頑張りましょう！新しいタスクを作成してみませんか？`
      : '今日も一緒に頑張りましょう！新しいタスクを作成してみませんか？';
    return NextResponse.json({ message: fallbackMessage });
  }
}

async function generatePremiumMessage(userName?: string, tasks?: any[], statistics?: any) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const today = new Date().toLocaleDateString('ja-JP', {
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
今日は${today}です。
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

【重要】以下の条件でパーソナライズされたメッセージを生成してください：
- 必ず200文字以内（絶対条件）
- ${userName ? `「${userName}さん」という呼びかけを自然に含める` : ''}
- 今日の達成率を主な判断基準とし、感情分析結果に基づいた詳細な心理的サポート
- ユーザーの心境に寄り添う共感的なメッセージ
- 優しく寄り添う口調
- 絵文字は使わない
- ストレスが高い場合は無理をしないよう配慮
- プレミアムユーザー向けの特別感のあるメッセージ
- 具体的なアドバイスや提案を含める

例（必ず200文字以内）：
- 高達成率時: 「${userGreeting}今日は${statistics?.selectedDatePercentage || 0}%の達成率、素晴らしい調子ですね！この勢いを大切にしつつ、適度な休憩も取ってくださいね。」
- 低達成率時: 「${userGreeting}今日はまだ${statistics?.selectedDatePercentage || 0}%の達成率ですが、焦らずに小さなタスクから始めて、達成感を味わいながら進んでみませんか？」
- 高ストレス時: 「${userGreeting}期限切れタスクでプレッシャーを感じているかもしれませんね。まずは重要なタスクから取り組みましょう。」
`;

    // 新システム：リトライ付き生成
    const finalMessage = await generateWithRetry(
      model, 
      prompt, 
      MESSAGE_LIMITS.premium.target, 
      MESSAGE_LIMITS.premium.max
    );
    
    // 最終安全チェック
    const truncatedMessage = finalMessage || 'メッセージの生成に失敗しました。';

    return NextResponse.json({ message: truncatedMessage });
  } catch (error) {
    console.error('Gemini API error (Premium):', error);
    console.error('Gemini API key configured:', !!process.env.GEMINI_API_KEY);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    
    // フォールバック
    const fallbackMessage = userName 
      ? `${userName}さん、あなたのペースで大丈夫です。プレミアムメンバーとして、きっと目標を達成できますよ！`
      : 'あなたのペースで大丈夫です。プレミアムメンバーとして、きっと目標を達成できますよ！';
    return NextResponse.json({ message: fallbackMessage });
  }
} 