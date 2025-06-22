-- プレミアム機能の通知登録用テーブル
CREATE TABLE premium_waitlist (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  interested_features JSONB DEFAULT '[]'::jsonb,
  signup_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notification_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- ユーザーごとに1レコードのみ
  UNIQUE(user_id)
);

-- インデックス作成
CREATE INDEX idx_premium_waitlist_user_id ON premium_waitlist(user_id);
CREATE INDEX idx_premium_waitlist_signup_date ON premium_waitlist(signup_date);
CREATE INDEX idx_premium_waitlist_notification_enabled ON premium_waitlist(notification_enabled);

-- RLS (Row Level Security) を有効化
ALTER TABLE premium_waitlist ENABLE ROW LEVEL SECURITY;

-- ポリシー作成: ユーザーは自分のレコードのみアクセス可能
CREATE POLICY "Users can view their own waitlist entry" 
  ON premium_waitlist FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own waitlist entry" 
  ON premium_waitlist FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own waitlist entry" 
  ON premium_waitlist FOR UPDATE 
  USING (auth.uid() = user_id);

-- updated_at自動更新のトリガー
CREATE OR REPLACE FUNCTION update_premium_waitlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_premium_waitlist_updated_at
  BEFORE UPDATE ON premium_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION update_premium_waitlist_updated_at(); 