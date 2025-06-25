-- daily_messagesのCronJob設定修正
-- 既存の不完全なCronJobを削除し、正しい設定で再作成

-- =====================================================
-- 🧹 既存CronJobのクリーンアップ
-- =====================================================

-- 既存のCronJobを削除（複数の名前で登録されている可能性があるため）
-- 既存のCronJobを削除（存在するもののみ）
-- エラー回避のため、存在確認してから削除
DO $$
BEGIN
  -- generate-daily-messages ジョブを削除（元のマイグレーションで作成）
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-daily-messages') THEN
    PERFORM cron.unschedule('generate-daily-messages');
    RAISE NOTICE 'Unscheduled job: generate-daily-messages';
  END IF;
  
  -- generate-daily-messages-fixed ジョブを削除（存在する場合）
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-daily-messages-fixed') THEN
    PERFORM cron.unschedule('generate-daily-messages-fixed');
    RAISE NOTICE 'Unscheduled job: generate-daily-messages-fixed';
  END IF;
  
  -- generate-daily-messages-v2 ジョブを削除（重複回避）
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-daily-messages-v2') THEN
    PERFORM cron.unschedule('generate-daily-messages-v2');
    RAISE NOTICE 'Unscheduled job: generate-daily-messages-v2';
  END IF;
END $$;

-- =====================================================
-- ⏰ 新しいCronJob設定
-- =====================================================

-- 毎日午前9時（JST）= UTC 0時にEdge Functionを呼び出し
SELECT cron.schedule(
  'generate-daily-messages-v2',
  '0 0 * * *', -- 毎日UTC 0時 = JST 9時
  $$
  SELECT
    net.http_post(
      url := 'https://vcqumdrbalivowxggvmv.supabase.co/functions/v1/generate-daily-messages',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'scheduled', true,
        'trigger_time', now()
      )
    ) as request_id;
  $$
);

-- =====================================================
-- 📊 CronJob状態確認用ビュー
-- =====================================================

-- CronJobの実行状況を確認するためのビュー
CREATE OR REPLACE VIEW cron_job_status AS
SELECT 
  jobname,
  schedule,
  active,
  jobid,
  database,
  username,
  command
FROM cron.job
WHERE jobname LIKE '%daily-messages%' OR jobname LIKE '%generate-daily-messages%';

-- 権限設定
GRANT SELECT ON cron_job_status TO service_role;

-- =====================================================
-- 📝 コメント・ドキュメント
-- =====================================================

COMMENT ON VIEW cron_job_status IS 
'daily_messages関連のCronJob実行状況を確認するためのビュー';

-- CronJob設定の説明
-- 実行時間: 毎日UTC 0時 (JST 9時)
-- 対象: 全ての認証済みユーザー
-- 処理: Gemini APIを使用してパーソナライズされたメッセージを生成
-- 保存先: daily_messagesテーブル 