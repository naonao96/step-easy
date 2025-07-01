// AIメッセージ生成用の共通プロンプト設定
export interface PromptConfig {
  maxLength: number;
  includeExecutionData: boolean;
  includeWeather: boolean;
  includeSeasonal: boolean;
  tone: 'friendly' | 'premium';
}

// 無料版プロンプト設定
export const FREE_PROMPT_CONFIG: PromptConfig = {
  maxLength: 100,
  includeExecutionData: false,
  includeWeather: true,
  includeSeasonal: true,
  tone: 'friendly'
};

// プレミアム版プロンプト設定
export const PREMIUM_PROMPT_CONFIG: PromptConfig = {
  maxLength: 200,
  includeExecutionData: true,
  includeWeather: true,
  includeSeasonal: true,
  tone: 'premium'
};

// 基本プロンプトテンプレート
export const BASE_PROMPT_TEMPLATE = `
あなたは優しいタスク管理アプリのキャラクターです。
今日は{{today}}です。
{{userName}}さんに向けて、今日一日のモチベーションを上げるメッセージを生成してください。

ユーザーの基本情報：
- お名前: {{userName}}さん
- 最近のタスク完了率: {{recentCompletionRate}}%（最新{{totalCount}}個中{{completedCount}}個完了）
- 今日のタスク状況: {{todayTotal}}個中{{todayCompleted}}個完了
- タスク管理の傾向: {{taskManagementTendency}}

{{#if executionData}}
実行データ分析：
{{executionData}}
{{/if}}

【重要】以下の条件でメッセージを生成してください：
- 必ず{{maxLength}}文字以内（絶対条件）
- {{tone}}な口調
- 「{{userName}}さん」という呼びかけを自然に含める
- 進捗状況を反映した励まし
{{#if includeWeather}}- 今日の天気や季節感を含める{{/if}}
- タスク管理へのモチベーションを上げる内容
- 絵文字は使わない
- プレッシャーを与えず、優しく寄り添う内容
- 鳥風なしゃべり口調でお願いします
`;

// 無料版プロンプト生成
export function generateFreePrompt(data: {
  today: string;
  userName: string;
  recentCompletionRate: number;
  totalCount: number;
  completedCount: number;
  todayTotal: number;
  todayCompleted: number;
  taskManagementTendency: string;
}): string {
  return BASE_PROMPT_TEMPLATE
    .replace(/{{today}}/g, data.today)
    .replace(/{{userName}}/g, data.userName)
    .replace(/{{recentCompletionRate}}/g, data.recentCompletionRate.toString())
    .replace(/{{totalCount}}/g, data.totalCount.toString())
    .replace(/{{completedCount}}/g, data.completedCount.toString())
    .replace(/{{todayTotal}}/g, data.todayTotal.toString())
    .replace(/{{todayCompleted}}/g, data.todayCompleted.toString())
    .replace(/{{taskManagementTendency}}/g, data.taskManagementTendency)
    .replace(/{{maxLength}}/g, FREE_PROMPT_CONFIG.maxLength.toString())
    .replace(/{{tone}}/g, FREE_PROMPT_CONFIG.tone)
    .replace(/{{#if includeWeather}}.*?{{/if}}/gs, FREE_PROMPT_CONFIG.includeWeather ? '$&' : '')
    .replace(/{{#if executionData}}.*?{{/if}}/gs, '');
}

// プレミアム版プロンプト生成
export function generatePremiumPrompt(data: {
  today: string;
  userName: string;
  recentCompletionRate: number;
  totalCount: number;
  completedCount: number;
  todayTotal: number;
  todayCompleted: number;
  taskManagementTendency: string;
  executionData?: string;
}): string {
  let prompt = BASE_PROMPT_TEMPLATE
    .replace(/{{today}}/g, data.today)
    .replace(/{{userName}}/g, data.userName)
    .replace(/{{recentCompletionRate}}/g, data.recentCompletionRate.toString())
    .replace(/{{totalCount}}/g, data.totalCount.toString())
    .replace(/{{completedCount}}/g, data.completedCount.toString())
    .replace(/{{todayTotal}}/g, data.todayTotal.toString())
    .replace(/{{todayCompleted}}/g, data.todayCompleted.toString())
    .replace(/{{taskManagementTendency}}/g, data.taskManagementTendency)
    .replace(/{{maxLength}}/g, PREMIUM_PROMPT_CONFIG.maxLength.toString())
    .replace(/{{tone}}/g, PREMIUM_PROMPT_CONFIG.tone)
    .replace(/{{#if includeWeather}}.*?{{/if}}/gs, PREMIUM_PROMPT_CONFIG.includeWeather ? '$&' : '');

  // 実行データの処理
  if (data.executionData) {
    prompt = prompt.replace(/{{#if executionData}}(.*?){{/if}}/gs, '$1')
                   .replace(/{{executionData}}/g, data.executionData);
  } else {
    prompt = prompt.replace(/{{#if executionData}}.*?{{/if}}/gs, '');
  }

  return prompt;
} 