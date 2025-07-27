import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// 型定義専用ファイル
// クライアントサイドでは createClientComponentClient() を使用してください

// サーバーサイド用のクライアント作成関数
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}

export type User = {
  id: string;
  email: string;
  display_name: string;
  displayName?: string; // 後方互換性のため
  bio?: string;
  avatar_url?: string;
  character_name?: string;
  plan_type?: string;
  notification_settings?: any;
  onboarding_completed_at?: string;
  created_at: string;
  updated_at: string;
};

export type UserSettings = {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  task_reminders: boolean;
  habit_reminders: boolean;
  ai_suggestions: boolean;
  theme: 'light' | 'dark' | 'system';
  font_size: 'small' | 'medium' | 'large';
  compact_mode: boolean;
  created_at: string;
  updated_at: string;
}; 