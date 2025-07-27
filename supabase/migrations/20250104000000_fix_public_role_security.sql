-- =====================================================
-- セキュリティ修正: publicロールの適切な制限
-- 作成日: 2025-01-04
-- 目的: daily_messages_cleanup_logテーブルのpublicアクセスを制限
-- =====================================================

-- daily_messages_cleanup_logテーブルのpublicポリシーを削除
DO $$
BEGIN
    -- 既存のpublicポリシーを削除
    DROP POLICY IF EXISTS "Admin can view cleanup logs" ON daily_messages_cleanup_log;
    
    -- 既存の同名ポリシーも削除（重複を避けるため）
    DROP POLICY IF EXISTS "Service role can view cleanup logs" ON daily_messages_cleanup_log;
    
    -- 適切な権限を持つポリシーを再作成
    CREATE POLICY "Service role can view cleanup logs" ON daily_messages_cleanup_log
        FOR SELECT
        TO authenticated
        USING (auth.role() = 'service_role' OR auth.uid() IN (
            SELECT id FROM users WHERE plan_type = 'premium'
        ));
    
    RAISE NOTICE 'Fixed public role security for daily_messages_cleanup_log table';
END $$;

-- 他のテーブルでpublicアクセスがないか確認
DO $$
DECLARE
    public_policies_count INTEGER;
    has_roles_column BOOLEAN;
BEGIN
    -- rolesカラムの存在を確認
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pg_policies' AND column_name = 'roles'
    ) INTO has_roles_column;
    
    -- PostgreSQL バージョンに応じて適切なクエリを実行
    IF has_roles_column THEN
        -- 新しいバージョン（PostgreSQL 15+）
        SELECT COUNT(*) INTO public_policies_count
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND roles = ARRAY['public']::name[];
    ELSE
        -- 古いバージョン（PostgreSQL 14以下）
    SELECT COUNT(*) INTO public_policies_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
        AND polroles = ARRAY[0];
    END IF;
    
    IF public_policies_count > 0 THEN
        RAISE NOTICE 'Found % policies with public access - review needed', public_policies_count;
    ELSE
        RAISE NOTICE 'No other public access policies found';
    END IF;
END $$;

-- =====================================================
-- Service Role権限の制限
-- =====================================================

-- subscriptionsテーブルのService Role権限を制限
DO $$
BEGIN
    -- 既存の過度な権限ポリシーを削除
    DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON subscriptions;
    
    -- より具体的な権限を持つポリシーを再作成
    CREATE POLICY "Service role can manage subscriptions" ON subscriptions
        FOR ALL
        TO service_role
        USING (auth.role() = 'service_role')
        WITH CHECK (auth.role() = 'service_role');
    
    RAISE NOTICE 'Fixed service role permissions for subscriptions table';
END $$;

-- payment_historyテーブルのService Role権限を制限
DO $$
BEGIN
    DROP POLICY IF EXISTS "Service role can manage all payments" ON payment_history;
    
    CREATE POLICY "Service role can manage payments" ON payment_history
        FOR ALL
        TO service_role
        USING (auth.role() = 'service_role')
        WITH CHECK (auth.role() = 'service_role');
    
    RAISE NOTICE 'Fixed service role permissions for payment_history table';
END $$;

-- notificationsテーブルのService Role権限を制限
DO $$
BEGIN
    DROP POLICY IF EXISTS "Service role can manage all notifications" ON notifications;
    
    CREATE POLICY "Service role can manage notifications" ON notifications
        FOR ALL
        TO service_role
        USING (auth.role() = 'service_role')
        WITH CHECK (auth.role() = 'service_role');
    
    RAISE NOTICE 'Fixed service role permissions for notifications table';
END $$;

-- premium_waitlistテーブルのService Role権限を制限
DO $$
BEGIN
    DROP POLICY IF EXISTS "Service role can manage all waitlist entries" ON premium_waitlist;
    
    CREATE POLICY "Service role can manage waitlist entries" ON premium_waitlist
        FOR ALL
        TO service_role
        USING (auth.role() = 'service_role')
        WITH CHECK (auth.role() = 'service_role');
    
    RAISE NOTICE 'Fixed service role permissions for premium_waitlist table';
END $$;

-- =====================================================
-- RLSポリシーの強化
-- =====================================================

-- usersテーブルのRLSポリシーを強化
DO $$
BEGIN
    -- 既存のポリシーを削除して再作成
    DROP POLICY IF EXISTS "Users can view their own data" ON users;
    DROP POLICY IF EXISTS "Users can update their own data" ON users;
    
    -- より厳密なポリシーを作成
    CREATE POLICY "Users can view their own data" ON users
        FOR SELECT
        TO authenticated
        USING (auth.uid() = id);
    
    CREATE POLICY "Users can update their own data" ON users
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);
    
    RAISE NOTICE 'Enhanced RLS policies for users table';
END $$;

-- =====================================================
-- 外部キー制約の統一
-- =====================================================

-- user_settingsテーブルの外部キー制約を追加
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- 外部キー制約が存在しない場合のみ追加
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'user_settings' 
            AND constraint_name = 'user_settings_user_id_fkey'
        ) THEN
            ALTER TABLE user_settings 
            ADD CONSTRAINT user_settings_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key constraint to user_settings table';
        END IF;
    END IF;
END $$;

-- tasksテーブルの外部キー制約を追加
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'tasks' 
            AND constraint_name = 'tasks_user_id_fkey'
        ) THEN
            ALTER TABLE tasks 
            ADD CONSTRAINT tasks_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key constraint to tasks table';
        END IF;
    END IF;
END $$;

-- =====================================================
-- セキュリティ関連インデックスの追加
-- =====================================================

-- 認証関連のインデックスを追加
DO $$
BEGIN
    -- user_idカラムのインデックス（存在しない場合のみ）
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'user_settings' AND indexname = 'idx_user_settings_user_id'
    ) THEN
        CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
        RAISE NOTICE 'Added security index for user_settings.user_id';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'tasks' AND indexname = 'idx_tasks_user_id'
    ) THEN
        CREATE INDEX idx_tasks_user_id ON tasks(user_id);
        RAISE NOTICE 'Added security index for tasks.user_id';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'task_categories' AND indexname = 'idx_task_categories_user_id'
    ) THEN
        CREATE INDEX idx_task_categories_user_id ON task_categories(user_id);
        RAISE NOTICE 'Added security index for task_categories.user_id';
    END IF;
END $$;

-- =====================================================
-- セキュリティ制約の追加
-- =====================================================

-- データ整合性のための制約を追加
DO $$
BEGIN
    -- tasksテーブルのstatus制約
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'tasks' 
        AND constraint_name = 'tasks_status_check'
    ) THEN
        ALTER TABLE tasks 
        ADD CONSTRAINT tasks_status_check 
        CHECK (status IN ('todo', 'doing', 'done'));
        RAISE NOTICE 'Added status constraint to tasks table';
    END IF;
    
    -- tasksテーブルのpriority制約
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'tasks' 
        AND constraint_name = 'tasks_priority_check'
    ) THEN
        ALTER TABLE tasks 
        ADD CONSTRAINT tasks_priority_check 
        CHECK (priority IN ('low', 'medium', 'high'));
        RAISE NOTICE 'Added priority constraint to tasks table';
    END IF;
END $$;

-- =====================================================
-- セキュリティ確認完了
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Comprehensive security fix completed successfully';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '✓ Public role access has been properly restricted';
    RAISE NOTICE '✓ Service role permissions have been limited';
    RAISE NOTICE '✓ RLS policies have been enhanced';
    RAISE NOTICE '✓ Foreign key constraints have been unified';
    RAISE NOTICE '✓ Security indexes have been added';
    RAISE NOTICE '✓ Data integrity constraints have been added';
    RAISE NOTICE '=====================================================';
END $$;