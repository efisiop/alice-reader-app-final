-- Reading Statistics Enhancements Migration Script for Alice Reader
-- This script enhances the reading statistics system with detailed tracking and analysis

-- 1. Create reading_sessions table for tracking daily reading activity
CREATE TABLE IF NOT EXISTS reading_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  duration INTEGER DEFAULT 0, -- in seconds
  pages_read INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id, date)
);

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_id ON reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_book_id ON reading_sessions(book_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_date ON reading_sessions(date);

-- 3. Set up RLS policies for reading_sessions
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own reading sessions
CREATE POLICY "Users can view their own reading sessions"
ON reading_sessions FOR SELECT USING (user_id = auth.uid());

-- Users can update their own reading sessions
CREATE POLICY "Users can update their own reading sessions"
ON reading_sessions FOR UPDATE USING (user_id = auth.uid());

-- Users can insert their own reading sessions
CREATE POLICY "Users can insert their own reading sessions"
ON reading_sessions FOR INSERT WITH CHECK (user_id = auth.uid());

-- Consultants can view all reading sessions
CREATE POLICY "Consultants can view all reading sessions"
ON reading_sessions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM consultant_users WHERE user_id = auth.uid() AND is_active = true
));

-- 4. Create trigger for updating timestamps
DROP TRIGGER IF EXISTS update_reading_sessions_timestamp ON reading_sessions;
CREATE TRIGGER update_reading_sessions_timestamp
BEFORE UPDATE ON reading_sessions
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 5. Create function to get reading statistics
CREATE OR REPLACE FUNCTION get_reading_statistics(
  p_user_id UUID,
  p_book_id UUID
)
RETURNS TABLE (
  total_reading_time INTEGER,
  pages_read INTEGER,
  percentage_complete FLOAT,
  streak_days INTEGER,
  longest_streak INTEGER,
  average_session_duration INTEGER,
  total_sessions INTEGER,
  reading_pace FLOAT,
  estimated_completion_date DATE
) AS $$
DECLARE
  v_total_pages INTEGER;
  v_current_streak INTEGER := 0;
  v_longest_streak INTEGER := 0;
  v_last_date DATE := NULL;
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_reading_pace FLOAT := 0;
  v_pages_remaining INTEGER := 0;
  v_estimated_days INTEGER := 30; -- Default to 30 days
BEGIN
  -- Get book total pages
  SELECT total_pages INTO v_total_pages
  FROM books
  WHERE id = p_book_id;
  
  -- If no book found, use default value
  IF v_total_pages IS NULL THEN
    v_total_pages := 100;
  END IF;
  
  -- Get reading stats
  SELECT 
    rs.total_reading_time,
    rs.pages_read,
    LEAST(100, ROUND((rs.pages_read::FLOAT / v_total_pages) * 100)) AS percentage_complete
  INTO
    total_reading_time,
    pages_read,
    percentage_complete
  FROM reading_stats rs
  WHERE rs.user_id = p_user_id AND rs.book_id = p_book_id;
  
  -- Calculate reading pace (pages per hour)
  IF total_reading_time > 0 THEN
    v_reading_pace := (pages_read::FLOAT / (total_reading_time / 3600));
  END IF;
  
  -- Calculate estimated completion date
  IF percentage_complete > 0 AND percentage_complete < 100 AND v_reading_pace > 0 THEN
    v_pages_remaining := v_total_pages - pages_read;
    v_estimated_days := CEIL(v_pages_remaining / (v_reading_pace * 1)); -- Assume 1 hour of reading per day
  END IF;
  
  -- Get session statistics
  SELECT
    COUNT(*) AS session_count,
    COALESCE(AVG(duration), 0) AS avg_duration
  INTO
    total_sessions,
    average_session_duration
  FROM reading_sessions
  WHERE user_id = p_user_id AND book_id = p_book_id;
  
  -- Calculate streak
  FOR session_date IN 
    SELECT DISTINCT date
    FROM reading_sessions
    WHERE user_id = p_user_id
    ORDER BY date DESC
  LOOP
    -- Check if this is the first date
    IF v_last_date IS NULL THEN
      v_last_date := session_date;
      
      -- Check if the most recent date is today or yesterday
      IF session_date = v_today OR session_date = v_yesterday THEN
        v_current_streak := 1;
        v_longest_streak := 1;
      ELSE
        -- Streak is broken
        v_current_streak := 0;
        v_longest_streak := 0;
      END IF;
    ELSE
      -- Check if dates are consecutive
      IF session_date = v_last_date - INTERVAL '1 day' THEN
        v_current_streak := v_current_streak + 1;
        v_longest_streak := GREATEST(v_longest_streak, v_current_streak);
      ELSE
        -- Streak is broken
        v_current_streak := 0;
      END IF;
      
      v_last_date := session_date;
    END IF;
  END LOOP;
  
  -- Set streak days and longest streak
  streak_days := v_current_streak;
  longest_streak := v_longest_streak;
  
  -- Set reading pace
  reading_pace := v_reading_pace;
  
  -- Set estimated completion date
  estimated_completion_date := CURRENT_DATE + (v_estimated_days * INTERVAL '1 day');
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
