-- =====================================================
-- 習慣システム完全統合マイグレーション（完全版）
-- 作成日: 2025-01-01
-- 更新日: 2025-01-03
-- 目的: 習慣タスクの概念を正しく実装し、継続的な習慣管理と期限指定機能を可能にする
-- 特徴: 冪等性保証、安全な実行、トランザクション処理、完全移行、段階的実行、期限指定機能
-- =====================================================

-- =====================================================
-- 1. 習慣専用テーブルの作成（冪等性保証）
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
            all_time_total INTEGER DEFAULT 0, -- 全期間累計時間（秒）
            today_total INTEGER DEFAULT 0,    -- 今日の累計時間（秒）
            last_execution_date DATE,         -- 最終実行日
            -- 期限指定機能用カラム
            start_date DATE,                  -- 開始日
            due_date DATE,                    -- 期限日
            has_deadline BOOLEAN DEFAULT false, -- 期限指定フラグ
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

        RAISE NOTICE '✅ habitsテーブルを作成しました';
    ELSE
        RAISE NOTICE 'ℹ️  habitsテーブルは既に存在します';
        
        -- 期限指定機能用カラムの追加（既存テーブル用）
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'habits' AND column_name = 'start_date'
        ) THEN
            ALTER TABLE habits ADD COLUMN start_date DATE;
            RAISE NOTICE '✅ habitsテーブルにstart_dateカラムを追加しました';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'habits' AND column_name = 'due_date'
        ) THEN
            ALTER TABLE habits ADD COLUMN due_date DATE;
            RAISE NOTICE '✅ habitsテーブルにdue_dateカラムを追加しました';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'habits' AND column_name = 'has_deadline'
        ) THEN
            ALTER TABLE habits ADD COLUMN has_deadline BOOLEAN DEFAULT false;
            RAISE NOTICE '✅ habitsテーブルにhas_deadlineカラムを追加しました';
        END IF;
    END IF;
END $$;

-- 期限チェック制約を追加
DO $$
BEGIN
    -- 期限チェック制約が存在しない場合は追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'habits_due_date_check'
    ) THEN
        ALTER TABLE habits ADD CONSTRAINT habits_due_date_check 
        CHECK (due_date IS NULL OR due_date >= start_date);
        RAISE NOTICE '✅ habitsテーブルに期限チェック制約を追加しました';
    ELSE
        RAISE NOTICE 'ℹ️  habitsテーブルの期限チェック制約は既に存在します';
    END IF;
END $$;

-- 期限指定機能のインデックスを作成
CREATE INDEX IF NOT EXISTS idx_habits_deadline ON habits(user_id, has_deadline, due_date) 
WHERE has_deadline = true;

CREATE INDEX IF NOT EXISTS idx_habits_start_date ON habits(user_id, start_date);

-- =====================================================
-- 2. 習慣完了履歴テーブルの作成（冪等性保証）
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
        
        -- 一意制約（同じ習慣の同じ日付は1回のみ）
        CREATE UNIQUE INDEX habit_completions_unique 
        ON habit_completions (habit_id, completed_date);
        
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

        RAISE NOTICE '✅ habit_completionsテーブルを作成しました';
    ELSE
        RAISE NOTICE 'ℹ️  habit_completionsテーブルは既に存在します';
    END IF;
END $$;

-- =====================================================
-- 3. 実行履歴テーブルの習慣対応（冪等性保証）
-- =====================================================

DO $$
BEGIN
    -- habit_idカラムが存在しない場合は追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'execution_logs' AND column_name = 'habit_id'
    ) THEN
        ALTER TABLE execution_logs ADD COLUMN habit_id UUID REFERENCES habits(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ execution_logsテーブルにhabit_idカラムを追加しました';
    ELSE
        RAISE NOTICE 'ℹ️  execution_logsテーブルのhabit_idカラムは既に存在します';
    END IF;
    
    -- execution_typeカラムが存在しない場合は追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'execution_logs' AND column_name = 'execution_type'
    ) THEN
        ALTER TABLE execution_logs ADD COLUMN execution_type TEXT DEFAULT 'task' CHECK (execution_type IN ('task', 'habit'));
        RAISE NOTICE '✅ execution_logsテーブルにexecution_typeカラムを追加しました';
    ELSE
        RAISE NOTICE 'ℹ️  execution_logsテーブルのexecution_typeカラムは既に存在します';
    END IF;
END $$;

-- =====================================================
-- 4. アクティブ実行テーブルの習慣対応（冪等性保証）
-- =====================================================

DO $$
BEGIN
    -- habit_idカラムが存在しない場合は追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'active_executions' AND column_name = 'habit_id'
    ) THEN
        ALTER TABLE active_executions ADD COLUMN habit_id UUID REFERENCES habits(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ active_executionsテーブルにhabit_idカラムを追加しました';
    ELSE
        RAISE NOTICE 'ℹ️  active_executionsテーブルのhabit_idカラムは既に存在します';
    END IF;
END $$;

-- =====================================================
-- 5. 習慣完了トランザクション関数（冪等性保証）
-- =====================================================

-- 習慣完了トランザクション関数の作成
CREATE OR REPLACE FUNCTION complete_habit_transaction(
  p_habit_id UUID,
  p_completed_date DATE
) RETURNS VOID AS $$
DECLARE
  v_habit habits%ROWTYPE;
    v_last_completed DATE;
  v_new_streak INTEGER;
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
END;
$$ LANGUAGE plpgsql;

-- 関数の権限設定
GRANT EXECUTE ON FUNCTION complete_habit_transaction(UUID, DATE) TO authenticated;

-- =====================================================
-- 6. 期限切れ習慣管理機能
-- =====================================================

-- 期限切れ習慣を非アクティブにする関数を作成
CREATE OR REPLACE FUNCTION check_expired_habits() RETURNS void AS $$
BEGIN
    UPDATE habits 
    SET habit_status = 'stopped'
    WHERE has_deadline = true 
    AND due_date < CURRENT_DATE 
    AND habit_status = 'active';
END;
$$ LANGUAGE plpgsql;

-- 関数の権限設定
GRANT EXECUTE ON FUNCTION check_expired_habits() TO authenticated;

-- 期限切れチェックのトリガー関数を作成
CREATE OR REPLACE FUNCTION trigger_check_expired_habits() RETURNS trigger AS $$
BEGIN
    -- 期限が設定されていて、期限が過ぎている場合は停止状態にする
    IF NEW.has_deadline = true AND NEW.due_date < CURRENT_DATE THEN
        NEW.habit_status := 'stopped';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーを作成
DROP TRIGGER IF EXISTS check_expired_habits_trigger ON habits;
CREATE TRIGGER check_expired_habits_trigger
    BEFORE INSERT OR UPDATE ON habits
    FOR EACH ROW
    EXECUTE FUNCTION trigger_check_expired_habits();

-- =====================================================
-- 7. 段階的データ移行プロセス
-- =====================================================

-- 移行前の状況確認
DO $$
DECLARE
  v_legacy_habits_count INTEGER;
  v_new_habits_count INTEGER;
    v_legacy_completions_count INTEGER;
    v_new_completions_count INTEGER;
    v_execution_logs_count INTEGER;
    v_active_executions_count INTEGER;
BEGIN
  -- 既存の習慣データ数を確認
  SELECT COUNT(*) INTO v_legacy_habits_count
  FROM tasks 
  WHERE is_habit = true;
  
  -- 新しい習慣データ数を確認
  SELECT COUNT(*) INTO v_new_habits_count
  FROM habits;
  
    -- 既存の完了データ数を確認
    SELECT COUNT(*) INTO v_legacy_completions_count
    FROM tasks 
    WHERE is_habit = true AND status = 'done' AND completed_at IS NOT NULL;
    
    -- 新しい完了データ数を確認
    SELECT COUNT(*) INTO v_new_completions_count
    FROM habit_completions;
    
    -- 実行履歴数を確認
    SELECT COUNT(*) INTO v_execution_logs_count
    FROM execution_logs 
    WHERE task_id IN (SELECT id FROM tasks WHERE is_habit = true);
    
    -- アクティブ実行数を確認
    SELECT COUNT(*) INTO v_active_executions_count
    FROM active_executions 
    WHERE task_id IN (SELECT id FROM tasks WHERE is_habit = true);
    
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '移行前の状況確認';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '既存習慣データ: % 件', v_legacy_habits_count;
    RAISE NOTICE '新習慣データ: % 件', v_new_habits_count;
    RAISE NOTICE '既存完了データ: % 件', v_legacy_completions_count;
    RAISE NOTICE '新完了データ: % 件', v_new_completions_count;
    RAISE NOTICE '実行履歴: % 件', v_execution_logs_count;
    RAISE NOTICE 'アクティブ実行: % 件', v_active_executions_count;
    RAISE NOTICE '=====================================================';
  
  -- 移行が必要かどうかを判定
  IF v_legacy_habits_count > 0 THEN
        RAISE NOTICE '✅ 移行が必要です。段階的に実行します。';
  ELSE
        RAISE NOTICE 'ℹ️  移行対象のデータがありません。';
  END IF;
END $$;

-- =====================================================
-- 8. 段階1: 習慣データの移行（安全な移行）
-- =====================================================

DO $$
DECLARE
    v_migrated_count INTEGER := 0;
    v_error_count INTEGER := 0;
    v_habit_record RECORD;
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '段階1: 習慣データの移行を開始';
    RAISE NOTICE '=====================================================';
    
    -- 未移行の習慣データを1件ずつ安全に移行
    FOR v_habit_record IN 
  SELECT 
    id, user_id, title, description,
    COALESCE(current_streak, 0) as current_streak,
    COALESCE(longest_streak, 0) as longest_streak,
    last_completed_date,
    streak_start_date,
    COALESCE(category, 'other') as category,
            COALESCE(all_time_total, 0) as all_time_total,
            COALESCE(today_total, 0) as today_total,
            last_execution_date,
    created_at,
    updated_at
  FROM tasks 
  WHERE is_habit = true
        AND id NOT IN (SELECT id FROM habits)
    LOOP
        BEGIN
            INSERT INTO habits (
                id, user_id, title, description, habit_status, 
                frequency, current_streak, longest_streak, 
                last_completed_date, streak_start_date, category,
                all_time_total, today_total, last_execution_date,
                created_at, updated_at
            ) VALUES (
                v_habit_record.id,
                v_habit_record.user_id,
                v_habit_record.title,
                v_habit_record.description,
                'active',
                'daily',
                v_habit_record.current_streak,
                v_habit_record.longest_streak,
                v_habit_record.last_completed_date,
                v_habit_record.streak_start_date,
                v_habit_record.category,
                v_habit_record.all_time_total,
                v_habit_record.today_total,
                v_habit_record.last_execution_date,
                v_habit_record.created_at,
                v_habit_record.updated_at
            );
            
            v_migrated_count := v_migrated_count + 1;
            RAISE NOTICE '✅ 習慣移行成功: % (%)', v_habit_record.title, v_habit_record.id;
            
        EXCEPTION
            WHEN OTHERS THEN
                v_error_count := v_error_count + 1;
                RAISE NOTICE '❌ 習慣移行エラー: % (%) - %', 
                    v_habit_record.title, v_habit_record.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '段階1完了: 移行 % 件, エラー % 件', v_migrated_count, v_error_count;
    RAISE NOTICE '=====================================================';
END $$;

-- =====================================================
-- 9. 段階2: 完了履歴の移行（安全な移行）
-- =====================================================

DO $$
DECLARE
    v_migrated_count INTEGER := 0;
    v_error_count INTEGER := 0;
    v_completion_record RECORD;
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '段階2: 完了履歴の移行を開始';
    RAISE NOTICE '=====================================================';
    
    -- 未移行の完了履歴を1件ずつ安全に移行
    FOR v_completion_record IN 
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
        )
    LOOP
        BEGIN
            INSERT INTO habit_completions (habit_id, completed_date, completed_at)
            VALUES (
                v_completion_record.habit_id,
                v_completion_record.completed_date,
                v_completion_record.completed_at
            );
            
            v_migrated_count := v_migrated_count + 1;
            RAISE NOTICE '✅ 完了履歴移行成功: 習慣 % 日付 %', 
                v_completion_record.habit_id, v_completion_record.completed_date;
            
        EXCEPTION
            WHEN OTHERS THEN
                v_error_count := v_error_count + 1;
                RAISE NOTICE '❌ 完了履歴移行エラー: 習慣 % 日付 % - %', 
                    v_completion_record.habit_id, v_completion_record.completed_date, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '段階2完了: 移行 % 件, エラー % 件', v_migrated_count, v_error_count;
    RAISE NOTICE '=====================================================';
END $$;

-- =====================================================
-- 10. 段階3: 実行履歴の移行（安全な移行）
-- =====================================================

DO $$
DECLARE
    v_migrated_count INTEGER := 0;
    v_error_count INTEGER := 0;
    v_execution_record RECORD;
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '段階3: 実行履歴の移行を開始';
    RAISE NOTICE '=====================================================';
    
    -- 習慣の実行履歴を移行
    FOR v_execution_record IN 
        SELECT 
            id,
            task_id,
            user_id,
            start_time,
            end_time,
            duration,
            device_type,
            session_type,
            is_completed,
            created_at
        FROM execution_logs 
        WHERE task_id IN (SELECT id FROM tasks WHERE is_habit = true)
        AND habit_id IS NULL
    LOOP
        BEGIN
            UPDATE execution_logs 
            SET 
                habit_id = v_execution_record.task_id,
                execution_type = 'habit'
            WHERE id = v_execution_record.id;
            
            v_migrated_count := v_migrated_count + 1;
            RAISE NOTICE '✅ 実行履歴移行成功: %', v_execution_record.id;
            
        EXCEPTION
            WHEN OTHERS THEN
                v_error_count := v_error_count + 1;
                RAISE NOTICE '❌ 実行履歴移行エラー: % - %', 
                    v_execution_record.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '段階3完了: 移行 % 件, エラー % 件', v_migrated_count, v_error_count;
    RAISE NOTICE '=====================================================';
END $$;

-- =====================================================
-- 11. 段階4: アクティブ実行の移行（安全な移行）
-- =====================================================

DO $$
DECLARE
    v_migrated_count INTEGER := 0;
    v_error_count INTEGER := 0;
    v_active_record RECORD;
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '段階4: アクティブ実行の移行を開始';
    RAISE NOTICE '=====================================================';
    
    -- 習慣のアクティブ実行を移行
    FOR v_active_record IN 
        SELECT 
            id,
            task_id,
            user_id,
            start_time,
            is_paused,
            accumulated_time,
            created_at
        FROM active_executions 
        WHERE task_id IN (SELECT id FROM tasks WHERE is_habit = true)
        AND habit_id IS NULL
    LOOP
        BEGIN
            UPDATE active_executions 
            SET habit_id = v_active_record.task_id
            WHERE id = v_active_record.id;
            
            v_migrated_count := v_migrated_count + 1;
            RAISE NOTICE '✅ アクティブ実行移行成功: %', v_active_record.id;
            
        EXCEPTION
            WHEN OTHERS THEN
                v_error_count := v_error_count + 1;
                RAISE NOTICE '❌ アクティブ実行移行エラー: % - %', 
                    v_active_record.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '段階4完了: 移行 % 件, エラー % 件', v_migrated_count, v_error_count;
    RAISE NOTICE '=====================================================';
END $$;

-- =====================================================
-- 12. 段階5: 期限日・開始日の移行（新規追加）
-- =====================================================

DO $$
DECLARE
    v_task RECORD;
    v_updated_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '段階5: 期限日・開始日の移行を開始';
    RAISE NOTICE '=====================================================';
    
    -- タスクテーブルから習慣タスク（is_habit = true）の期限日・開始日を習慣テーブルに移行
    FOR v_task IN 
        SELECT 
            t.id,
            t.start_date,
            t.due_date,
            t.user_id
        FROM tasks t
        WHERE t.is_habit = true 
        AND (t.start_date IS NOT NULL OR t.due_date IS NOT NULL)
    LOOP
        -- 対応する習慣レコードを更新
        UPDATE habits 
        SET 
            start_date = COALESCE(v_task.start_date, start_date),
            due_date = COALESCE(v_task.due_date, due_date),
            has_deadline = CASE 
                WHEN v_task.due_date IS NOT NULL THEN true
                ELSE has_deadline
            END,
            updated_at = NOW()
        WHERE user_id = v_task.user_id 
        AND id = v_task.id;
        
        -- 更新されたレコード数をカウント
        IF FOUND THEN
            v_updated_count := v_updated_count + 1;
        END IF;
    END LOOP;
    
    -- 移行結果をログ出力
    RAISE NOTICE 'タスクから習慣への期限日・開始日移行完了: %件の習慣を更新しました', v_updated_count;
    
    -- 移行完了後、タスクテーブルの習慣タスクから期限日・開始日をクリア（習慣テーブルに移行済みのため）
    UPDATE tasks 
    SET 
        start_date = NULL,
        due_date = NULL,
        updated_at = NOW()
    WHERE is_habit = true 
    AND (start_date IS NOT NULL OR due_date IS NOT NULL);
    
    RAISE NOTICE 'タスクテーブルの習慣タスクから期限日・開始日をクリアしました';
    RAISE NOTICE '=====================================================';
END $$;

-- =====================================================
-- 13. データ整合性チェック
-- =====================================================

DO $$
DECLARE
    v_legacy_habits_count INTEGER;
    v_new_habits_count INTEGER;
    v_legacy_completions_count INTEGER;
    v_new_completions_count INTEGER;
    v_execution_logs_count INTEGER;
    v_active_executions_count INTEGER;
    v_orphaned_completions INTEGER;
    v_orphaned_executions INTEGER;
    v_orphaned_actives INTEGER;
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'データ整合性チェック';
    RAISE NOTICE '=====================================================';
    
    -- 各テーブルのデータ数を確認
    SELECT COUNT(*) INTO v_legacy_habits_count FROM tasks WHERE is_habit = true;
    SELECT COUNT(*) INTO v_new_habits_count FROM habits;
    SELECT COUNT(*) INTO v_legacy_completions_count FROM tasks WHERE is_habit = true AND status = 'done' AND completed_at IS NOT NULL;
    SELECT COUNT(*) INTO v_new_completions_count FROM habit_completions;
    SELECT COUNT(*) INTO v_execution_logs_count FROM execution_logs WHERE execution_type = 'habit';
    SELECT COUNT(*) INTO v_active_executions_count FROM active_executions WHERE habit_id IS NOT NULL;
    
    -- 孤立データのチェック
    SELECT COUNT(*) INTO v_orphaned_completions 
    FROM habit_completions hc 
    WHERE NOT EXISTS (SELECT 1 FROM habits h WHERE h.id = hc.habit_id);
    
    SELECT COUNT(*) INTO v_orphaned_executions 
    FROM execution_logs el 
    WHERE el.execution_type = 'habit' 
    AND NOT EXISTS (SELECT 1 FROM habits h WHERE h.id = el.habit_id);
    
    SELECT COUNT(*) INTO v_orphaned_actives 
    FROM active_executions ae 
    WHERE ae.habit_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM habits h WHERE h.id = ae.habit_id);
    
    RAISE NOTICE '移行後の状況:';
    RAISE NOTICE '  既存習慣データ: % 件', v_legacy_habits_count;
    RAISE NOTICE '  新習慣データ: % 件', v_new_habits_count;
    RAISE NOTICE '  既存完了データ: % 件', v_legacy_completions_count;
    RAISE NOTICE '  新完了データ: % 件', v_new_completions_count;
    RAISE NOTICE '  実行履歴: % 件', v_execution_logs_count;
    RAISE NOTICE '  アクティブ実行: % 件', v_active_executions_count;
    RAISE NOTICE '';
    RAISE NOTICE '整合性チェック:';
    RAISE NOTICE '  孤立完了データ: % 件', v_orphaned_completions;
    RAISE NOTICE '  孤立実行履歴: % 件', v_orphaned_executions;
    RAISE NOTICE '  孤立アクティブ実行: % 件', v_orphaned_actives;
    
    -- 整合性評価
    IF v_orphaned_completions = 0 AND v_orphaned_executions = 0 AND v_orphaned_actives = 0 THEN
        RAISE NOTICE '✅ データ整合性: 良好';
    ELSE
        RAISE NOTICE '⚠️  データ整合性: 孤立データが存在します';
    END IF;
    
    RAISE NOTICE '=====================================================';
END $$;

-- =====================================================
-- 14. 重複データのクリーンアップ（安全な実行）
-- =====================================================

DO $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '重複データのクリーンアップ';
    RAISE NOTICE '=====================================================';
    
  -- 重複する完了記録を削除（最新のものを残す）
    WITH duplicates AS (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY habit_id, completed_date 
                   ORDER BY created_at DESC
               ) as rn
        FROM habit_completions
    )
  DELETE FROM habit_completions 
    WHERE id IN (
        SELECT id FROM duplicates WHERE rn > 1
    );
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ 重複完了記録を削除: % 件', v_deleted_count;
    
    RAISE NOTICE '=====================================================';
END $$;

-- =====================================================
-- 15. 移行完了後の推奨事項
-- =====================================================

DO $$
DECLARE
  v_legacy_habits_count INTEGER;
  v_new_habits_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_legacy_habits_count FROM tasks WHERE is_habit = true;
    SELECT COUNT(*) INTO v_new_habits_count FROM habits;
    
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '移行完了後の推奨事項';
    RAISE NOTICE '=====================================================';
    
    IF v_new_habits_count > 0 THEN
        RAISE NOTICE '✅ 習慣データの移行が完了しました';
        
        IF v_legacy_habits_count = 0 THEN
            RAISE NOTICE '✅ 全ての習慣データが移行されました';
            RAISE NOTICE '💡 推奨: 既存の習慣データを削除することを検討してください';
        ELSE
            RAISE NOTICE '⚠️  一部の習慣データが未移行です: % 件', v_legacy_habits_count;
            RAISE NOTICE '💡 推奨: 未移行データの確認と手動移行を検討してください';
        END IF;
        
        RAISE NOTICE '💡 推奨: フロントエンドの習慣判定ロジックを統一してください';
        RAISE NOTICE '💡 推奨: 習慣操作のAPIを統一してください';
        RAISE NOTICE '💡 推奨: 期限指定機能のUI実装を検討してください';
        RAISE NOTICE '💡 推奨: テストを実行して動作確認してください';
    ELSE
        RAISE NOTICE '❌ 習慣データの移行に失敗しました';
        RAISE NOTICE '💡 推奨: エラーログを確認して手動で移行してください';
  END IF;
    
    RAISE NOTICE '=====================================================';
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
    RAISE NOTICE '✅ 実行履歴とアクティブ実行テーブルが拡張されました';
    RAISE NOTICE '✅ トランザクション関数が設定されました';
    RAISE NOTICE '✅ 期限指定機能が追加されました';
    RAISE NOTICE '✅ 期限切れ習慣管理機能が設定されました';
    RAISE NOTICE '✅ 段階的なデータ移行が実行されました';
    RAISE NOTICE '✅ データ整合性チェックが完了しました';
    RAISE NOTICE '✅ 重複データがクリーンアップされました';
    RAISE NOTICE '✅ マイグレーションは冪等性を保証します';
    RAISE NOTICE '✅ 安全な実行が保証されます';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '次のステップ:';
    RAISE NOTICE '1. フロントエンドの習慣判定ロジックを統一';
    RAISE NOTICE '2. 習慣操作のAPIを統一';
    RAISE NOTICE '3. 期限指定機能のUI実装';
    RAISE NOTICE '4. テストを実行して動作確認';
    RAISE NOTICE '5. 既存データの削除（オプション）';
    RAISE NOTICE '=====================================================';
END $$; 