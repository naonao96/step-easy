-- Daily Messages テーブルのメッセージ文字数制限を追加
-- 無料ユーザー: 100文字目標、200文字バッファ
-- プレミアムユーザー: 200文字目標、300文字バッファ
-- 安全のため、350文字を上限とする

-- messageカラムに文字数制限を追加
ALTER TABLE daily_messages 
ADD CONSTRAINT daily_messages_message_length_check 
CHECK (LENGTH(message) <= 350);

-- messageカラムの制約についてコメント追加
COMMENT ON COLUMN daily_messages.message IS 'AI生成メッセージ（最大350文字）: フリーユーザー100文字目標（200文字バッファ）、プレミアムユーザー200文字目標（300文字バッファ）';

-- 既存データの文字数チェック（情報用）
-- SELECT 
--   user_type,
--   COUNT(*) as message_count,
--   MIN(LENGTH(message)) as min_length,
--   MAX(LENGTH(message)) as max_length,
--   AVG(LENGTH(message))::INTEGER as avg_length
-- FROM daily_messages 
-- GROUP BY user_type
-- ORDER BY user_type; 