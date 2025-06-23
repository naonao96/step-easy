-- ロールバック用マイグレーション：統合型RLS修正の復旧
-- 万が一、統合型修正で問題が発生した場合の緊急復旧用
-- このファイルは通常実行しませんが、緊急時の備えとして準備

-- =====================================================
-- ⚠️ 警告：このマイグレーションは緊急時のみ実行
-- =====================================================

-- 実行前に必ず確認してください：
-- 1. 本当にロールバックが必要ですか？
-- 2. バックアップデータは確認済みですか？
-- 3. 他のシステムへの影響を検討しましたか？

-- 実行を防ぐための安全装置（コメントアウトして実行）
-- DO $$ BEGIN RAISE EXCEPTION 'This is a rollback migration. Uncomment this check only if rollback is absolutely necessary.'; END $$;

-- =====================================================
-- 🔄 統合型ポリシーの削除
-- =====================================================

-- 統合型で作成したポリシーを削除
DROP POLICY IF EXISTS "unified_daily_messages_access" ON daily_messages;
DROP POLICY IF EXISTS "daily_messages_read_optimized" ON daily_messages;

-- 統合型で作成したビューと関数を削除
DROP VIEW IF EXISTS daily_messages_access_info;
DROP FUNCTION IF EXISTS check_daily_messages_access(uuid);
DROP FUNCTION IF EXISTS test_daily_messages_rls();

-- 統合型で作成したインデックスを削除
DROP INDEX IF EXISTS idx_daily_messages_unified_access;
DROP INDEX IF EXISTS idx_daily_messages_service_access;

-- =====================================================
-- 🔙 前回の安定したポリシーに復元
-- =====================================================

-- RLSが有効であることを確認
ALTER TABLE daily_messages ENABLE ROW LEVEL SECURITY;

-- シンプルで確実なポリシーに戻す（migration 13ベース）
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

-- =====================================================
-- 🔧 基本権限の復元
-- =====================================================

-- テーブル権限の設定
GRANT SELECT, INSERT, UPDATE ON daily_messages TO authenticated;
GRANT SELECT ON daily_messages TO anon;

-- =====================================================
-- 📊 基本インデックスの復元
-- =====================================================

-- 基本的なインデックスを再作成
CREATE INDEX idx_daily_messages_user_date_type ON daily_messages(user_id, message_date, scheduled_type);
CREATE INDEX idx_daily_messages_generated_at ON daily_messages(generated_at DESC);

-- =====================================================
-- 🗒️ ロールバック記録
-- =====================================================

-- ロールバック実行をログに記録
INSERT INTO rls_migration_backup (
  migration_name, 
  table_name, 
  policy_name, 
  policy_definition
) VALUES (
  '20240320000016_rollback_unified_rls_if_needed',
  'daily_messages',
  'ROLLBACK_EXECUTED',
  'Unified RLS policies rolled back to simple policies'
);

-- =====================================================
-- 📚 コメント
-- =====================================================

COMMENT ON POLICY "daily_messages_policy" ON daily_messages IS 
'ロールバック後のシンプルポリシー: 認証済みユーザーは自分のメッセージのみアクセス可能';

COMMENT ON POLICY "daily_messages_service_policy" ON daily_messages IS 
'ロールバック後のサービスロール用ポリシー: Edge Functions用';

-- =====================================================
-- 🔍 ロールバック後の動作確認関数
-- =====================================================

-- 基本的な動作確認関数
CREATE OR REPLACE FUNCTION verify_rollback_success()
RETURNS TABLE (
  check_name text,
  check_result boolean,
  check_details text
) AS $$
DECLARE
  policy_count bigint;
  access_test_count bigint;
BEGIN
  -- ポリシー数の確認
  SELECT count(*) INTO policy_count 
  FROM pg_policies 
  WHERE tablename = 'daily_messages' AND schemaname = 'public';
  
  RETURN QUERY SELECT 
    'policy_count'::text, 
    (policy_count = 2), 
    format('Found %s policies (expected 2)', policy_count);
  
  -- 基本アクセステスト
  BEGIN
    SELECT count(*) INTO access_test_count FROM daily_messages WHERE user_id = auth.uid();
    RETURN QUERY SELECT 
      'basic_access'::text, 
      true, 
      format('Basic access test successful, found %s records', access_test_count);
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
      'basic_access'::text, 
      false, 
      format('Basic access test failed: %s', SQLERRM);
  END;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 権限設定
GRANT EXECUTE ON FUNCTION verify_rollback_success() TO authenticated;
GRANT EXECUTE ON FUNCTION verify_rollback_success() TO service_role;

COMMENT ON FUNCTION verify_rollback_success() IS 
'ロールバック後の動作確認関数（基本アクセステスト用）'; 