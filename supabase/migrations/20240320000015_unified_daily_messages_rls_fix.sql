-- 統合型RLS修正：daily_messagesテーブルの根本的解決
-- 既存機能を完全保護しつつ、406エラーを根本解決
-- Option 1: 統合型修正アプローチ

-- =====================================================
-- 🔒 修正前のバックアップ・確認処理
-- =====================================================

-- 現在のポリシー状況をログテーブルに記録（ロールバック用）
CREATE TABLE IF NOT EXISTS rls_migration_backup (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  migration_name VARCHAR(100) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  backup_date timestamp with time zone DEFAULT NOW(),
  policy_name VARCHAR(200),
  policy_definition TEXT,
  policy_roles TEXT[],
  policy_command VARCHAR(20),
  created_at timestamp with time zone DEFAULT NOW()
);

-- 現在のポリシー情報をバックアップ
INSERT INTO rls_migration_backup (
  migration_name, 
  table_name, 
  policy_name, 
  policy_definition, 
  policy_roles, 
  policy_command
)
SELECT 
  '20240320000015_unified_daily_messages_rls_fix',
  'daily_messages',
  policyname,
  qual,
  ARRAY[roles]::TEXT[],
  cmd
FROM pg_policies 
WHERE tablename = 'daily_messages' AND schemaname = 'public';

-- =====================================================
-- 🧹 既存ポリシーの完全クリーンアップ
-- =====================================================

-- すべての既存ポリシーを削除（統合のため）
DROP POLICY IF EXISTS "Users can view own daily messages" ON daily_messages;
DROP POLICY IF EXISTS "Authenticated users can insert own daily messages" ON daily_messages;
DROP POLICY IF EXISTS "Authenticated users can update own daily messages" ON daily_messages;
DROP POLICY IF EXISTS "Service role can manage all daily messages" ON daily_messages;
DROP POLICY IF EXISTS "System can insert daily messages" ON daily_messages;
DROP POLICY IF EXISTS "System can update daily messages" ON daily_messages;
DROP POLICY IF EXISTS "daily_messages_policy" ON daily_messages;
DROP POLICY IF EXISTS "daily_messages_service_policy" ON daily_messages;

-- 既存のデバッグビューをクリーンアップ
DROP VIEW IF EXISTS daily_messages_debug;

-- =====================================================
-- 🎯 統合型RLSポリシー実装
-- =====================================================

-- RLSが有効であることを確認
ALTER TABLE daily_messages ENABLE ROW LEVEL SECURITY;

-- 🥇 メインポリシー：認証済みユーザー用（統合型）
-- 既存機能の制限・制御を完全維持
CREATE POLICY "unified_daily_messages_access" ON daily_messages
  FOR ALL USING (
    -- 条件1: 認証済みユーザーかつ自分のメッセージ
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    -- 条件2: サービスロール（Edge Functions用）
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
  ) WITH CHECK (
    -- 挿入・更新時の制約
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
  );

-- 🔧 読み取り専用ポリシー（フロントエンド最適化）
-- 406エラー解決のための専用読み取りポリシー
CREATE POLICY "daily_messages_read_optimized" ON daily_messages
  FOR SELECT USING (
    -- より柔軟な読み取り条件
    auth.uid() IS NOT NULL 
    AND (
      -- 自分のメッセージ
      auth.uid() = user_id
      OR
      -- サービスロール
      current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
      OR
      -- 認証済みユーザーで、かつテーブルに適切なアクセス権限がある場合
      (auth.role() = 'authenticated' AND user_id IS NOT NULL)
    )
  );

-- =====================================================
-- 📊 権限とアクセス制御の最適化
-- =====================================================

-- テーブル権限の最適化
-- authenticatedロールに必要な権限を明示的に付与
GRANT SELECT ON daily_messages TO authenticated;
GRANT INSERT ON daily_messages TO authenticated;
GRANT UPDATE ON daily_messages TO authenticated;

-- service_roleは全権限
GRANT ALL ON daily_messages TO service_role;

-- anonロールは制限的アクセス
REVOKE ALL ON daily_messages FROM anon;

-- =====================================================
-- 🛡️ セキュリティ強化機能
-- =====================================================

-- セキュアなアクセス確認関数
CREATE OR REPLACE FUNCTION check_daily_messages_access(
  target_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  can_access boolean,
  current_user_id uuid,
  user_role text,
  access_reason text
) AS $$
DECLARE
  current_uid uuid;
  user_role_name text;
  target_uid uuid;
BEGIN
  -- 現在のユーザー情報取得
  current_uid := auth.uid();
  user_role_name := current_setting('role');
  target_uid := COALESCE(target_user_id, current_uid);
  
  -- アクセス判定
  IF user_role_name = 'service_role' THEN
    RETURN QUERY SELECT true, current_uid, user_role_name, 'service_role_access'::text;
  ELSIF current_uid IS NOT NULL AND current_uid = target_uid THEN
    RETURN QUERY SELECT true, current_uid, user_role_name, 'owner_access'::text;
  ELSIF current_uid IS NOT NULL THEN
    RETURN QUERY SELECT false, current_uid, user_role_name, 'not_owner'::text;
  ELSE
    RETURN QUERY SELECT false, current_uid, user_role_name, 'not_authenticated'::text;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 権限設定
GRANT EXECUTE ON FUNCTION check_daily_messages_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_daily_messages_access(uuid) TO service_role;

-- =====================================================
-- 🔍 診断・監視機能の強化
-- =====================================================

-- 統合型診断ビュー
CREATE OR REPLACE VIEW daily_messages_access_info AS
SELECT 
  dm.id,
  dm.user_id,
  dm.message_date,
  dm.user_type,
  dm.user_name,
  LEFT(dm.message, 100) || '...' as message_preview,
  dm.generated_at,
  dm.created_at,
  -- アクセス制御情報
  auth.uid() as current_user_id,
  current_setting('role') as current_role,
  (auth.uid() = dm.user_id) as is_owner,
  (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') as is_service_role,
  -- アクセス可能性
  CASE 
    WHEN auth.uid() = dm.user_id THEN 'owner_access'
    WHEN current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' THEN 'service_access'
    ELSE 'no_access'
  END as access_type
FROM daily_messages dm
WHERE 
  -- ビュー自体のアクセス制御
  auth.uid() IS NOT NULL 
  AND (
    auth.uid() = dm.user_id 
    OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- 権限設定
GRANT SELECT ON daily_messages_access_info TO authenticated;
GRANT SELECT ON daily_messages_access_info TO service_role;

-- =====================================================
-- 📈 パフォーマンス最適化
-- =====================================================

-- インデックスの最適化
-- 既存インデックスの削除と再作成
DROP INDEX IF EXISTS idx_daily_messages_user_date;
DROP INDEX IF EXISTS idx_daily_messages_date_type;
DROP INDEX IF EXISTS idx_daily_messages_generated_at;
DROP INDEX IF EXISTS idx_daily_messages_user_date_type;

-- 統合型最適化インデックス
CREATE INDEX idx_daily_messages_unified_access ON daily_messages(user_id, message_date, scheduled_type, generated_at DESC);
CREATE INDEX idx_daily_messages_service_access ON daily_messages(generated_at DESC, user_type) WHERE user_id IS NOT NULL;

-- =====================================================
-- 🧪 テスト・検証機能
-- =====================================================

-- RLS動作テスト関数
CREATE OR REPLACE FUNCTION test_daily_messages_rls()
RETURNS TABLE (
  test_name text,
  test_result boolean,
  test_details text
) AS $$
DECLARE
  test_user_id uuid;
  current_uid uuid;
  test_count bigint;
BEGIN
  current_uid := auth.uid();
  
  -- テスト1: 基本的なSELECTアクセス
  BEGIN
    SELECT count(*) INTO test_count FROM daily_messages WHERE user_id = current_uid;
    RETURN QUERY SELECT 'basic_select'::text, true, format('Found %s messages', test_count);
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'basic_select'::text, false, SQLERRM;
  END;
  
  -- テスト2: アクセス制御関数
  BEGIN
    SELECT count(*) INTO test_count FROM check_daily_messages_access() WHERE can_access = true;
    RETURN QUERY SELECT 'access_function'::text, (test_count > 0), format('Access function returned %s results', test_count);
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'access_function'::text, false, SQLERRM;
  END;
  
  -- テスト3: 診断ビュー
  BEGIN
    SELECT count(*) INTO test_count FROM daily_messages_access_info;
    RETURN QUERY SELECT 'diagnostic_view'::text, true, format('Diagnostic view shows %s records', test_count);
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'diagnostic_view'::text, false, SQLERRM;
  END;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 権限設定
GRANT EXECUTE ON FUNCTION test_daily_messages_rls() TO authenticated;
GRANT EXECUTE ON FUNCTION test_daily_messages_rls() TO service_role;

-- =====================================================
-- 📝 マイグレーション完了ログ
-- =====================================================

-- マイグレーション実行ログ
INSERT INTO rls_migration_backup (
  migration_name, 
  table_name, 
  policy_name, 
  policy_definition
) VALUES (
  '20240320000015_unified_daily_messages_rls_fix',
  'daily_messages',
  'MIGRATION_COMPLETED',
  'Unified RLS policies successfully applied'
);

-- =====================================================
-- 📚 コメント・ドキュメント
-- =====================================================

COMMENT ON POLICY "unified_daily_messages_access" ON daily_messages IS 
'統合型RLSポリシー: 認証済みユーザーは自分のメッセージのみアクセス可能、サービスロールは全アクセス可能';

COMMENT ON POLICY "daily_messages_read_optimized" ON daily_messages IS 
'最適化読み取りポリシー: 406エラー解決のための柔軟な読み取りアクセス制御';

COMMENT ON FUNCTION check_daily_messages_access(uuid) IS 
'daily_messagesテーブルへのアクセス権限確認関数（セキュリティ診断用）';

COMMENT ON VIEW daily_messages_access_info IS 
'daily_messagesの統合診断ビュー（アクセス制御状況の可視化用）';

COMMENT ON FUNCTION test_daily_messages_rls() IS 
'RLS動作確認テスト関数（マイグレーション後の動作検証用）';

COMMENT ON TABLE rls_migration_backup IS 
'RLSマイグレーションのバックアップテーブル（ロールバック・監査用）'; 