-- =====================================================
-- 通知システム統合マイグレーション
-- 作成日: 2025-01-02
-- 目的: 通知システムの一元化（テーブル拡張 + ユーザー設定）
-- =====================================================

-- 既存の通知で制約に合わないタイプを修正（制約追加前に実行）
UPDATE notifications 
SET type = 'system_info'
WHERE type NOT IN (
  -- タスク関連
  'task_completed', 'task_due_soon', 'task_overdue', 'task_created',
  -- 習慣関連
  'habit_streak', 'habit_completed', 'habit_missed', 'habit_goal_reached',
  -- サブスクリプション関連
  'subscription_payment_success', 'subscription_payment_failed', 
  'trial_ending', 'subscription_canceled', 'subscription_renewed',
  -- システム関連
  'system_info', 'system_warning', 'system_error',
  -- AI関連
  'ai_message_generated', 'ai_analysis_complete',
  -- その他
  'trial_started', 'migration_complete'
);

-- 通知テーブルに新しいカラムを追加
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('task', 'habit', 'subscription', 'system', 'ai'));

-- 既存の通知にデフォルト値を設定
UPDATE notifications 
SET 
  priority = 'medium',
  category = CASE 
    WHEN type LIKE '%task%' THEN 'task'
    WHEN type LIKE '%habit%' THEN 'habit'
    WHEN type LIKE '%subscription%' THEN 'subscription'
    WHEN type LIKE '%ai%' THEN 'ai'
    ELSE 'system'
  END
WHERE priority IS NULL OR category IS NULL;

-- インデックスを追加してパフォーマンスを向上
CREATE INDEX IF NOT EXISTS idx_notifications_user_priority ON notifications(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_notifications_user_category ON notifications(user_id, category);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 通知タイプの制約を更新（新しい通知タイプを追加）
-- 既存の制約を削除して新しい制約を追加
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 新しい通知タイプの制約を追加
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  -- タスク関連
  'task_completed', 'task_due_soon', 'task_overdue', 'task_created',
  -- 習慣関連
  'habit_streak', 'habit_completed', 'habit_missed', 'habit_goal_reached',
  -- サブスクリプション関連
  'subscription_payment_success', 'subscription_payment_failed', 
  'trial_ending', 'subscription_canceled', 'subscription_renewed',
  -- システム関連
  'system_info', 'system_warning', 'system_error',
  -- AI関連
  'ai_message_generated', 'ai_analysis_complete',
  -- その他
  'trial_started', 'migration_complete'
));

-- usersテーブルに通知設定カラムを追加
ALTER TABLE users
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"task":true,"habit":true,"subscription":true,"system":true,"ai":true}';

-- RLSポリシーを更新（優先度とカテゴリも考慮）
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 通知の自動削除ポリシー（30日以上古い通知を削除）
-- このポリシーは後でCronJobで実装予定 