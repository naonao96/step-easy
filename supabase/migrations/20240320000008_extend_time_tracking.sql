-- 時間追跡機能の拡張
-- 作成日: 2024-03-20
-- 目的: 累積時間管理、実行履歴、マルチデバイス同期対応

-- タスクテーブルの拡張
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS session_time INTEGER DEFAULT 0,           -- 現在セッション時間（秒）
ADD COLUMN IF NOT EXISTS today_total INTEGER DEFAULT 0,           -- 今日の累計時間（秒）  
ADD COLUMN IF NOT EXISTS all_time_total INTEGER DEFAULT 0,        -- 全期間累計時間（秒）
ADD COLUMN IF NOT EXISTS last_execution_date DATE,               -- 最終実行日
ADD COLUMN IF NOT EXISTS execution_count INTEGER DEFAULT 0;      -- 実行回数

-- 実行履歴テーブル（新規作成）
CREATE TABLE IF NOT EXISTS execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER NOT NULL DEFAULT 0,                     -- 実行時間（秒）
  device_type VARCHAR(20) DEFAULT 'unknown',               -- 'mobile' | 'desktop' | 'unknown'
  session_type VARCHAR(20) DEFAULT 'normal',               -- 'normal' | 'habit'
  is_completed BOOLEAN DEFAULT TRUE,                       -- 完了フラグ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- リアルタイム実行状態テーブル（新規作成）
CREATE TABLE IF NOT EXISTS active_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  device_type VARCHAR(20) DEFAULT 'unknown',
  is_paused BOOLEAN DEFAULT FALSE,
  accumulated_time INTEGER DEFAULT 0,                      -- 累積時間（秒）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_execution_logs_user_id ON execution_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_task_id ON execution_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_date ON execution_logs((start_time::date));
CREATE INDEX IF NOT EXISTS idx_active_executions_user_id ON active_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_last_execution_date ON tasks(last_execution_date);

-- RLSポリシーの設定（セキュリティ）
-- execution_logsテーブル
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own execution logs" ON execution_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own execution logs" ON execution_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own execution logs" ON execution_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own execution logs" ON execution_logs
  FOR DELETE USING (auth.uid() = user_id);

-- active_executionsテーブル
ALTER TABLE active_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own active executions" ON active_executions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own active executions" ON active_executions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own active executions" ON active_executions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own active executions" ON active_executions
  FOR DELETE USING (auth.uid() = user_id);

-- 既存のactual_durationを all_time_total に移行（データ保持）
UPDATE tasks 
SET all_time_total = COALESCE(actual_duration, 0) * 60  -- 分を秒に変換
WHERE all_time_total = 0 AND actual_duration IS NOT NULL;

-- トリガー関数: updated_atの自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーの作成
DROP TRIGGER IF EXISTS update_execution_logs_updated_at ON execution_logs;
CREATE TRIGGER update_execution_logs_updated_at
    BEFORE UPDATE ON execution_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_active_executions_updated_at ON active_executions;
CREATE TRIGGER update_active_executions_updated_at
    BEFORE UPDATE ON active_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 集計用ビュー（統計情報の高速取得）
CREATE OR REPLACE VIEW task_statistics AS
SELECT 
    t.id,
    t.user_id,
    t.title,
    t.all_time_total,
    t.today_total,
    t.execution_count,
    t.last_execution_date,
    COUNT(el.id) as total_sessions,
    COALESCE(SUM(el.duration), 0) as verified_total_duration,
    COALESCE(AVG(el.duration), 0) as avg_session_duration,
    COALESCE(MAX(el.end_time), t.last_execution_date::timestamp) as last_activity
FROM tasks t
LEFT JOIN execution_logs el ON t.id = el.task_id AND el.is_completed = true
GROUP BY t.id, t.user_id, t.title, t.all_time_total, t.today_total, t.execution_count, t.last_execution_date;

-- コメント追加（保守性向上）
COMMENT ON TABLE execution_logs IS '実行履歴テーブル - 各セッションの詳細記録';
COMMENT ON TABLE active_executions IS 'リアルタイム実行状態テーブル - 現在実行中のタスク管理';
COMMENT ON COLUMN tasks.session_time IS '現在セッションの経過時間（秒）';
COMMENT ON COLUMN tasks.today_total IS '今日の累計実行時間（秒）';
COMMENT ON COLUMN tasks.all_time_total IS '全期間の累計実行時間（秒）';
COMMENT ON COLUMN tasks.last_execution_date IS '最終実行日';
COMMENT ON COLUMN tasks.execution_count IS '累計実行回数'; 