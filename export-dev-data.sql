-- 開発環境からのデータエクスポートスクリプト
-- 実行前に本番環境のバックアップを取得してください

-- =====================================================
-- 📊 データエクスポート（開発環境用）
-- =====================================================

-- 1. ユーザー設定データのエクスポート
COPY (
  SELECT 
    user_id,
    display_name,
    plan_type,
    notification_enabled,
    theme,
    created_at,
    updated_at
  FROM user_settings
  ORDER BY created_at
) TO '/tmp/user_settings_export.csv' WITH CSV HEADER;

-- 2. タスクデータのエクスポート
COPY (
  SELECT 
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
  FROM tasks
  ORDER BY created_at
) TO '/tmp/tasks_export.csv' WITH CSV HEADER;

-- 3. 日次メッセージデータのエクスポート
COPY (
  SELECT 
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
  FROM daily_messages
  ORDER BY created_at
) TO '/tmp/daily_messages_export.csv' WITH CSV HEADER;

-- 4. 実行履歴データのエクスポート
COPY (
  SELECT 
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
  FROM execution_logs
  ORDER BY created_at
) TO '/tmp/execution_logs_export.csv' WITH CSV HEADER;

-- 5. アクティブ実行データのエクスポート
COPY (
  SELECT 
    id,
    user_id,
    task_id,
    start_time,
    device_type,
    is_paused,
    accumulated_time,
    created_at,
    updated_at
  FROM active_executions
  ORDER BY created_at
) TO '/tmp/active_executions_export.csv' WITH CSV HEADER;

-- =====================================================
-- 📋 エクスポート確認クエリ
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

-- ユーザー別データ統計
SELECT 
  us.display_name,
  COUNT(t.id) as task_count,
  COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_tasks,
  COUNT(dm.id) as message_count,
  COUNT(el.id) as execution_count
FROM user_settings us
LEFT JOIN tasks t ON us.user_id = t.user_id
LEFT JOIN daily_messages dm ON us.user_id = dm.user_id
LEFT JOIN execution_logs el ON us.user_id = el.user_id
GROUP BY us.user_id, us.display_name
ORDER BY us.display_name;

-- =====================================================
-- ⚠️ 注意事項
-- =====================================================

-- 1. このスクリプトは開発環境でのみ実行してください
-- 2. エクスポート前に本番環境のバックアップを取得してください
-- 3. 個人情報や機密データの取り扱いに注意してください
-- 4. 本番環境への移行前にデータの検証を行ってください 