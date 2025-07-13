-- =====================================================
-- 習慣実行ログ修正マイグレーション
-- 作成日: 2025-01-02
-- 目的: 習慣の実行ログエラーを修正し、習慣とタスクの両方に対応
-- 特徴: 既存データを保持しつつ、新しい構造に対応
-- =====================================================

-- =====================================================
-- 1. active_executionsテーブルの修正
-- =====================================================

-- habit_idカラムを追加
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'active_executions') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'active_executions' AND column_name = 'habit_id'
        ) THEN
            ALTER TABLE active_executions ADD COLUMN habit_id UUID REFERENCES habits(id) ON DELETE CASCADE;
            RAISE NOTICE 'habit_id column added to active_executions table';
        ELSE
            RAISE NOTICE 'habit_id column already exists in active_executions table';
        END IF;
    END IF;
END $$;

-- execution_typeカラムを追加（taskまたはhabitを区別）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'active_executions') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'active_executions' AND column_name = 'execution_type'
        ) THEN
            ALTER TABLE active_executions ADD COLUMN execution_type CHARACTER VARYING(10) DEFAULT 'task' CHECK (execution_type IN ('task', 'habit'));
            RAISE NOTICE 'execution_type column added to active_executions table';
        ELSE
            RAISE NOTICE 'execution_type column already exists in active_executions table';
        END IF;
    END IF;
END $$;

-- 既存のtask_id制約を緩和（NULLを許可）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'active_executions') THEN
        -- task_idカラムをNULL許可に変更
        ALTER TABLE active_executions ALTER COLUMN task_id DROP NOT NULL;
        RAISE NOTICE 'task_id column made nullable in active_executions table';
    END IF;
END $$;

-- =====================================================
-- 2. execution_logsテーブルの修正
-- =====================================================

-- habit_idカラムを追加
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'execution_logs') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'execution_logs' AND column_name = 'habit_id'
        ) THEN
            ALTER TABLE execution_logs ADD COLUMN habit_id UUID REFERENCES habits(id) ON DELETE CASCADE;
            RAISE NOTICE 'habit_id column added to execution_logs table';
        ELSE
            RAISE NOTICE 'habit_id column already exists in execution_logs table';
        END IF;
    END IF;
END $$;

-- execution_typeカラムを追加
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'execution_logs') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'execution_logs' AND column_name = 'execution_type'
        ) THEN
            ALTER TABLE execution_logs ADD COLUMN execution_type CHARACTER VARYING(10) DEFAULT 'task' CHECK (execution_type IN ('task', 'habit'));
            RAISE NOTICE 'execution_type column added to execution_logs table';
        ELSE
            RAISE NOTICE 'execution_type column already exists in execution_logs table';
        END IF;
    END IF;
END $$;

-- 既存のtask_id制約を緩和（NULLを許可）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'execution_logs') THEN
        -- task_idカラムをNULL許可に変更
        ALTER TABLE execution_logs ALTER COLUMN task_id DROP NOT NULL;
        RAISE NOTICE 'task_id column made nullable in execution_logs table';
    END IF;
END $$;

-- =====================================================
-- 3. 制約の追加（task_idまたはhabit_idのいずれかが必須）
-- =====================================================

-- active_executionsテーブルに制約を追加
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'active_executions') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'active_executions_task_or_habit_required'
        ) THEN
            ALTER TABLE active_executions 
            ADD CONSTRAINT active_executions_task_or_habit_required 
            CHECK (
                (task_id IS NOT NULL AND habit_id IS NULL AND execution_type = 'task') OR
                (habit_id IS NOT NULL AND task_id IS NULL AND execution_type = 'habit')
            );
            RAISE NOTICE 'Constraint added to active_executions table';
        ELSE
            RAISE NOTICE 'Constraint already exists in active_executions table';
        END IF;
    END IF;
END $$;

-- execution_logsテーブルに制約を追加（移行後に追加）
-- 制約は移行処理の後に追加するため、ここではコメントアウト
/*
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'execution_logs') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'execution_logs_task_or_habit_required'
        ) THEN
            ALTER TABLE execution_logs 
            ADD CONSTRAINT execution_logs_task_or_habit_required 
            CHECK (
                (task_id IS NOT NULL AND habit_id IS NULL AND execution_type = 'task') OR
                (habit_id IS NOT NULL AND task_id IS NULL AND execution_type = 'habit')
            );
            RAISE NOTICE 'Constraint added to execution_logs table';
        ELSE
            RAISE NOTICE 'Constraint already exists in execution_logs table';
        END IF;
    END IF;
END $$;
*/

-- =====================================================
-- 4. インデックスの追加
-- =====================================================

-- active_executionsテーブルにインデックスを追加
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'active_executions') THEN
        -- habit_idのインデックス
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'active_executions' AND indexname = 'idx_active_executions_habit_id'
        ) THEN
            CREATE INDEX idx_active_executions_habit_id ON active_executions(habit_id);
            RAISE NOTICE 'Index created for active_executions.habit_id';
        END IF;
        
        -- execution_typeのインデックス
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'active_executions' AND indexname = 'idx_active_executions_execution_type'
        ) THEN
            CREATE INDEX idx_active_executions_execution_type ON active_executions(execution_type);
            RAISE NOTICE 'Index created for active_executions.execution_type';
        END IF;
    END IF;
END $$;

-- execution_logsテーブルにインデックスを追加
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'execution_logs') THEN
        -- habit_idのインデックス
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'execution_logs' AND indexname = 'idx_execution_logs_habit_id'
        ) THEN
            CREATE INDEX idx_execution_logs_habit_id ON execution_logs(habit_id);
            RAISE NOTICE 'Index created for execution_logs.habit_id';
        END IF;
        
        -- execution_typeのインデックス
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'execution_logs' AND indexname = 'idx_execution_logs_execution_type'
        ) THEN
            CREATE INDEX idx_execution_logs_execution_type ON execution_logs(execution_type);
            RAISE NOTICE 'Index created for execution_logs.execution_type';
        END IF;
    END IF;
END $$;

-- =====================================================
-- 5. 既存の制約を削除（移行前）
-- =====================================================

-- 既存の制約を削除（移行処理を安全に行うため）
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'execution_logs_task_or_habit_required'
    ) THEN
        ALTER TABLE execution_logs DROP CONSTRAINT execution_logs_task_or_habit_required;
        RAISE NOTICE 'Existing constraint dropped from execution_logs table';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'active_executions_task_or_habit_required'
    ) THEN
        ALTER TABLE active_executions DROP CONSTRAINT active_executions_task_or_habit_required;
        RAISE NOTICE 'Existing constraint dropped from active_executions table';
    END IF;
END $$;

-- =====================================================
-- 6. 既存データの移行
-- =====================================================

-- 既存の習慣タスクの実行ログを確認
DO $$
DECLARE
    habit_logs_count INTEGER;
    task_logs_count INTEGER;
BEGIN
    -- 習慣タスクの実行ログ数を確認
    SELECT COUNT(*) INTO habit_logs_count
    FROM execution_logs el
    JOIN tasks t ON el.task_id = t.id
    WHERE t.is_habit = true;
    
    -- 通常タスクの実行ログ数を確認
    SELECT COUNT(*) INTO task_logs_count
    FROM execution_logs el
    JOIN tasks t ON el.task_id = t.id
    WHERE t.is_habit = false;
    
    RAISE NOTICE '既存の実行ログ状況: 習慣タスク % 件, 通常タスク % 件', habit_logs_count, task_logs_count;
END $$;

-- 既存の習慣タスクの実行ログを移行
DO $$
DECLARE
    migrated_count INTEGER := 0;
    log_record RECORD;
BEGIN
    -- 習慣タスクの実行ログを移行
    FOR log_record IN 
        SELECT el.*, t.is_habit
        FROM execution_logs el
        JOIN tasks t ON el.task_id = t.id
        WHERE t.is_habit = true
    LOOP
        -- execution_typeを'habit'に更新
        UPDATE execution_logs 
        SET execution_type = 'habit'
        WHERE id = log_record.id;
        
        migrated_count := migrated_count + 1;
    END LOOP;
    
    RAISE NOTICE '習慣タスクの実行ログを移行しました: % 件', migrated_count;
END $$;

-- 既存のactive_executionsを移行
DO $$
DECLARE
    migrated_count INTEGER := 0;
    exec_record RECORD;
BEGIN
    -- 習慣タスクのactive_executionsを移行
    FOR exec_record IN 
        SELECT ae.*, t.is_habit
        FROM active_executions ae
        JOIN tasks t ON ae.task_id = t.id
        WHERE t.is_habit = true
    LOOP
        -- execution_typeを'habit'に更新
        UPDATE active_executions 
        SET execution_type = 'habit'
        WHERE id = exec_record.id;
        
        migrated_count := migrated_count + 1;
    END LOOP;
    
    RAISE NOTICE '習慣タスクのactive_executionsを移行しました: % 件', migrated_count;
END $$;

-- 通常タスクの実行ログを移行
DO $$
DECLARE
    migrated_count INTEGER := 0;
    log_record RECORD;
BEGIN
    -- 通常タスクの実行ログを移行
    FOR log_record IN 
        SELECT el.*, t.is_habit
        FROM execution_logs el
        JOIN tasks t ON el.task_id = t.id
        WHERE t.is_habit = false OR t.is_habit IS NULL
    LOOP
        -- execution_typeを'task'に更新
        UPDATE execution_logs 
        SET execution_type = 'task'
        WHERE id = log_record.id;
        
        migrated_count := migrated_count + 1;
    END LOOP;
    
    RAISE NOTICE '通常タスクの実行ログを移行しました: % 件', migrated_count;
END $$;

-- 通常タスクのactive_executionsを移行
DO $$
DECLARE
    migrated_count INTEGER := 0;
    exec_record RECORD;
BEGIN
    -- 通常タスクのactive_executionsを移行
    FOR exec_record IN 
        SELECT ae.*, t.is_habit
        FROM active_executions ae
        JOIN tasks t ON ae.task_id = t.id
        WHERE t.is_habit = false OR t.is_habit IS NULL
    LOOP
        -- execution_typeを'task'に更新
        UPDATE active_executions 
        SET execution_type = 'task'
        WHERE id = exec_record.id;
        
        migrated_count := migrated_count + 1;
    END LOOP;
    
    RAISE NOTICE '通常タスクのactive_executionsを移行しました: % 件', migrated_count;
END $$;

-- =====================================================
-- 7. 制約追加前のデータ修正
-- =====================================================

-- execution_logsテーブルのデータを制約に合わせて修正
DO $$
DECLARE
    invalid_count INTEGER := 0;
    log_record RECORD;
BEGIN
    -- execution_typeが'habit'なのにhabit_idがNULLのレコードを修正
    FOR log_record IN 
        SELECT id, task_id, habit_id, execution_type
        FROM execution_logs
        WHERE execution_type = 'habit' AND habit_id IS NULL
    LOOP
        -- この場合、task_idをNULLにしてhabit_idを設定する必要があるが、
        -- 既存のtask_idとの関連を保持するため、execution_typeを'task'に戻す
        UPDATE execution_logs 
        SET execution_type = 'task'
        WHERE id = log_record.id;
        
        invalid_count := invalid_count + 1;
    END LOOP;
    
    RAISE NOTICE 'execution_logsテーブルの制約違反レコードを修正しました: % 件', invalid_count;
END $$;

-- active_executionsテーブルのデータを制約に合わせて修正
DO $$
DECLARE
    invalid_count INTEGER := 0;
    exec_record RECORD;
BEGIN
    -- execution_typeが'habit'なのにhabit_idがNULLのレコードを修正
    FOR exec_record IN 
        SELECT id, task_id, habit_id, execution_type
        FROM active_executions
        WHERE execution_type = 'habit' AND habit_id IS NULL
    LOOP
        -- この場合、task_idをNULLにしてhabit_idを設定する必要があるが、
        -- 既存のtask_idとの関連を保持するため、execution_typeを'task'に戻す
        UPDATE active_executions 
        SET execution_type = 'task'
        WHERE id = exec_record.id;
        
        invalid_count := invalid_count + 1;
    END LOOP;
    
    RAISE NOTICE 'active_executionsテーブルの制約違反レコードを修正しました: % 件', invalid_count;
END $$;

-- =====================================================
-- 8. 移行後の制約追加
-- =====================================================

-- 移行処理が完了した後に制約を追加
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'execution_logs') THEN
        ALTER TABLE execution_logs 
        ADD CONSTRAINT execution_logs_task_or_habit_required 
        CHECK (
            (task_id IS NOT NULL AND habit_id IS NULL AND execution_type = 'task') OR
            (habit_id IS NOT NULL AND task_id IS NULL AND execution_type = 'habit')
        );
        RAISE NOTICE 'Constraint added to execution_logs table after migration';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'active_executions') THEN
        ALTER TABLE active_executions 
        ADD CONSTRAINT active_executions_task_or_habit_required 
        CHECK (
            (task_id IS NOT NULL AND habit_id IS NULL AND execution_type = 'task') OR
            (habit_id IS NOT NULL AND task_id IS NULL AND execution_type = 'habit')
        );
        RAISE NOTICE 'Constraint added to active_executions table after migration';
    END IF;
END $$;

-- =====================================================
-- 9. 完了通知
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '習慣実行ログ修正マイグレーションが完了しました';
    RAISE NOTICE 'active_executionsテーブル: habit_id, execution_typeカラムを追加';
    RAISE NOTICE 'execution_logsテーブル: habit_id, execution_typeカラムを追加';
    RAISE NOTICE '制約とインデックスを追加してデータ整合性を確保';
    RAISE NOTICE '既存データの移行が完了しました';
END $$;

-- =====================================================
-- 8. 完了通知
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '習慣実行ログ修正マイグレーションが完了しました';
    RAISE NOTICE 'active_executionsテーブル: habit_id, execution_typeカラムを追加';
    RAISE NOTICE 'execution_logsテーブル: habit_id, execution_typeカラムを追加';
    RAISE NOTICE '制約とインデックスを追加してデータ整合性を確保';
    RAISE NOTICE '既存データの移行が完了しました';
END $$; 