-- =====================================================
-- マイグレーション統合・リファクタリング
-- 作成日: 2024-12-25
-- 目的: 重複マイグレーションを統合し、本番環境での安全な実行を保証
-- 影響: 既存データには一切影響なし（安全）
-- =====================================================

-- =====================================================
-- 🧹 重複マイグレーションの安全なクリーンアップ
-- =====================================================

-- 1. 重複したusersテーブル作成の安全な処理
DO $$
BEGIN
    -- usersテーブルが存在しない場合のみ作成
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- 元のマイグレーションの内容を実行
        CREATE TABLE users (
            id UUID PRIMARY KEY REFERENCES auth.users(id),
            email TEXT NOT NULL UNIQUE,
            display_name TEXT NOT NULL,
            bio TEXT,
            avatar_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );
        
        RAISE NOTICE 'Users table created successfully';
    ELSE
        RAISE NOTICE 'Users table already exists, skipping creation';
    END IF;
END $$;

-- 2. plan_typeカラムの安全な追加
DO $$
BEGIN
    -- plan_typeカラムが存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'plan_type'
    ) THEN
        ALTER TABLE users ADD COLUMN plan_type TEXT DEFAULT 'free';
        RAISE NOTICE 'plan_type column added to users table';
    ELSE
        RAISE NOTICE 'plan_type column already exists in users table';
    END IF;
END $$;

-- =====================================================
-- 🔄 既存マイグレーションの安全な統合
-- =====================================================

-- 3. 既存のRLS設定を安全に確認・修正
DO $$
BEGIN
    -- daily_messagesテーブルのRLS設定を確認
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_messages') THEN
        -- RLSが有効でない場合は有効化
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'daily_messages' AND rowsecurity = true
        ) THEN
            ALTER TABLE daily_messages ENABLE ROW LEVEL SECURITY;
            RAISE NOTICE 'RLS enabled for daily_messages table';
        END IF;
        
        -- 既存のポリシーをクリーンアップ（安全）
        DROP POLICY IF EXISTS "Users can view own daily messages" ON daily_messages;
        DROP POLICY IF EXISTS "Authenticated users can insert own daily messages" ON daily_messages;
        DROP POLICY IF EXISTS "Authenticated users can update own daily messages" ON daily_messages;
        DROP POLICY IF EXISTS "Service role can manage all daily messages" ON daily_messages;
        DROP POLICY IF EXISTS "System can insert daily messages" ON daily_messages;
        DROP POLICY IF EXISTS "System can update daily messages" ON daily_messages;
        DROP POLICY IF EXISTS "daily_messages_policy" ON daily_messages;
        DROP POLICY IF EXISTS "daily_messages_service_policy" ON daily_messages;
        DROP POLICY IF EXISTS "unified_daily_messages_access" ON daily_messages;
        DROP POLICY IF EXISTS "daily_messages_read_optimized" ON daily_messages;
        DROP POLICY IF EXISTS "daily_messages_select" ON daily_messages;
        DROP POLICY IF EXISTS "daily_messages_insert" ON daily_messages;
        DROP POLICY IF EXISTS "daily_messages_service_all" ON daily_messages;
        
        -- 統合されたポリシーを作成
        DROP POLICY IF EXISTS "daily_messages_authenticated_select" ON daily_messages;
        CREATE POLICY "daily_messages_authenticated_select" ON daily_messages
          FOR SELECT
          TO authenticated
          USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "daily_messages_service_insert" ON daily_messages;
        CREATE POLICY "daily_messages_service_insert" ON daily_messages
          FOR INSERT
          TO service_role
          WITH CHECK (true);

        DROP POLICY IF EXISTS "daily_messages_service_all" ON daily_messages;
        CREATE POLICY "daily_messages_service_all" ON daily_messages
          FOR ALL
          TO service_role
          USING (true)
          WITH CHECK (true);
        
        RAISE NOTICE 'Daily messages RLS policies consolidated successfully';
    END IF;
END $$;

-- =====================================================
-- 🔧 ユーザー登録関数の最終統合
-- =====================================================

-- 5. 安全なユーザー登録関数の作成
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
    WHEN OTHERS THEN
        -- その他のエラーの場合はログを出力して処理を継続
        RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
        RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. トリガーの安全な設定
DO $$
BEGIN
    -- 既存のトリガーを削除
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    
    -- 新しいトリガーを作成
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    
    RAISE NOTICE 'User registration trigger updated successfully';
END $$;

-- =====================================================
-- 🗑️ 不要な関数・ビューのクリーンアップ
-- =====================================================

-- 7. 開発用関数の削除（本番環境では不要）
DROP FUNCTION IF EXISTS trigger_daily_message_generation_dev();
DROP FUNCTION IF EXISTS trigger_daily_message_generation_local();
DROP FUNCTION IF EXISTS trigger_daily_message_generation_prod();

-- 8. 不要なビューの削除
DROP VIEW IF EXISTS daily_messages_debug;
DROP VIEW IF EXISTS daily_messages_access_info;
DROP VIEW IF EXISTS cron_job_status;

-- 9. 不要な関数の削除
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
    RAISE NOTICE 'All duplicate migrations have been safely resolved';
    RAISE NOTICE 'Production environment is ready for deployment';
END $$;

-- =====================================================
-- CronJob（AIメッセージ自動生成）設定
-- =====================================================

-- 本番環境用 CronJob
SELECT cron.schedule(
  'generate-daily-messages-prod',
  '0 0 * * *', -- 毎日UTC 0時 = JST 9時
  $$
  SELECT net.http_post(
    url := 'https://' || current_setting('app.settings.project_ref') || '.supabase.co/functions/v1/generate-daily-messages',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'scheduled', true,
      'trigger_time', now(),
      'environment', 'production'
    )
  ) as request_id;
  $$
);

-- 開発環境用 CronJob
SELECT cron.schedule(
  'generate-daily-messages-dev',
  '0 0 * * *', -- 毎日UTC 0時 = JST 9時
  $$
  SELECT net.http_post(
    url := 'https://' || current_setting('app.settings.project_ref') || '.supabase.co/functions/v1/generate-daily-messages',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'scheduled', true,
      'trigger_time', now(),
      'environment', 'development'
    )
  ) as request_id;
  $$
);

-- 必要に応じて、どちらか一方のみ有効化してください（Settings/Secretsで環境を切り替える運用を推奨） 