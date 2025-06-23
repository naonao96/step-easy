-- daily_messagesテーブルのRLSポリシー修正
-- 406エラーの根本的解決

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view own daily messages" ON daily_messages;
DROP POLICY IF EXISTS "System can insert daily messages" ON daily_messages;
DROP POLICY IF EXISTS "System can update daily messages" ON daily_messages;

-- 新しいポリシーを作成（より柔軟で安全）
-- ユーザーは自分のメッセージのみ閲覧可能（認証状態を適切にチェック）
CREATE POLICY "Users can view own daily messages" ON daily_messages
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    auth.uid() = user_id
  );

-- 認証済みユーザーは自分のメッセージを挿入可能
CREATE POLICY "Authenticated users can insert own daily messages" ON daily_messages
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = user_id
  );

-- 認証済みユーザーは自分のメッセージを更新可能
CREATE POLICY "Authenticated users can update own daily messages" ON daily_messages
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    auth.uid() = user_id
  ) WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = user_id
  );

-- システム（Service Role）は全操作可能
CREATE POLICY "Service role can manage all daily messages" ON daily_messages
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  ) WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- RLSが有効であることを確認
ALTER TABLE daily_messages ENABLE ROW LEVEL SECURITY;

-- インデックスの最適化（パフォーマンス向上）
-- 既存のインデックスがあれば削除して再作成
DROP INDEX IF EXISTS idx_daily_messages_user_date;
DROP INDEX IF EXISTS idx_daily_messages_date_type;
DROP INDEX IF EXISTS idx_daily_messages_generated_at;

-- 最適化されたインデックスを作成
CREATE INDEX idx_daily_messages_user_date_type ON daily_messages(user_id, message_date, scheduled_type);
CREATE INDEX idx_daily_messages_generated_at ON daily_messages(generated_at DESC);

-- コメント追加
COMMENT ON POLICY "Users can view own daily messages" ON daily_messages IS 'ユーザーは認証状態で自分のメッセージのみ閲覧可能';
COMMENT ON POLICY "Authenticated users can insert own daily messages" ON daily_messages IS '認証済みユーザーは自分のメッセージを挿入可能';
COMMENT ON POLICY "Authenticated users can update own daily messages" ON daily_messages IS '認証済みユーザーは自分のメッセージを更新可能';
COMMENT ON POLICY "Service role can manage all daily messages" ON daily_messages IS 'Service Roleは全メッセージを管理可能（Edge Function用）';

-- テスト用のビューを作成（デバッグ用）
CREATE OR REPLACE VIEW daily_messages_debug AS
SELECT 
  id,
  user_id,
  message_date,
  scheduled_type,
  user_type,
  user_name,
  LEFT(message, 50) || '...' as message_preview,
  generated_at,
  created_at,
  -- 現在のユーザーIDと比較
  auth.uid() as current_user_id,
  (auth.uid() = user_id) as is_owner
FROM daily_messages
WHERE auth.uid() IS NOT NULL;

COMMENT ON VIEW daily_messages_debug IS 'daily_messagesテーブルのデバッグ用ビュー（開発環境用）'; 