-- Create user_feedback table
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('onboarding', 'weekly', 'monthly')),
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  usability_rating INTEGER CHECK (usability_rating >= 1 AND usability_rating <= 5),
  functionality_rating INTEGER CHECK (functionality_rating >= 1 AND functionality_rating <= 5),
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  comments TEXT,
  suggestions TEXT[],
  would_recommend BOOLEAN,
  favorite_feature TEXT,
  improvement_areas TEXT[],
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_type ON user_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_user_feedback_timestamp ON user_feedback(timestamp);

-- Enable Row Level Security
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own feedback" ON user_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback" ON user_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback" ON user_feedback
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback" ON user_feedback
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update created_at timestamp
CREATE OR REPLACE FUNCTION update_created_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update created_at
CREATE TRIGGER update_user_feedback_created_at
  BEFORE UPDATE ON user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_created_at_column(); 