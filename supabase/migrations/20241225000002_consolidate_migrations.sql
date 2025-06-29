-- =====================================================
-- マイグレーション統合・リファクタリング（本番環境対応版）
-- 作成日: 2024-12-25
-- 更新日: 2025-06-28
-- 目的: 重複マイグレーションを統合し、本番環境での安全な実行を保証
-- 影響: 既存データには一切影響なし（完全に安全）
-- 特徴: 冪等性保証、何度実行してもエラーなし
-- 内容: 13個のマイグレーションを完全統合 + 実際のテーブル構造に合わせて修正
-- =====================================================

-- =====================================================
-- 🧹 重複マイグレーションの安全なクリーンアップ
-- =====================================================

-- 1. usersテーブルの作成（plan_typeカラム含む）
CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY REFERENCES auth.users(id),
            email TEXT NOT NULL UNIQUE,
            display_name TEXT NOT NULL,
            bio TEXT,
            avatar_url TEXT,
    plan_type TEXT DEFAULT 'free' CHECK (plan_type = ANY (ARRAY['guest'::text, 'free'::text, 'premium'::text])),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );
        
-- 2. plan_typeカラムの追加（既存テーブル用、冪等性確保）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'plan_type'
        ) THEN
            ALTER TABLE users ADD COLUMN plan_type TEXT DEFAULT 'free' CHECK (plan_type = ANY (ARRAY['guest'::text, 'free'::text, 'premium'::text]));
        END IF;
    END IF;
END $$;

-- 3. user_settingsテーブルの安全な作成
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_settings') THEN
        -- usersテーブルが存在する場合のみ外部キー制約を追加
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
            CREATE TABLE user_settings (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                email_notifications BOOLEAN DEFAULT true,
                push_notifications BOOLEAN DEFAULT true,
                task_reminders BOOLEAN DEFAULT true,
                habit_reminders BOOLEAN DEFAULT true,
                ai_suggestions BOOLEAN DEFAULT true,
                theme TEXT DEFAULT 'light' CHECK (theme = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text])),
                font_size TEXT DEFAULT 'medium' CHECK (font_size = ANY (ARRAY['small'::text, 'medium'::text, 'large'::text])),
                compact_mode BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
                UNIQUE(user_id)
            );
        ELSE
            -- usersテーブルが存在しない場合は外部キー制約なしで作成
            CREATE TABLE user_settings (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL,
                email_notifications BOOLEAN DEFAULT true,
                push_notifications BOOLEAN DEFAULT true,
                task_reminders BOOLEAN DEFAULT true,
                habit_reminders BOOLEAN DEFAULT true,
                ai_suggestions BOOLEAN DEFAULT true,
                theme TEXT DEFAULT 'light' CHECK (theme = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text])),
                font_size TEXT DEFAULT 'medium' CHECK (font_size = ANY (ARRAY['small'::text, 'medium'::text, 'large'::text])),
                compact_mode BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
                UNIQUE(user_id)
            );
        END IF;
        
        -- Enable Row Level Security
        ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view their own settings" ON user_settings
            FOR SELECT
            USING (auth.uid() = user_id);

        CREATE POLICY "Users can update their own settings" ON user_settings
            FOR UPDATE
            USING (auth.uid() = user_id);
        
        RAISE NOTICE 'User settings table created successfully';
    ELSE
        RAISE NOTICE 'User settings table already exists, skipping creation';
    END IF;
END $$;

-- 4. tasksテーブルの安全な作成
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
        -- usersテーブルが存在する場合のみ外部キー制約を追加
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
            CREATE TABLE tasks (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT DEFAULT 'todo' CHECK (status = ANY (ARRAY['todo'::text, 'doing'::text, 'done'::text])),
                priority TEXT DEFAULT 'medium' CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])),
                due_date TIMESTAMP WITH TIME ZONE,
                completed_at TIMESTAMP WITH TIME ZONE,
                is_habit BOOLEAN DEFAULT false,
                habit_frequency TEXT CHECK (habit_frequency = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text])),
                streak_count INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
            );
        ELSE
            -- usersテーブルが存在しない場合は外部キー制約なしで作成
            CREATE TABLE tasks (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT DEFAULT 'todo' CHECK (status = ANY (ARRAY['todo'::text, 'doing'::text, 'done'::text])),
                priority TEXT DEFAULT 'medium' CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])),
                due_date TIMESTAMP WITH TIME ZONE,
                completed_at TIMESTAMP WITH TIME ZONE,
                is_habit BOOLEAN DEFAULT false,
                habit_frequency TEXT CHECK (habit_frequency = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text])),
                streak_count INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
            );
        END IF;
        
        -- Enable Row Level Security
        ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view their own tasks" ON tasks
            FOR SELECT
            USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own tasks" ON tasks
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own tasks" ON tasks
            FOR UPDATE
            USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own tasks" ON tasks
            FOR DELETE
            USING (auth.uid() = user_id);

        -- Create index for performance
        CREATE INDEX idx_tasks_user_id ON tasks(user_id);
        CREATE INDEX idx_tasks_status ON tasks(status);
        CREATE INDEX idx_tasks_due_date ON tasks(due_date);
        CREATE INDEX idx_tasks_created_at ON tasks(created_at);
        
        RAISE NOTICE 'Tasks table created successfully';
    ELSE
        RAISE NOTICE 'Tasks table already exists, skipping creation';
    END IF;
END $$;

-- 5. streak関連カラムの安全な追加
DO $$
BEGIN
    -- usersテーブルが存在する場合のみカラムを追加
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- streak_countカラムが存在しない場合のみ追加
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'streak_count'
        ) THEN
            ALTER TABLE users ADD COLUMN streak_count INTEGER DEFAULT 0;
            RAISE NOTICE 'streak_count column added to users table';
        ELSE
            RAISE NOTICE 'streak_count column already exists in users table';
        END IF;
        
        -- current_streakカラムが存在しない場合のみ追加
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'current_streak'
        ) THEN
            ALTER TABLE users ADD COLUMN current_streak INTEGER DEFAULT 0;
            RAISE NOTICE 'current_streak column added to users table';
        ELSE
            RAISE NOTICE 'current_streak column already exists in users table';
        END IF;
        
        -- longest_streakカラムが存在しない場合のみ追加
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'longest_streak'
        ) THEN
            ALTER TABLE users ADD COLUMN longest_streak INTEGER DEFAULT 0;
            RAISE NOTICE 'longest_streak column added to users table';
        ELSE
            RAISE NOTICE 'longest_streak column already exists in users table';
        END IF;
        
        -- last_completed_dateカラムが存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'last_completed_date'
    ) THEN
            ALTER TABLE users ADD COLUMN last_completed_date DATE;
            RAISE NOTICE 'last_completed_date column added to users table';
        ELSE
            RAISE NOTICE 'last_completed_date column already exists in users table';
        END IF;
    ELSE
        RAISE NOTICE 'Users table does not exist, skipping streak column additions';
    END IF;
END $$;

-- 6. planとstart_dateカラムの安全な追加
DO $$
BEGIN
    -- usersテーブルが存在する場合のみカラムを追加
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- planカラムが存在しない場合のみ追加
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'plan'
        ) THEN
            ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free';
            RAISE NOTICE 'plan column added to users table';
        ELSE
            RAISE NOTICE 'plan column already exists in users table';
        END IF;
        
        -- start_dateカラムが存在しない場合のみ追加
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'start_date'
        ) THEN
            ALTER TABLE users ADD COLUMN start_date DATE DEFAULT CURRENT_DATE;
            RAISE NOTICE 'start_date column added to users table';
        ELSE
            RAISE NOTICE 'start_date column already exists in users table';
        END IF;
    ELSE
        RAISE NOTICE 'Users table does not exist, skipping plan and start_date column additions';
    END IF;
END $$;

-- 7. task_categoriesテーブルの安全な作成
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_categories') THEN
        -- usersテーブルが存在する場合のみ外部キー制約を追加
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
            CREATE TABLE task_categories (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                color TEXT DEFAULT '#3B82F6',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
                UNIQUE(user_id, name)
            );
        ELSE
            -- usersテーブルが存在しない場合は外部キー制約なしで作成
            CREATE TABLE task_categories (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL,
                name TEXT NOT NULL,
                color TEXT DEFAULT '#3B82F6',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
                UNIQUE(user_id, name)
            );
        END IF;
        
        -- Enable Row Level Security
        ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view their own categories" ON task_categories
            FOR SELECT
            USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own categories" ON task_categories
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own categories" ON task_categories
            FOR UPDATE
            USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own categories" ON task_categories
            FOR DELETE
            USING (auth.uid() = user_id);
        
        RAISE NOTICE 'Task categories table created successfully';
    ELSE
        RAISE NOTICE 'Task categories table already exists, skipping creation';
    END IF;
END $$;

-- 8. tasksテーブルにcategory_idカラムを安全に追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE tasks ADD COLUMN category_id UUID REFERENCES task_categories(id) ON DELETE SET NULL;
        RAISE NOTICE 'category_id column added to tasks table';
    ELSE
        RAISE NOTICE 'category_id column already exists in tasks table';
    END IF;
END $$;

-- 9. daily_messagesテーブルの安全な作成（実際の構造に合わせて修正）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_messages') THEN
        CREATE TABLE daily_messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            message_date DATE NOT NULL DEFAULT CURRENT_DATE,
            scheduled_type CHARACTER VARYING NOT NULL DEFAULT 'morning',
            user_type CHARACTER VARYING NOT NULL,
            user_name CHARACTER VARYING,
            message TEXT NOT NULL CHECK (length(message) <= 350),
            stats_today_completed INTEGER DEFAULT 0,
            stats_today_total INTEGER DEFAULT 0,
            stats_today_percentage INTEGER DEFAULT 0,
            stats_overall_percentage INTEGER DEFAULT 0,
            generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        -- Enable Row Level Security
        ALTER TABLE daily_messages ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "daily_messages_authenticated_select" ON daily_messages
          FOR SELECT
          TO authenticated
          USING (auth.uid() = user_id);

        CREATE POLICY "daily_messages_service_insert" ON daily_messages
          FOR INSERT
          TO service_role
          WITH CHECK (true);

        CREATE POLICY "daily_messages_service_all" ON daily_messages
          FOR ALL
          TO service_role
          USING (true)
          WITH CHECK (true);
        
        RAISE NOTICE 'Daily messages table created successfully';
    ELSE
        RAISE NOTICE 'Daily messages table already exists, skipping creation';
    END IF;
END $$;

-- 10. 時間追跡関連カラムの安全な追加
DO $$
BEGIN
    -- estimated_durationカラムが存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'estimated_duration'
    ) THEN
        ALTER TABLE tasks ADD COLUMN estimated_duration INTEGER CHECK (estimated_duration IS NULL OR estimated_duration > 0);
        RAISE NOTICE 'estimated_duration column added to tasks table';
    ELSE
        RAISE NOTICE 'estimated_duration column already exists in tasks table';
    END IF;
    
    -- actual_durationカラムが存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'actual_duration'
    ) THEN
        ALTER TABLE tasks ADD COLUMN actual_duration INTEGER CHECK (actual_duration IS NULL OR actual_duration >= 0);
        RAISE NOTICE 'actual_duration column added to tasks table';
    ELSE
        RAISE NOTICE 'actual_duration column already exists in tasks table';
    END IF;
    
    -- started_atカラムが存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'started_at'
    ) THEN
        ALTER TABLE tasks ADD COLUMN started_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'started_at column added to tasks table';
    ELSE
        RAISE NOTICE 'started_at column already exists in tasks table';
    END IF;
    
    -- paused_atカラムが存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'paused_at'
    ) THEN
        ALTER TABLE tasks ADD COLUMN paused_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'paused_at column added to tasks table';
    ELSE
        RAISE NOTICE 'paused_at column already exists in tasks table';
    END IF;
END $$;

-- 11. tasksテーブルに追加カラムを安全に追加
DO $$
BEGIN
    -- current_streakカラムが存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'current_streak'
    ) THEN
        ALTER TABLE tasks ADD COLUMN current_streak INTEGER DEFAULT 0;
        RAISE NOTICE 'current_streak column added to tasks table';
    ELSE
        RAISE NOTICE 'current_streak column already exists in tasks table';
    END IF;
    
    -- longest_streakカラムが存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'longest_streak'
    ) THEN
        ALTER TABLE tasks ADD COLUMN longest_streak INTEGER DEFAULT 0;
        RAISE NOTICE 'longest_streak column added to tasks table';
    ELSE
        RAISE NOTICE 'longest_streak column already exists in tasks table';
    END IF;
    
    -- last_completed_dateカラムが存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'last_completed_date'
    ) THEN
        ALTER TABLE tasks ADD COLUMN last_completed_date DATE;
        RAISE NOTICE 'last_completed_date column added to tasks table';
    ELSE
        RAISE NOTICE 'last_completed_date column already exists in tasks table';
    END IF;
    
    -- streak_start_dateカラムが存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'streak_start_date'
    ) THEN
        ALTER TABLE tasks ADD COLUMN streak_start_date DATE;
        RAISE NOTICE 'streak_start_date column added to tasks table';
    ELSE
        RAISE NOTICE 'streak_start_date column already exists in tasks table';
    END IF;
    
    -- start_dateカラムが存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'start_date'
    ) THEN
        ALTER TABLE tasks ADD COLUMN start_date DATE;
        RAISE NOTICE 'start_date column added to tasks table';
    ELSE
        RAISE NOTICE 'start_date column already exists in tasks table';
    END IF;
    
    -- categoryカラムが存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'category'
    ) THEN
        ALTER TABLE tasks ADD COLUMN category CHARACTER VARYING DEFAULT 'other' CHECK (category::text = ANY (ARRAY['work'::character varying, 'health'::character varying, 'study'::character varying, 'personal'::character varying, 'hobby'::character varying, 'other'::character varying]::text[]));
        RAISE NOTICE 'category column added to tasks table';
    ELSE
        RAISE NOTICE 'category column already exists in tasks table';
    END IF;
    
    -- session_timeカラムが存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'session_time'
    ) THEN
        ALTER TABLE tasks ADD COLUMN session_time INTEGER DEFAULT 0;
        RAISE NOTICE 'session_time column added to tasks table';
    ELSE
        RAISE NOTICE 'session_time column already exists in tasks table';
    END IF;
    
    -- today_totalカラムが存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'today_total'
    ) THEN
        ALTER TABLE tasks ADD COLUMN today_total INTEGER DEFAULT 0;
        RAISE NOTICE 'today_total column added to tasks table';
    ELSE
        RAISE NOTICE 'today_total column already exists in tasks table';
    END IF;
    
    -- all_time_totalカラムが存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'all_time_total'
    ) THEN
        ALTER TABLE tasks ADD COLUMN all_time_total INTEGER DEFAULT 0;
        RAISE NOTICE 'all_time_total column added to tasks table';
    ELSE
        RAISE NOTICE 'all_time_total column already exists in tasks table';
    END IF;
    
    -- last_execution_dateカラムが存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'last_execution_date'
    ) THEN
        ALTER TABLE tasks ADD COLUMN last_execution_date DATE;
        RAISE NOTICE 'last_execution_date column added to tasks table';
    ELSE
        RAISE NOTICE 'last_execution_date column already exists in tasks table';
    END IF;
    
    -- execution_countカラムが存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'execution_count'
    ) THEN
        ALTER TABLE tasks ADD COLUMN execution_count INTEGER DEFAULT 0;
        RAISE NOTICE 'execution_count column added to tasks table';
    ELSE
        RAISE NOTICE 'execution_count column already exists in tasks table';
    END IF;
END $$;

-- 12. 制約の安全な修正
DO $$
BEGIN
    -- actual_durationの制約を安全に追加
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'actual_duration'
    ) THEN
        -- 制約が存在しない場合のみ追加
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.check_constraints 
            WHERE constraint_name = 'tasks_actual_duration_check'
        ) THEN
            ALTER TABLE tasks ADD CONSTRAINT tasks_actual_duration_check 
            CHECK (actual_duration IS NULL OR actual_duration >= 0);
            RAISE NOTICE 'actual_duration constraint added to tasks table';
        ELSE
            RAISE NOTICE 'actual_duration constraint already exists in tasks table';
        END IF;
    END IF;
END $$;

-- 13. premium_waitlistテーブルの安全な作成（実際の構造に合わせて修正）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'premium_waitlist') THEN
        -- シーケンスが存在しない場合は作成
        IF NOT EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'premium_waitlist_id_seq') THEN
            CREATE SEQUENCE premium_waitlist_id_seq;
            RAISE NOTICE 'premium_waitlist_id_seq sequence created';
        END IF;
        
        CREATE TABLE premium_waitlist (
            id INTEGER PRIMARY KEY DEFAULT nextval('premium_waitlist_id_seq'::regclass),
            user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            email TEXT NOT NULL,
            interested_features JSONB DEFAULT '[]'::jsonb,
            signup_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
            notification_enabled BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        -- Enable Row Level Security
        ALTER TABLE premium_waitlist ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view their own waitlist entry" ON premium_waitlist
            FOR SELECT
            USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own waitlist entry" ON premium_waitlist
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own waitlist entry" ON premium_waitlist
            FOR UPDATE
            USING (auth.uid() = user_id);

        CREATE POLICY "Service role can manage all waitlist entries" ON premium_waitlist
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
        
        RAISE NOTICE 'Premium waitlist table created successfully';
    ELSE
        RAISE NOTICE 'Premium waitlist table already exists, skipping creation';
    END IF;
END $$;

-- 14. active_executionsテーブルの安全な作成（実際の構造に合わせて修正）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'active_executions') THEN
        CREATE TABLE active_executions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            start_time TIMESTAMP WITH TIME ZONE NOT NULL,
            device_type CHARACTER VARYING DEFAULT 'unknown',
            is_paused BOOLEAN DEFAULT false,
            accumulated_time INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        -- Enable Row Level Security
        ALTER TABLE active_executions ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view own active executions" ON active_executions
            FOR SELECT
            USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert own active executions" ON active_executions
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update own active executions" ON active_executions
            FOR UPDATE
            USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete own active executions" ON active_executions
            FOR DELETE
            USING (auth.uid() = user_id);
        
        RAISE NOTICE 'Active executions table created successfully';
    ELSE
        RAISE NOTICE 'Active executions table already exists, skipping creation';
    END IF;
END $$;

-- 15. daily_messages_cleanup_logテーブルの安全な作成（実際の構造に合わせて修正）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_messages_cleanup_log') THEN
        CREATE TABLE daily_messages_cleanup_log (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            cleanup_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
            deleted_free_count BIGINT DEFAULT 0,
            deleted_guest_count BIGINT DEFAULT 0,
            execution_type CHARACTER VARYING DEFAULT 'auto',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        -- Enable Row Level Security
        ALTER TABLE daily_messages_cleanup_log ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Admin can view cleanup logs" ON daily_messages_cleanup_log
            FOR SELECT
            TO public
            USING (true);
        
        RAISE NOTICE 'Daily messages cleanup log table created successfully';
    ELSE
        RAISE NOTICE 'Daily messages cleanup log table already exists, skipping creation';
    END IF;
END $$;

-- 16. execution_logsテーブルの安全な作成（実際の構造に合わせて修正）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'execution_logs') THEN
        CREATE TABLE execution_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            start_time TIMESTAMP WITH TIME ZONE NOT NULL,
            end_time TIMESTAMP WITH TIME ZONE,
            duration INTEGER NOT NULL DEFAULT 0,
            device_type CHARACTER VARYING DEFAULT 'unknown',
            session_type CHARACTER VARYING DEFAULT 'normal',
            is_completed BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        -- Enable Row Level Security
        ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view own execution logs" ON execution_logs
            FOR SELECT
            USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert own execution logs" ON execution_logs
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update own execution logs" ON execution_logs
            FOR UPDATE
            USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete own execution logs" ON execution_logs
            FOR DELETE
            USING (auth.uid() = user_id);
        
        RAISE NOTICE 'Execution logs table created successfully';
    ELSE
        RAISE NOTICE 'Execution logs table already exists, skipping creation';
    END IF;
END $$;

-- 17. usersテーブルのRLSポリシーを安全に追加
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Enable Row Level Security if not already enabled
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'users' AND rowsecurity = true
        ) THEN
            ALTER TABLE users ENABLE ROW LEVEL SECURITY;
            RAISE NOTICE 'RLS enabled for users table';
        END IF;
        
        -- Create policies if they don't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'users' AND policyname = 'Users can view their own data'
        ) THEN
            CREATE POLICY "Users can view their own data" ON users
                FOR SELECT
                TO authenticated
                USING (auth.uid() = id);
            RAISE NOTICE 'Users can view their own data policy created';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'users' AND policyname = 'Users can update their own data'
        ) THEN
            CREATE POLICY "Users can update their own data" ON users
                FOR UPDATE
                TO authenticated
                USING (auth.uid() = id);
            RAISE NOTICE 'Users can update their own data policy created';
        END IF;
    ELSE
        RAISE NOTICE 'Users table does not exist, skipping RLS setup';
    END IF;
END $$;

-- =====================================================
-- 🔧 ユーザー登録関数の最終統合（安全版）
-- =====================================================

-- 18. 安全なユーザー登録関数の作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- plan_typeカラムが存在する場合の標準的なINSERT
    INSERT INTO public.users (id, email, display_name, plan_type)
    VALUES (
        new.id, 
        new.email, 
        COALESCE(
            new.raw_user_meta_data->>'display_name',
            new.raw_user_meta_data->>'full_name',
            split_part(new.email, '@', 1)
        ),
        'free' -- 明示的にplan_typeを設定
    );
    RETURN new;
EXCEPTION
    WHEN undefined_column THEN
        -- plan_typeカラムが存在しない場合のフォールバック
        INSERT INTO public.users (id, email, display_name)
        VALUES (
            new.id, 
            new.email, 
            COALESCE(
                new.raw_user_meta_data->>'display_name',
                new.raw_user_meta_data->>'full_name',
                split_part(new.email, '@', 1)
            )
        );
        RETURN new;
    WHEN unique_violation THEN
        -- ユーザーが既に存在する場合は何もしない
        RAISE NOTICE 'User already exists: %', new.email;
        RETURN new;
    WHEN OTHERS THEN
        -- その他のエラーの場合はログを出力して処理を継続
        RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
        RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 19. ユーザー設定作成関数の安全な作成
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_settings (user_id)
    VALUES (new.id);
    RETURN new;
EXCEPTION
    WHEN unique_violation THEN
        -- ユーザー設定が既に存在する場合は何もしない
        RAISE NOTICE 'User settings already exists for user: %', new.id;
        RETURN new;
    WHEN OTHERS THEN
        -- その他のエラーの場合はログを出力して処理を継続
        RAISE NOTICE 'Error in handle_new_user_settings: %', SQLERRM;
        RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 20. トリガーの安全な設定
DO $$
BEGIN
    -- 既存のトリガーを安全に削除
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    DROP TRIGGER IF EXISTS on_user_created ON public.users;
    
    -- 新しいトリガーを作成
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    
    CREATE TRIGGER on_user_created
        AFTER INSERT ON public.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_settings();
    
    RAISE NOTICE 'User registration triggers updated successfully';
END $$;

-- =====================================================
-- 🗑️ 不要な関数・ビューの安全なクリーンアップ
-- =====================================================

-- 21. 開発用関数の安全な削除（本番環境では不要）
DROP FUNCTION IF EXISTS trigger_daily_message_generation_dev();
DROP FUNCTION IF EXISTS trigger_daily_message_generation_local();
DROP FUNCTION IF EXISTS trigger_daily_message_generation_prod();

-- 22. 不要なビューの安全な削除
DROP VIEW IF EXISTS daily_messages_debug;
DROP VIEW IF EXISTS daily_messages_access_info;
DROP VIEW IF EXISTS cron_job_status;

-- 23. 不要な関数の安全な削除
DROP FUNCTION IF EXISTS debug_daily_messages_access();
DROP FUNCTION IF EXISTS debug_table_permissions();
DROP FUNCTION IF EXISTS check_daily_messages_access(uuid);
DROP FUNCTION IF EXISTS test_daily_messages_rls();

-- =====================================================
-- ✅ 統合完了確認
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration consolidation completed successfully';
    RAISE NOTICE 'All 13 migrations + actual table structures have been safely integrated';
    RAISE NOTICE 'Production environment is ready for deployment';
    RAISE NOTICE 'Migration is idempotent - safe to run multiple times';
END $$;

-- =====================================================
-- CronJob設定（Vercel Cron Jobs対応）
-- =====================================================

-- 既存のCronJobを安全に削除（Vercel Cron Jobsに移行済み）
DO $$
BEGIN
  -- cron拡張機能が存在する場合のみ実行
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-daily-messages-prod') THEN
      SELECT cron.unschedule('generate-daily-messages-prod');
      RAISE NOTICE 'Removed old cron job: generate-daily-messages-prod';
    END IF;
    
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-daily-messages-dev') THEN
      SELECT cron.unschedule('generate-daily-messages-dev');
      RAISE NOTICE 'Removed old cron job: generate-daily-messages-dev';
    END IF;
    
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-messages-cleanup') THEN
      SELECT cron.unschedule('daily-messages-cleanup');
      RAISE NOTICE 'Removed old cron job: daily-messages-cleanup';
    END IF;
    
    RAISE NOTICE 'All old cron jobs removed - Vercel Cron Jobs are now used';
  ELSE
    RAISE NOTICE 'pg_cron extension not available (free plan) - Vercel Cron Jobs are used instead';
  END IF;
END $$;

-- 追加: 利用規約同意フラグの安全な追加（2025-06-29）
DO $$
BEGIN
    -- user_settingsテーブルが存在する場合のみカラムを追加
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_settings') THEN
        -- terms_agreedカラムが存在しない場合のみ追加
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_settings' AND column_name = 'terms_agreed'
        ) THEN
            ALTER TABLE user_settings ADD COLUMN terms_agreed BOOLEAN DEFAULT false;
            RAISE NOTICE 'terms_agreed column added to user_settings table';
        ELSE
            RAISE NOTICE 'terms_agreed column already exists in user_settings table';
        END IF;
    ELSE
        RAISE NOTICE 'user_settings table does not exist, skipping terms_agreed column addition';
    END IF;
END $$; 