import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// サーバーサイド用のクライアント
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// クライアント作成関数をエクスポート
export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}

// クライアントサイド用シングルトン
let supabaseClientComponent: ReturnType<typeof createClientComponentClient> | null = null;
export function getSupabaseClient() {
  if (!supabaseClientComponent) {
    supabaseClientComponent = createClientComponentClient();
  }
  return supabaseClientComponent;
}

export type User = {
  id: string;
  email: string;
  displayName: string;
  bio?: string;
  avatar_url?: string;
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