-- =====================================================
-- 開発環境と同じ構造にロールバック
-- 作成日: 2025-06-28
-- 目的: 本番環境を開発環境と同じ構造に戻す
-- =====================================================

-- 1. tasksテーブルから余分なカラムを削除（開発環境と同じにする）
DO $$
BEGIN
    -- category_idカラムを削除
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE tasks DROP COLUMN category_id;
        RAISE NOTICE 'category_id column removed from tasks table';
    END IF;
    
    -- started_atカラムを削除
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'started_at'
    ) THEN
        ALTER TABLE tasks DROP COLUMN started_at;
        RAISE NOTICE 'started_at column removed from tasks table';
    END IF;
    
    -- paused_atカラムを削除
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'paused_at'
    ) THEN
        ALTER TABLE tasks DROP COLUMN paused_at;
        RAISE NOTICE 'paused_at column removed from tasks table';
    END IF;
END $$;

-- 2. usersテーブルから余分なカラムを削除（開発環境と同じにする）
DO $$
BEGIN
    -- streak_countカラムを削除
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'streak_count'
    ) THEN
        ALTER TABLE users DROP COLUMN streak_count;
        RAISE NOTICE 'streak_count column removed from users table';
    END IF;
    
    -- current_streakカラムを削除
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'current_streak'
    ) THEN
        ALTER TABLE users DROP COLUMN current_streak;
        RAISE NOTICE 'current_streak column removed from users table';
    END IF;
    
    -- longest_streakカラムを削除
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'longest_streak'
    ) THEN
        ALTER TABLE users DROP COLUMN longest_streak;
        RAISE NOTICE 'longest_streak column removed from users table';
    END IF;
    
    -- last_completed_dateカラムを削除
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_completed_date'
    ) THEN
        ALTER TABLE users DROP COLUMN last_completed_date;
        RAISE NOTICE 'last_completed_date column removed from users table';
    END IF;
    
    -- planカラムを削除
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'plan'
    ) THEN
        ALTER TABLE users DROP COLUMN plan;
        RAISE NOTICE 'plan column removed from users table';
    END IF;
    
    -- start_dateカラムを削除
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'start_date'
    ) THEN
        ALTER TABLE users DROP COLUMN start_date;
        RAISE NOTICE 'start_date column removed from users table';
    END IF;
END $$;

-- 3. task_categoriesテーブルを削除（開発環境には存在しない）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_categories') THEN
        DROP TABLE task_categories CASCADE;
        RAISE NOTICE 'task_categories table removed (not in dev environment)';
    END IF;
END $$;

-- 4. premium_waitlistテーブルを削除（開発環境には存在しない）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'premium_waitlist') THEN
        DROP TABLE premium_waitlist CASCADE;
        RAISE NOTICE 'premium_waitlist table removed (not in dev environment)';
    END IF;
END $$;

-- 5. premium_waitlist_id_seqシーケンスを削除（開発環境には存在しない）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'premium_waitlist_id_seq') THEN
        DROP SEQUENCE premium_waitlist_id_seq;
        RAISE NOTICE 'premium_waitlist_id_seq sequence removed (not in dev environment)';
    END IF;
END $$;

-- 6. active_executionsテーブルを削除（開発環境には存在しない）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'active_executions') THEN
        DROP TABLE active_executions CASCADE;
        RAISE NOTICE 'active_executions table removed (not in dev environment)';
    END IF;
END $$;

-- 7. daily_messages_cleanup_logテーブルを削除（開発環境には存在しない）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_messages_cleanup_log') THEN
        DROP TABLE daily_messages_cleanup_log CASCADE;
        RAISE NOTICE 'daily_messages_cleanup_log table removed (not in dev environment)';
    END IF;
END $$;

-- 8. execution_logsテーブルを削除（開発環境には存在しない）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'execution_logs') THEN
        DROP TABLE execution_logs CASCADE;
        RAISE NOTICE 'execution_logs table removed (not in dev environment)';
    END IF;
END $$;

-- =====================================================
-- ロールバック完了確認
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Rollback to dev environment structure completed successfully';
    RAISE NOTICE 'Production environment now matches development environment';
END $$;
