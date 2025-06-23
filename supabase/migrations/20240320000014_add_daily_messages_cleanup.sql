-- daily_messagesテーブルの無料ユーザー30日削除処理
-- 無料ユーザーのプライバシーポリシー準拠（30日保存期間）

-- 無料ユーザーの期限切れメッセージ削除用Cron Job
SELECT cron.schedule(
  'cleanup-expired-daily-messages',
  '0 2 * * *',  -- 毎日午前2時に実行
  $$
  DELETE FROM daily_messages 
  WHERE user_type = 'free' 
    AND created_at < NOW() - INTERVAL '30 days';
  $$
);

-- ゲストユーザーのメッセージも削除（念のため、通常は生成されないが）
SELECT cron.schedule(
  'cleanup-guest-daily-messages',
  '0 2 * * *',  -- 毎日午前2時に実行
  $$
  DELETE FROM daily_messages 
  WHERE user_type = 'guest' 
    AND created_at < NOW() - INTERVAL '1 day';
  $$
);

-- プレミアムユーザーは無制限保存なので削除処理なし

-- 手動実行用の関数も作成（デバッグ・メンテナンス用）
CREATE OR REPLACE FUNCTION cleanup_expired_daily_messages()
RETURNS TABLE (
  deleted_free_count bigint,
  deleted_guest_count bigint,
  cleanup_date timestamp with time zone
) AS $$
DECLARE
  free_deleted bigint;
  guest_deleted bigint;
BEGIN
  -- 無料ユーザーの30日経過メッセージを削除
  DELETE FROM daily_messages 
  WHERE user_type = 'free' 
    AND created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS free_deleted = ROW_COUNT;
  
  -- ゲストユーザーの1日経過メッセージを削除
  DELETE FROM daily_messages 
  WHERE user_type = 'guest' 
    AND created_at < NOW() - INTERVAL '1 day';
  
  GET DIAGNOSTICS guest_deleted = ROW_COUNT;
  
  -- 結果を返す
  RETURN QUERY SELECT free_deleted, guest_deleted, NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 権限設定（管理者のみ実行可能）
GRANT EXECUTE ON FUNCTION cleanup_expired_daily_messages() TO authenticated;

-- コメント追加
COMMENT ON FUNCTION cleanup_expired_daily_messages() IS '期限切れdaily_messagesの手動削除関数（無料ユーザー30日、ゲストユーザー1日）';

-- 削除処理のログ記録用テーブル（オプション）
CREATE TABLE IF NOT EXISTS daily_messages_cleanup_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cleanup_date timestamp with time zone DEFAULT NOW(),
  deleted_free_count bigint DEFAULT 0,
  deleted_guest_count bigint DEFAULT 0,
  execution_type varchar(20) DEFAULT 'auto', -- 'auto' | 'manual'
  created_at timestamp with time zone DEFAULT NOW()
);

-- ログテーブルのRLS設定
ALTER TABLE daily_messages_cleanup_log ENABLE ROW LEVEL SECURITY;

-- 管理者のみアクセス可能
CREATE POLICY "Admin can view cleanup logs" ON daily_messages_cleanup_log
  FOR SELECT USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- インデックス作成
CREATE INDEX idx_daily_messages_cleanup_log_date ON daily_messages_cleanup_log(cleanup_date);

-- 拡張された削除関数（ログ記録付き）
CREATE OR REPLACE FUNCTION cleanup_expired_daily_messages_with_log(execution_type text DEFAULT 'manual')
RETURNS TABLE (
  deleted_free_count bigint,
  deleted_guest_count bigint,
  cleanup_date timestamp with time zone
) AS $$
DECLARE
  free_deleted bigint;
  guest_deleted bigint;
  cleanup_time timestamp with time zone;
BEGIN
  cleanup_time := NOW();
  
  -- 無料ユーザーの30日経過メッセージを削除
  DELETE FROM daily_messages 
  WHERE user_type = 'free' 
    AND created_at < cleanup_time - INTERVAL '30 days';
  
  GET DIAGNOSTICS free_deleted = ROW_COUNT;
  
  -- ゲストユーザーの1日経過メッセージを削除
  DELETE FROM daily_messages 
  WHERE user_type = 'guest' 
    AND created_at < cleanup_time - INTERVAL '1 day';
  
  GET DIAGNOSTICS guest_deleted = ROW_COUNT;
  
  -- ログに記録
  INSERT INTO daily_messages_cleanup_log (
    cleanup_date, 
    deleted_free_count, 
    deleted_guest_count, 
    execution_type
  ) VALUES (
    cleanup_time, 
    free_deleted, 
    guest_deleted, 
    execution_type
  );
  
  -- 結果を返す
  RETURN QUERY SELECT free_deleted, guest_deleted, cleanup_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 権限設定
GRANT EXECUTE ON FUNCTION cleanup_expired_daily_messages_with_log(text) TO authenticated;

-- Cron Jobの更新（ログ記録付き）
SELECT cron.unschedule('cleanup-expired-daily-messages');
SELECT cron.unschedule('cleanup-guest-daily-messages');

-- 統合されたCron Job（ログ記録付き）
SELECT cron.schedule(
  'cleanup-expired-daily-messages-with-log',
  '0 2 * * *',  -- 毎日午前2時に実行
  $$
  SELECT cleanup_expired_daily_messages_with_log('auto');
  $$
);

-- コメント追加
COMMENT ON TABLE daily_messages_cleanup_log IS 'daily_messagesの削除処理ログ（管理・監査用）'; 