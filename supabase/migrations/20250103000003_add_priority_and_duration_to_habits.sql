-- 習慣テーブルに優先度と予想時間カラムを追加
-- 作成日: 2025-01-03
-- 目的: UIで使用している優先度と予想時間をデータベースに保存できるようにする

-- 1. 優先度カラムの追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'habits' AND column_name = 'priority'
    ) THEN
        ALTER TABLE habits ADD COLUMN priority TEXT DEFAULT 'medium' 
        CHECK (priority IN ('low', 'medium', 'high'));
        RAISE NOTICE '✅ habitsテーブルにpriorityカラムを追加しました';
    ELSE
        RAISE NOTICE 'ℹ️  habitsテーブルのpriorityカラムは既に存在します';
    END IF;
END $$;

-- 2. 予想時間カラムの追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'habits' AND column_name = 'estimated_duration'
    ) THEN
        ALTER TABLE habits ADD COLUMN estimated_duration INTEGER;
        RAISE NOTICE '✅ habitsテーブルにestimated_durationカラムを追加しました';
    ELSE
        RAISE NOTICE 'ℹ️  habitsテーブルのestimated_durationカラムは既に存在します';
    END IF;
END $$;

-- 3. インデックスの作成（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_habits_priority ON habits(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_habits_estimated_duration ON habits(user_id, estimated_duration);

-- 4. 制約の確認
DO $$
BEGIN
    -- 優先度の制約が正しく設定されているか確認
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'habits_priority_check'
    ) THEN
        ALTER TABLE habits ADD CONSTRAINT habits_priority_check 
        CHECK (priority IN ('low', 'medium', 'high'));
        RAISE NOTICE '✅ habitsテーブルにpriority制約を追加しました';
    ELSE
        RAISE NOTICE 'ℹ️  habitsテーブルのpriority制約は既に存在します';
    END IF;
END $$;

-- 5. due_dateをTIMESTAMP WITH TIME ZONE型に統一（習慣とタスクの期限日形式統一）
DO $$
BEGIN
    -- due_dateカラムがDATE型かどうかチェック
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'habits' 
        AND column_name = 'due_date' 
        AND data_type = 'date'
    ) THEN
        -- 既存のdue_dateカラムを一時的にリネーム
        ALTER TABLE habits RENAME COLUMN due_date TO due_date_old;
        
        -- 新しいTIMESTAMP WITH TIME ZONE型のdue_dateカラムを作成
        ALTER TABLE habits ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;
        
        -- 既存データを移行（DATE型からTIMESTAMP WITH TIME ZONE型へ）
        -- 時刻情報がない場合は00:00:00+09:00に設定
        UPDATE habits 
        SET due_date = CASE 
          WHEN due_date_old IS NOT NULL 
          THEN (due_date_old::text || 'T00:00:00+09:00')::timestamp with time zone
          ELSE NULL 
        END;
        
        -- 古いカラムを削除
        ALTER TABLE habits DROP COLUMN due_date_old;
        
        -- インデックスを再作成
        CREATE INDEX IF NOT EXISTS idx_habits_due_date ON habits(due_date);
        
        -- コメントを追加
        COMMENT ON COLUMN habits.due_date IS '期限日（TIMESTAMP WITH TIME ZONE型、時刻情報を含む）';
        
        RAISE NOTICE '✅ habitsテーブルのdue_dateをTIMESTAMP WITH TIME ZONE型に統一しました';
    ELSE
        RAISE NOTICE 'ℹ️  habitsテーブルのdue_dateは既にTIMESTAMP WITH TIME ZONE型です';
    END IF;
END $$; 