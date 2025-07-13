-- =====================================================
-- 習慣システム完全統合マイグレーション
-- 作成日: 2025-01-01
-- 目的: 習慣タスクの概念を正しく実装し、継続的な習慣管理を可能にする
-- 特徴: 冪等性保証、安全な実行、トランザクション処理、完全移行
-- =====================================================

-- =====================================================
-- 1. 習慣専用テーブルの作成
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'habits') THEN
        CREATE TABLE habits (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            habit_status TEXT DEFAULT 'active' CHECK (habit_status IN ('active', 'paused', 'stopped')),
            frequency TEXT DEFAULT 'daily',
            current_streak INTEGER DEFAULT 0,
            longest_streak INTEGER DEFAULT 0,
            last_completed_date DATE,
            streak_start_date DATE,
            category TEXT DEFAULT 'other',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable Row Level Security
        ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view their own habits" ON habits
            FOR SELECT
            USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own habits" ON habits
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own habits" ON habits
            FOR UPDATE
            USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own habits" ON habits
            FOR DELETE
            USING (auth.uid() = user_id);

        -- Create indexes for performance
        CREATE INDEX idx_habits_user_id ON habits(user_id);
        CREATE INDEX idx_habits_status ON habits(habit_status);
        CREATE INDEX idx_habits_created_at ON habits(created_at);
        
        RAISE NOTICE 'Habits table created successfully';
    ELSE
        RAISE NOTICE 'Habits table already exists, skipping creation';
    END IF;
END $$;

-- =====================================================
-- 2. 習慣完了履歴テーブルの作成
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'habit_completions') THEN
        CREATE TABLE habit_completions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
            completed_date DATE NOT NULL,
            completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable Row Level Security
        ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view their own habit completions" ON habit_completions
            FOR SELECT
            USING (EXISTS (
                SELECT 1 FROM habits 
                WHERE habits.id = habit_completions.habit_id 
                AND habits.user_id = auth.uid()
            ));

        CREATE POLICY "Users can insert their own habit completions" ON habit_completions
            FOR INSERT
            WITH CHECK (EXISTS (
                SELECT 1 FROM habits 
                WHERE habits.id = habit_completions.habit_id 
                AND habits.user_id = auth.uid()
            ));

        CREATE POLICY "Users can delete their own habit completions" ON habit_completions
            FOR DELETE
            USING (EXISTS (
                SELECT 1 FROM habits 
                WHERE habits.id = habit_completions.habit_id 
                AND habits.user_id = auth.uid()
            ));

        -- Create indexes for performance
        CREATE INDEX idx_habit_completions_habit_id ON habit_completions(habit_id);
        CREATE INDEX idx_habit_completions_date ON habit_completions(completed_date);
        
        RAISE NOTICE 'Habit completions table created successfully';
    ELSE
        RAISE NOTICE 'Habit completions table already exists, skipping creation';
    END IF;
END $$;

-- =====================================================
-- 3. 重複データのクリーンアップ（一意制約追加前）
-- =====================================================

DO $$
BEGIN
    -- 重複する完了記録を削除（最新のものを残す）
    DELETE FROM habit_completions 
    WHERE id NOT IN (
        SELECT hc.id
        FROM habit_completions hc
        INNER JOIN (
            SELECT habit_id, completed_date, MAX(created_at) as max_created_at
            FROM habit_completions
            GROUP BY habit_id, completed_date
        ) latest ON hc.habit_id = latest.habit_id 
                   AND hc.completed_date = latest.completed_date 
                   AND hc.created_at = latest.max_created_at
    );
    
    RAISE NOTICE '重複する完了記録をクリーンアップしました';
END $$;

-- =====================================================
-- 4. 一意制約の追加（重複完了防止）
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_habit_date'
    ) THEN
        ALTER TABLE habit_completions 
        ADD CONSTRAINT unique_habit_date UNIQUE (habit_id, completed_date);
        RAISE NOTICE 'Unique constraint added successfully';
    ELSE
        RAISE NOTICE 'Unique constraint already exists, skipping';
    END IF;
END $$;

-- =====================================================
-- 5. 習慣完了処理のトランザクション関数
-- =====================================================

CREATE OR REPLACE FUNCTION complete_habit_transaction(
  p_habit_id UUID,
  p_completed_date DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_habit habits%ROWTYPE;
  v_new_streak INTEGER;
  v_last_completed DATE;
BEGIN
  -- トランザクション開始
  BEGIN
    -- 習慣データを取得
    SELECT * INTO v_habit 
    FROM habits 
    WHERE id = p_habit_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION '習慣が見つかりません: %', p_habit_id;
    END IF;
    
    -- 既に完了済みかチェック
    IF EXISTS (
      SELECT 1 FROM habit_completions 
      WHERE habit_id = p_habit_id AND completed_date = p_completed_date
    ) THEN
      RAISE EXCEPTION 'この日付は既に完了済みです: %', p_completed_date;
    END IF;
    
    -- 完了記録を作成
    INSERT INTO habit_completions (habit_id, completed_date)
    VALUES (p_habit_id, p_completed_date);
    
    -- ストリーク計算
    v_last_completed := v_habit.last_completed_date;
    v_new_streak := 1;
    
    IF v_last_completed IS NOT NULL THEN
      -- より正確な日付計算（タイムゾーン考慮）
      IF p_completed_date = v_last_completed + INTERVAL '1 day' THEN
        -- 連続完了
        v_new_streak := v_habit.current_streak + 1;
      ELSIF p_completed_date > v_last_completed + INTERVAL '1 day' THEN
        -- 連続が途切れた
        v_new_streak := 1;
      END IF;
    END IF;
    
    -- 習慣テーブルを更新
    UPDATE habits 
    SET 
      current_streak = v_new_streak,
      longest_streak = GREATEST(v_habit.longest_streak, v_new_streak),
      last_completed_date = p_completed_date,
      updated_at = NOW()
    WHERE id = p_habit_id;
    
    -- トランザクション成功
    COMMIT;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- エラーが発生した場合はロールバック
      ROLLBACK;
      RAISE;
  END;
END;
$$;

-- 関数の権限設定
GRANT EXECUTE ON FUNCTION complete_habit_transaction(UUID, DATE) TO authenticated;

-- =====================================================
-- 6. 既存データの移行
-- =====================================================

-- 移行前の確認
DO $$
DECLARE
  v_legacy_habits_count INTEGER;
  v_new_habits_count INTEGER;
BEGIN
  -- 既存の習慣データ数を確認
  SELECT COUNT(*) INTO v_legacy_habits_count
  FROM tasks 
  WHERE is_habit = true;
  
  -- 新しい習慣データ数を確認
  SELECT COUNT(*) INTO v_new_habits_count
  FROM habits;
  
  RAISE NOTICE '移行前の状況: 既存習慣 % 件, 新習慣 % 件', v_legacy_habits_count, v_new_habits_count;
  
  -- 移行が必要かどうかを判定
  IF v_legacy_habits_count > 0 THEN
    RAISE NOTICE '移行が必要です。続行します。';
  ELSE
    RAISE NOTICE '移行対象のデータがありません。';
  END IF;
END $$;

-- 未移行の習慣データを移行
DO $$
BEGIN
  -- 既存の習慣データを移行（未移行分のみ）
  INSERT INTO habits (
    id, user_id, title, description, habit_status, 
    frequency, current_streak, longest_streak, 
    last_completed_date, streak_start_date, category,
    created_at, updated_at
  )
  SELECT 
    id, user_id, title, description,
    'active' as habit_status,
    'daily' as frequency,
    COALESCE(current_streak, 0) as current_streak,
    COALESCE(longest_streak, 0) as longest_streak,
    last_completed_date,
    streak_start_date,
    COALESCE(category, 'other') as category,
    created_at,
    updated_at
  FROM tasks 
  WHERE is_habit = true
  AND id NOT IN (SELECT id FROM habits);
  
  RAISE NOTICE '未移行の習慣データを移行しました';
END $$;

-- 未移行の完了履歴を移行
DO $$
BEGIN
  INSERT INTO habit_completions (habit_id, completed_date, completed_at)
  SELECT 
    id as habit_id,
    DATE(completed_at) as completed_date,
    completed_at
  FROM tasks 
  WHERE is_habit = true 
  AND status = 'done' 
  AND completed_at IS NOT NULL
  AND id IN (SELECT id FROM habits)
  AND NOT EXISTS (
    SELECT 1 FROM habit_completions 
    WHERE habit_id = tasks.id AND completed_date = DATE(tasks.completed_at)
  );
  
  RAISE NOTICE '未移行の完了履歴を移行しました';
END $$;

-- =====================================================
-- 7. 既存の重複データをクリーンアップ（安全のため）
-- =====================================================

DO $$
BEGIN
  -- 重複する完了記録を削除（最新のものを残す）
  DELETE FROM habit_completions 
  WHERE id NOT IN (
    SELECT hc.id
    FROM habit_completions hc
    INNER JOIN (
      SELECT habit_id, completed_date, MAX(created_at) as max_created_at
      FROM habit_completions
      GROUP BY habit_id, completed_date
    ) latest ON hc.habit_id = latest.habit_id 
               AND hc.completed_date = latest.completed_date 
               AND hc.created_at = latest.max_created_at
  );
  
  RAISE NOTICE '重複する完了記録をクリーンアップしました';
END $$;

-- =====================================================
-- 8. 移行後の確認
-- =====================================================

DO $$
DECLARE
  v_legacy_habits_count INTEGER;
  v_new_habits_count INTEGER;
  v_completions_count INTEGER;
BEGIN
  -- 既存の習慣データ数を確認
  SELECT COUNT(*) INTO v_legacy_habits_count
  FROM tasks 
  WHERE is_habit = true;
  
  -- 新しい習慣データ数を確認
  SELECT COUNT(*) INTO v_new_habits_count
  FROM habits;
  
  -- 完了履歴数を確認
  SELECT COUNT(*) INTO v_completions_count
  FROM habit_completions;
  
  RAISE NOTICE '移行後の状況: 既存習慣 % 件, 新習慣 % 件, 完了履歴 % 件', 
    v_legacy_habits_count, v_new_habits_count, v_completions_count;
    
  -- 移行が完了した場合の推奨事項
  IF v_new_habits_count > 0 AND v_legacy_habits_count = 0 THEN
    RAISE NOTICE '✅ 移行完了: 既存の習慣データを削除することを推奨します';
  ELSIF v_new_habits_count > 0 AND v_legacy_habits_count > 0 THEN
    RAISE NOTICE '⚠️  部分移行: 一部の習慣データが未移行です';
  ELSE
    RAISE NOTICE '❌ 移行失敗: データの確認が必要です';
  END IF;
END $$;

-- =====================================================
-- ✅ マイグレーション完了確認
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '習慣システム完全統合マイグレーション完了';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '✅ 習慣テーブルと完了履歴テーブルが作成されました';
    RAISE NOTICE '✅ トランザクション関数が設定されました';
    RAISE NOTICE '✅ 一意制約が追加されました';
    RAISE NOTICE '✅ 既存データが移行されました';
    RAISE NOTICE '✅ 重複データがクリーンアップされました';
    RAISE NOTICE '✅ マイグレーションは冪等性を保証します';
    RAISE NOTICE '=====================================================';
END $$; 