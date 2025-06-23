-- daily_messagesテーブルのRLS診断と修正
-- 406エラーの詳細調査

-- 現在のポリシー状態を確認するための診断クエリ
-- （実際の診断はSupabase Dashboardで実行）

-- 1. 現在のRLS設定を確認
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'daily_messages';

-- 2. 現在のポリシーを確認
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies WHERE tablename = 'daily_messages';

-- 3. 現在のユーザー権限を確認
-- SELECT auth.uid(), auth.role();

-- 既存のポリシーを完全に削除
DROP POLICY IF EXISTS "Users can view own daily messages" ON daily_messages;
DROP POLICY IF EXISTS "Authenticated users can insert own daily messages" ON daily_messages;
DROP POLICY IF EXISTS "Authenticated users can update own daily messages" ON daily_messages;
DROP POLICY IF EXISTS "Service role can manage all daily messages" ON daily_messages;
DROP POLICY IF EXISTS "System can insert daily messages" ON daily_messages;
DROP POLICY IF EXISTS "System can update daily messages" ON daily_messages;

-- RLSを一時的に無効化
ALTER TABLE daily_messages DISABLE ROW LEVEL SECURITY;

-- RLSを再度有効化
ALTER TABLE daily_messages ENABLE ROW LEVEL SECURITY;

-- 最もシンプルで確実なポリシーを作成
-- 認証済みユーザーは自分のメッセージのみアクセス可能
CREATE POLICY "daily_messages_policy" ON daily_messages
  FOR ALL USING (
    auth.uid() = user_id
  ) WITH CHECK (
    auth.uid() = user_id
  );

-- サービスロール用のポリシー（Edge Functions用）
CREATE POLICY "daily_messages_service_policy" ON daily_messages
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role'
  ) WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- テーブル権限の確認と設定
-- authenticatedロールに必要な権限を付与
GRANT SELECT, INSERT, UPDATE ON daily_messages TO authenticated;
-- UUID型のidカラムなので、シーケンス権限は不要

-- anonロールには最小限の権限のみ
GRANT SELECT ON daily_messages TO anon;

-- コメント追加
COMMENT ON POLICY "daily_messages_policy" ON daily_messages IS 'シンプルなRLSポリシー：認証済みユーザーは自分のメッセージのみアクセス可能';
COMMENT ON POLICY "daily_messages_service_policy" ON daily_messages IS 'サービスロール用ポリシー：Edge Functions用';

-- 診断用のファンクション作成
CREATE OR REPLACE FUNCTION debug_daily_messages_access()
RETURNS TABLE (
  current_user_id uuid,
  user_role text,
  rls_enabled boolean,
  policy_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as current_user_id,
    current_setting('role') as user_role,
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'daily_messages' AND schemaname = 'public') as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE tablename = 'daily_messages' AND schemaname = 'public') as policy_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 権限設定
GRANT EXECUTE ON FUNCTION debug_daily_messages_access() TO authenticated;
GRANT EXECUTE ON FUNCTION debug_daily_messages_access() TO anon;

-- 追加の診断用ファンクション：テーブル権限確認
CREATE OR REPLACE FUNCTION debug_table_permissions()
RETURNS TABLE (
  table_name text,
  grantee text,
  privilege_type text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::text,
    t.grantee::text,
    t.privilege_type::text
  FROM information_schema.table_privileges t
  WHERE t.table_name = 'daily_messages'
    AND t.table_schema = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION debug_table_permissions() TO authenticated;
GRANT EXECUTE ON FUNCTION debug_table_permissions() TO anon; 