-- tasksテーブルから習慣データを削除
-- Phase 1: データ構造の完全分離

-- 1. 習慣データを削除（is_habit = trueのレコード）
DELETE FROM tasks WHERE is_habit = true;

-- 2. is_habitカラムを削除
ALTER TABLE tasks DROP COLUMN IF EXISTS is_habit;

-- 3. 習慣関連のカラムを削除
ALTER TABLE tasks DROP COLUMN IF EXISTS habit_frequency;

-- 4. インデックスの更新（必要に応じて）
-- 既存のインデックスは自動的に更新されるため、特別な処理は不要

-- 5. 制約の確認と更新
-- tasksテーブルが正常に動作することを確認 