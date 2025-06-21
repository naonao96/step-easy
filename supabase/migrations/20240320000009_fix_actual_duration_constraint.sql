-- Fix actual_duration constraint to allow 0 values
-- This resolves the issue where short duration tasks (< 1 minute) fail to save

-- Drop the existing constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS check_actual_duration;

-- Add new constraint that allows NULL, 0, or positive values
ALTER TABLE tasks ADD CONSTRAINT check_actual_duration 
CHECK (actual_duration IS NULL OR actual_duration >= 0);

-- Update comment for documentation
COMMENT ON COLUMN tasks.actual_duration IS 'Actual task duration in minutes (NULL, 0, or positive values allowed)'; 