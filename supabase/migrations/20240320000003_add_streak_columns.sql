-- Add streak columns to tasks table
ALTER TABLE tasks 
ADD COLUMN current_streak INTEGER DEFAULT 0,
ADD COLUMN longest_streak INTEGER DEFAULT 0,
ADD COLUMN last_completed_date DATE,
ADD COLUMN streak_start_date DATE;

-- Create index for better performance on streak queries
CREATE INDEX idx_tasks_streak_dates ON tasks(last_completed_date, streak_start_date);

-- Create function to update streak when task is completed
CREATE OR REPLACE FUNCTION update_task_streak(task_id UUID, completion_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
    task_record RECORD;
    days_diff INTEGER;
BEGIN
    -- Get current task data
    SELECT * INTO task_record FROM tasks WHERE id = task_id;
    
    IF task_record IS NULL THEN
        RETURN;
    END IF;
    
    -- Calculate days difference from last completion
    IF task_record.last_completed_date IS NULL THEN
        -- First completion
        UPDATE tasks SET
            current_streak = 1,
            longest_streak = GREATEST(longest_streak, 1),
            last_completed_date = completion_date,
            streak_start_date = completion_date
        WHERE id = task_id;
    ELSE
        days_diff := completion_date - task_record.last_completed_date;
        
        IF days_diff = 1 THEN
            -- Consecutive day - increment streak
            UPDATE tasks SET
                current_streak = current_streak + 1,
                longest_streak = GREATEST(longest_streak, current_streak + 1),
                last_completed_date = completion_date
            WHERE id = task_id;
        ELSIF days_diff = 0 THEN
            -- Same day - no change to streak
            UPDATE tasks SET
                last_completed_date = completion_date
            WHERE id = task_id;
        ELSE
            -- Streak broken - reset
            UPDATE tasks SET
                current_streak = 1,
                longest_streak = GREATEST(longest_streak, 1),
                last_completed_date = completion_date,
                streak_start_date = completion_date
            WHERE id = task_id;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update streaks when task status changes to 'done'
CREATE OR REPLACE FUNCTION trigger_update_streak()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update streak when status changes to 'done'
    IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status != 'done') THEN
        PERFORM update_task_streak(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_completion_streak_trigger
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_streak(); 