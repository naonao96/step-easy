-- 本番環境へのデータインポートスクリプト
-- 実行前に本番環境のバックアップを取得してください

-- =====================================================
-- 🚨 重要: 実行前の確認事項
-- =====================================================

-- 1. 本番環境のバックアップが取得されているか確認
-- 2. 開発環境からエクスポートしたCSVファイルが準備されているか確認
-- 3. 本番環境のテーブル構造が開発環境と一致しているか確認
-- 4. データの整合性チェックが完了しているか確認

-- =====================================================
-- 📊 データインポート（本番環境用）
-- =====================================================

-- 1. ユーザー設定データのインポート
-- 注意: user_idは本番環境の実際のユーザーIDにマッピングが必要
COPY user_settings (
  user_id,
  display_name,
  plan_type,
  notification_enabled,
  theme,
  created_at,
  updated_at
) FROM '/tmp/user_settings_export.csv' WITH CSV HEADER;

-- 2. タスクデータのインポート
-- 注意: user_idとtask_idのマッピングが必要
COPY tasks (
  id,
  user_id,
  title,
  description,
  status,
  priority,
  due_date,
  completed_at,
  is_habit,
  habit_frequency,
  streak_count,
  created_at,
  updated_at
) FROM '/tmp/tasks_export.csv' WITH CSV HEADER;

-- 3. 日次メッセージデータのインポート
-- 注意: user_idのマッピングが必要
COPY daily_messages (
  id,
  user_id,
  message_date,
  scheduled_type,
  user_type,
  user_name,
  message,
  stats_today_completed,
  stats_today_total,
  stats_today_percentage,
  stats_overall_percentage,
  created_at,
  generated_at
) FROM '/tmp/daily_messages_export.csv' WITH CSV HEADER;

-- 4. 実行履歴データのインポート
-- 注意: user_idとtask_idのマッピングが必要
COPY execution_logs (
  id,
  user_id,
  task_id,
  start_time,
  end_time,
  duration,
  device_type,
  session_type,
  is_completed,
  created_at,
  updated_at
) FROM '/tmp/execution_logs_export.csv' WITH CSV HEADER;

-- 5. アクティブ実行データのインポート
-- 注意: user_idとtask_idのマッピングが必要
COPY active_executions (
  id,
  user_id,
  task_id,
  start_time,
  device_type,
  is_paused,
  accumulated_time,
  created_at,
  updated_at
) FROM '/tmp/active_executions_export.csv' WITH CSV HEADER;

-- =====================================================
-- 🔧 データ整合性の修正
-- =====================================================

-- 外部キー制約の一時的な無効化（必要に応じて）
-- ALTER TABLE tasks DISABLE TRIGGER ALL;
-- ALTER TABLE daily_messages DISABLE TRIGGER ALL;
-- ALTER TABLE execution_logs DISABLE TRIGGER ALL;
-- ALTER TABLE active_executions DISABLE TRIGGER ALL;

-- 外部キー制約の再有効化
-- ALTER TABLE tasks ENABLE TRIGGER ALL;
-- ALTER TABLE daily_messages ENABLE TRIGGER ALL;
-- ALTER TABLE execution_logs ENABLE TRIGGER ALL;
-- ALTER TABLE active_executions ENABLE TRIGGER ALL;

-- =====================================================
-- 📋 インポート後の確認クエリ
-- =====================================================

-- 各テーブルのレコード数を確認
SELECT 'user_settings' as table_name, COUNT(*) as record_count FROM user_settings
UNION ALL
SELECT 'tasks' as table_name, COUNT(*) as record_count FROM tasks
UNION ALL
SELECT 'daily_messages' as table_name, COUNT(*) as record_count FROM daily_messages
UNION ALL
SELECT 'execution_logs' as table_name, COUNT(*) as record_count FROM execution_logs
UNION ALL
SELECT 'active_executions' as table_name, COUNT(*) as record_count FROM active_executions
ORDER BY table_name;

-- データ整合性チェック
SELECT 
  'orphaned_tasks' as check_type,
  COUNT(*) as count
FROM tasks t
LEFT JOIN user_settings us ON t.user_id = us.user_id
WHERE us.user_id IS NULL

UNION ALL

SELECT 
  'orphaned_daily_messages' as check_type,
  COUNT(*) as count
FROM daily_messages dm
LEFT JOIN user_settings us ON dm.user_id = us.user_id
WHERE us.user_id IS NULL

UNION ALL

SELECT 
  'orphaned_execution_logs' as check_type,
  COUNT(*) as count
FROM execution_logs el
LEFT JOIN tasks t ON el.task_id = t.id
WHERE t.id IS NULL;

-- =====================================================
-- 🧹 クリーンアップ処理
-- =====================================================

-- 孤立したデータの削除（必要に応じて）
-- DELETE FROM tasks WHERE user_id NOT IN (SELECT user_id FROM user_settings);
-- DELETE FROM daily_messages WHERE user_id NOT IN (SELECT user_id FROM user_settings);
-- DELETE FROM execution_logs WHERE task_id NOT IN (SELECT id FROM tasks);

-- =====================================================
-- ⚠️ 注意事項
-- =====================================================

-- 1. このスクリプトは本番環境でのみ実行してください
-- 2. 実行前に必ずバックアップを取得してください
-- 3. データの整合性を十分に確認してください
-- 4. 個人情報の取り扱いに注意してください
-- 5. インポート後の動作確認を必ず行ってください 