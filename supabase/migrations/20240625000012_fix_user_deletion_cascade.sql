-- 20240625000012_fix_user_deletion_cascade.sql
-- ユーザー削除時のCASCADE制約を修正
-- 作成日: 2024-12-25
-- 目的: ユーザー削除時のデータベースエラーを根本的に解決

-- 1. 既存の制約を削除
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- 2. CASCADE制約を追加
ALTER TABLE users 
ADD CONSTRAINT users_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. 削除トリガー関数の作成
CREATE OR REPLACE FUNCTION handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- 関連データを明示的に削除（念のため）
    DELETE FROM execution_logs WHERE user_id = OLD.id;
    DELETE FROM active_executions WHERE user_id = OLD.id;
    DELETE FROM daily_messages WHERE user_id = OLD.id;
    DELETE FROM premium_waitlist WHERE user_id = OLD.id;
    DELETE FROM tasks WHERE user_id = OLD.id;
    DELETE FROM user_settings WHERE user_id = OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 削除トリガーの作成
DROP TRIGGER IF EXISTS on_user_deletion ON users;
CREATE TRIGGER on_user_deletion
    BEFORE DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION handle_user_deletion();

-- 5. コメント追加
COMMENT ON FUNCTION handle_user_deletion() IS 'ユーザー削除時の関連データクリーンアップ関数';
COMMENT ON TRIGGER on_user_deletion ON users IS 'ユーザー削除時の自動クリーンアップトリガー'; 