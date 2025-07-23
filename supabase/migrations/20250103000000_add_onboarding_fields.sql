-- =====================================================
-- オンボーディング機能用フィールド追加
-- 作成日: 2025-01-03
-- 目的: ユーザー名と利用規約同意情報の保存
-- 影響: 既存データには一切影響なし（完全に安全）
-- 特徴: 冪等性保証、何度実行してもエラーなし
-- =====================================================

-- オンボーディング関連フィールドの安全な追加
DO $$
BEGIN
    -- usersテーブルが存在する場合のみカラムを追加
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        
        -- user_nameカラムが存在しない場合のみ追加
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'user_name'
        ) THEN
            ALTER TABLE users ADD COLUMN user_name VARCHAR(50);
            RAISE NOTICE 'user_name column added to users table';
        ELSE
            RAISE NOTICE 'user_name column already exists in users table';
        END IF;
        
        -- terms_accepted_atカラムが存在しない場合のみ追加
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'terms_accepted_at'
        ) THEN
            ALTER TABLE users ADD COLUMN terms_accepted_at TIMESTAMP WITH TIME ZONE;
            RAISE NOTICE 'terms_accepted_at column added to users table';
        ELSE
            RAISE NOTICE 'terms_accepted_at column already exists in users table';
        END IF;
        
        -- privacy_accepted_atカラムが存在しない場合のみ追加
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'privacy_accepted_at'
        ) THEN
            ALTER TABLE users ADD COLUMN privacy_accepted_at TIMESTAMP WITH TIME ZONE;
            RAISE NOTICE 'privacy_accepted_at column added to users table';
        ELSE
            RAISE NOTICE 'privacy_accepted_at column already exists in users table';
        END IF;
        
        -- onboarding_completed_atカラムが存在しない場合のみ追加
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'onboarding_completed_at'
        ) THEN
            ALTER TABLE users ADD COLUMN onboarding_completed_at TIMESTAMP WITH TIME ZONE;
            RAISE NOTICE 'onboarding_completed_at column added to users table';
        ELSE
            RAISE NOTICE 'onboarding_completed_at column already exists in users table';
        END IF;
        
    ELSE
        RAISE NOTICE 'Users table does not exist, skipping column additions';
    END IF;
END $$;

-- ユーザー名の重複を防ぐためのインデックス作成（オプション）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'user_name') THEN
            -- インデックスが存在しない場合のみ作成
            IF NOT EXISTS (
                SELECT 1 FROM pg_indexes 
                WHERE tablename = 'users' AND indexname = 'idx_users_user_name'
            ) THEN
                CREATE INDEX idx_users_user_name ON users(user_name);
                RAISE NOTICE 'Index on user_name created';
            ELSE
                RAISE NOTICE 'Index on user_name already exists';
            END IF;
        END IF;
    END IF;
END $$; 