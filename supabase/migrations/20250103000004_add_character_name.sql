-- =====================================================
-- 小鳥キャラクター名設定機能用フィールド追加
-- 作成日: 2025-01-03
-- 目的: ユーザーが小鳥キャラクターに名前を付ける機能の実装
-- 影響: 既存データには一切影響なし（完全に安全）
-- 特徴: 冪等性保証、何度実行してもエラーなし
-- =====================================================

-- キャラクター名フィールドの安全な追加
DO $$
BEGIN
    -- usersテーブルが存在する場合のみカラムを追加
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        
        -- character_nameカラムが存在しない場合のみ追加
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'character_name'
        ) THEN
            ALTER TABLE users ADD COLUMN character_name VARCHAR(30);
            RAISE NOTICE 'character_name column added to users table';
        ELSE
            RAISE NOTICE 'character_name column already exists in users table';
        END IF;
        
    ELSE
        RAISE NOTICE 'Users table does not exist, skipping character_name column addition';
    END IF;
END $$;

-- キャラクター名のインデックス作成（オプション）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'character_name') THEN
            -- インデックスが存在しない場合のみ作成
            IF NOT EXISTS (
                SELECT 1 FROM pg_indexes 
                WHERE tablename = 'users' AND indexname = 'idx_users_character_name'
            ) THEN
                CREATE INDEX idx_users_character_name ON users(character_name);
                RAISE NOTICE 'Index on character_name created';
            ELSE
                RAISE NOTICE 'Index on character_name already exists';
            END IF;
        END IF;
    END IF;
END $$; 