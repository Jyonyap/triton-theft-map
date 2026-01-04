-- Create user_feedback table for collecting user feedback
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('bug', 'feature', 'improvement', 'other')),
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_feedback_created ON user_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON user_feedback(category);

-- Add comments
COMMENT ON TABLE user_feedback IS 'User feedback submissions for monitoring and improvements';
COMMENT ON COLUMN user_feedback.category IS 'Type of feedback: bug, feature, improvement, other';
COMMENT ON COLUMN user_feedback.status IS 'Processing status: pending, reviewed, resolved';
