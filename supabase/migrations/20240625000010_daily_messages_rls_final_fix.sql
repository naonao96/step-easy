-- daily_messagesテーブルRLS最終修正（統合版）
-- 既存の複雑なポリシーをすべて削除し、シンプルで確実な設定に統一
-- 401 Unauthorized エラーの根本解決

-- =====================================================
-- 🧹 完全クリーンアップ
-- =====================================================

-- 既存のすべてのポリシーを削除
DROP POLICY IF EXISTS "Users can view own daily messages" ON daily_messages;
DROP POLICY IF EXISTS "Authenticated users can insert own daily messages" ON daily_messages;
DROP POLICY IF EXISTS "Authenticated users can update own daily messages" ON daily_messages;
DROP POLICY IF EXISTS "Service role can manage all daily messages" ON daily_messages;
DROP POLICY IF EXISTS "System can insert daily messages" ON daily_messages;
DROP POLICY IF EXISTS "System can update daily messages" ON daily_messages;
DROP POLICY IF EXISTS "daily_messages_policy" ON daily_messages;
DROP POLICY IF EXISTS "daily_messages_service_policy" ON daily_messages;
DROP POLICY IF EXISTS "unified_daily_messages_access" ON daily_messages;
DROP POLICY IF EXISTS "daily_messages_read_optimized" ON daily_messages;
DROP POLICY IF EXISTS "daily_messages_select" ON daily_messages;
DROP POLICY IF EXISTS "daily_messages_insert" ON daily_messages;
DROP POLICY IF EXISTS "daily_messages_service_all" ON daily_messages;

-- 既存の複雑なビューと関数を削除
DROP VIEW IF EXISTS daily_messages_debug;
DROP VIEW IF EXISTS daily_messages_access_info;
DROP FUNCTION IF EXISTS debug_daily_messages_access();
DROP FUNCTION IF EXISTS debug_table_permissions();
DROP FUNCTION IF EXISTS check_daily_messages_access(uuid);
DROP FUNCTION IF EXISTS test_daily_messages_rls();

-- バックアップテーブルも削除（不要な複雑性）
DROP TABLE IF EXISTS rls_migration_backup;

-- =====================================================
-- 🎯 シンプル統合ポリシー（修正版）
-- =====================================================

-- RLS有効化
ALTER TABLE daily_messages ENABLE ROW LEVEL SECURITY;

-- 🥇 メインポリシー（読み取り専用）- authenticatedロールに明示的に適用
CREATE POLICY "daily_messages_authenticated_select" ON daily_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 🥈 挿入ポリシー（Edge Function用）- service_roleに明示的に適用
CREATE POLICY "daily_messages_service_insert" ON daily_messages
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 🥉 サービスロール全権限
CREATE POLICY "daily_messages_service_all" ON daily_messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 📊 権限設定（修正版）
-- =====================================================

-- 認証済みユーザーに読み取り権限
GRANT SELECT ON daily_messages TO authenticated;

-- サービスロールに全権限
GRANT ALL ON daily_messages TO service_role;

-- publicロールには権限を与えない（セキュリティ向上）
REVOKE ALL ON daily_messages FROM public;

-- =====================================================
-- 📈 パフォーマンス最適化
-- =====================================================

-- 必要最小限のインデックス
CREATE INDEX IF NOT EXISTS idx_daily_messages_user_date_type 
ON daily_messages(user_id, message_date, scheduled_type);

CREATE INDEX IF NOT EXISTS idx_daily_messages_user_id 
ON daily_messages(user_id);

-- =====================================================
-- 📝 コメント（修正版）
-- =====================================================

COMMENT ON POLICY "daily_messages_authenticated_select" ON daily_messages IS 
'認証済みユーザーは自分のメッセージのみ閲覧可能（401エラー解決）';

COMMENT ON POLICY "daily_messages_service_insert" ON daily_messages IS 
'サービスロール（Edge Function）のみメッセージ挿入可能';

COMMENT ON POLICY "daily_messages_service_all" ON daily_messages IS 
'サービスロールは全操作可能（管理・テスト用）';

-- =====================================================
-- ✅ 修正完了確認
-- =====================================================

-- ポリシーが正しく作成されたか確認
DO $$
DECLARE
  policy_count INTEGER;
  policy_record RECORD;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'daily_messages';
  
  RAISE NOTICE 'Created % policies for daily_messages table', policy_count;
  
  -- 各ポリシーの詳細を表示
  RAISE NOTICE 'Policy details:';
  FOR policy_record IN 
    SELECT policyname, roles, cmd, qual 
    FROM pg_policies 
    WHERE tablename = 'daily_messages'
  LOOP
    RAISE NOTICE 'Policy: %, Roles: %, Command: %, Condition: %', 
      policy_record.policyname, 
      policy_record.roles, 
      policy_record.cmd, 
      policy_record.qual;
  END LOOP;
END $$; 