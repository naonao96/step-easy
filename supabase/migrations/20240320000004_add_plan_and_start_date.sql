-- Add plan_type to users table
ALTER TABLE users ADD COLUMN plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('guest', 'free', 'premium'));

-- Add start_date to tasks table
ALTER TABLE tasks ADD COLUMN start_date DATE;

-- Create index for start_date
CREATE INDEX idx_tasks_start_date ON tasks(start_date);

-- Update existing tasks to have start_date based on created_at
UPDATE tasks SET start_date = DATE(created_at) WHERE start_date IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.plan_type IS 'User plan type: guest, free, or premium';
COMMENT ON COLUMN tasks.start_date IS 'Task start date (when user wants to begin the task)'; 