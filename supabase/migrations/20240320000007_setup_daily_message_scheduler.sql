-- pg_cron拡張を有効化（Supabaseで自動的に有効になっている場合がある）
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 毎朝9時（JST）にdaily message生成を実行
-- SupabaseのデフォルトタイムゾーンはUTCなので、JST 9:00 = UTC 0:00
SELECT cron.schedule(
  'generate-daily-messages',           -- ジョブ名
  '0 0 * * *',                        -- 毎日UTC 0:00 (JST 9:00)
  $$
  SELECT
    net.http_post(
      url := 'https://your-project-ref.supabase.co/functions/v1/generate-daily-messages',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- ジョブの確認用ビュー作成
CREATE OR REPLACE VIEW daily_message_job_status AS
SELECT 
  jobname,
  schedule,
  active,
  jobid
FROM cron.job 
WHERE jobname = 'generate-daily-messages';

-- 手動実行用の関数も作成（テスト用）
CREATE OR REPLACE FUNCTION trigger_daily_message_generation()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response_id BIGINT;
BEGIN
  SELECT 
    net.http_post(
      url := 'https://your-project-ref.supabase.co/functions/v1/generate-daily-messages',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body := '{}'::jsonb
    ) INTO response_id;
  
  RETURN 'Daily message generation triggered with request ID: ' || response_id;
END;
$$;

-- コメント
COMMENT ON FUNCTION trigger_daily_message_generation() IS '手動でdaily message生成をトリガーする関数（テスト用）';

-- 実行例：
-- SELECT trigger_daily_message_generation(); 