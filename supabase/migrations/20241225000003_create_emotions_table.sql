-- 感情ログ機能用のemotionsテーブルを作成
CREATE TABLE IF NOT EXISTS emotions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emotion_type TEXT NOT NULL CHECK (emotion_type IN ('joy', 'sadness', 'anger', 'surprise', 'fear', 'calm')),
  intensity INTEGER DEFAULT 3 CHECK (intensity >= 1 AND intensity <= 5),
  note TEXT,
  time_period TEXT NOT NULL CHECK (time_period IN ('morning', 'afternoon', 'evening')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC')
);

-- インデックスを作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_emotions_user_id ON emotions(user_id);
CREATE INDEX IF NOT EXISTS idx_emotions_created_at ON emotions(created_at);

-- 同一ユーザーの同一日付・同一時間帯で1レコードのみという制約
-- アプリケーションレベルで制御するため、インデックスは作成しない

-- RLS（Row Level Security）を有効化
ALTER TABLE emotions ENABLE ROW LEVEL SECURITY;

-- RLSポリシーを作成
CREATE POLICY "Users can view their own emotions" ON emotions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emotions" ON emotions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emotions" ON emotions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emotions" ON emotions
  FOR DELETE USING (auth.uid() = user_id);

-- updated_atを自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = (now() AT TIME ZONE 'UTC');
  RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーを作成
CREATE TRIGGER update_emotions_updated_at 
  BEFORE UPDATE ON emotions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 