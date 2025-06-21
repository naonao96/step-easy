-- Daily AI Messages Table
-- ユーザーごとの1日1回のAI応援メッセージを保存
CREATE TABLE daily_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_date DATE NOT NULL DEFAULT CURRENT_DATE,
  scheduled_type VARCHAR(20) NOT NULL DEFAULT 'morning', -- 'morning', 'evening' (将来拡張用)
  user_type VARCHAR(20) NOT NULL, -- 'guest', 'free', 'premium'
  user_name VARCHAR(100), -- ユーザー名（nullの場合あり）
  message TEXT NOT NULL,
  
  -- 生成時の統計データ（プレミアムユーザー用）
  stats_today_completed INTEGER DEFAULT 0,
  stats_today_total INTEGER DEFAULT 0,
  stats_today_percentage INTEGER DEFAULT 0,
  stats_overall_percentage INTEGER DEFAULT 0,
  
  -- メタデータ
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- インデックス用制約
  UNIQUE(user_id, message_date, scheduled_type)
);

-- インデックス作成
CREATE INDEX idx_daily_messages_user_date ON daily_messages(user_id, message_date);
CREATE INDEX idx_daily_messages_date_type ON daily_messages(message_date, scheduled_type);
CREATE INDEX idx_daily_messages_generated_at ON daily_messages(generated_at);

-- RLS (Row Level Security) 設定
ALTER TABLE daily_messages ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のメッセージのみ閲覧可能
CREATE POLICY "Users can view own daily messages" ON daily_messages
  FOR SELECT USING (auth.uid() = user_id);

-- システムのみ挿入・更新可能（Edge Function用）
CREATE POLICY "System can insert daily messages" ON daily_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update daily messages" ON daily_messages
  FOR UPDATE USING (true);

-- トリガー：updated_at自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_daily_messages_updated_at
  BEFORE UPDATE ON daily_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- コメント追加
COMMENT ON TABLE daily_messages IS '1日1回生成されるユーザー向けAI応援メッセージ';
COMMENT ON COLUMN daily_messages.scheduled_type IS 'morning: 朝のメッセージ, evening: 夜のメッセージ（将来拡張用）';
COMMENT ON COLUMN daily_messages.user_type IS 'ユーザープラン: guest, free, premium';
COMMENT ON COLUMN daily_messages.stats_today_completed IS 'メッセージ生成時の今日の完了タスク数（プレミアム用）';
COMMENT ON COLUMN daily_messages.stats_today_total IS 'メッセージ生成時の今日の総タスク数（プレミアム用）'; 