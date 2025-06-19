-- タスクにカテゴリ機能を追加（既存のカラムとの競合を避ける）
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'other';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_duration INTEGER; -- 予想所要時間（分）
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_duration INTEGER; -- 実際の所要時間（分）

-- カテゴリのインデックスを追加（検索高速化）
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);

-- カテゴリの制約を追加（有効な値のみ許可）
DO $$ 
BEGIN
    -- 既存の制約を削除してから新しい制約を追加
    ALTER TABLE tasks DROP CONSTRAINT IF EXISTS check_category;
    ALTER TABLE tasks ADD CONSTRAINT check_category 
    CHECK (category IN ('work', 'health', 'study', 'personal', 'hobby', 'other'));
EXCEPTION
    WHEN OTHERS THEN
        -- 制約追加に失敗した場合は無視（すでに存在する可能性）
        NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE tasks DROP CONSTRAINT IF EXISTS check_estimated_duration;
    ALTER TABLE tasks ADD CONSTRAINT check_estimated_duration 
    CHECK (estimated_duration IS NULL OR estimated_duration > 0);
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE tasks DROP CONSTRAINT IF EXISTS check_actual_duration;
    ALTER TABLE tasks ADD CONSTRAINT check_actual_duration 
    CHECK (actual_duration IS NULL OR actual_duration > 0);
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$; 