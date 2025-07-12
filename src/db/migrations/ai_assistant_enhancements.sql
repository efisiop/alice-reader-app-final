-- AI Assistant Enhancements Migration Script for Alice Reader
-- This script enhances the AI interactions table and adds related functions

-- 1. Ensure the ai_interactions table exists with all needed columns
CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id),
  section_id UUID REFERENCES sections(id),
  prompt TEXT NOT NULL,
  context TEXT,
  response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  interaction_type VARCHAR(50) DEFAULT 'chat',
  metadata JSONB
);

-- 2. Add indexes to the ai_interactions table for better performance
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_book_id ON ai_interactions(book_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_section_id ON ai_interactions(section_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_created_at ON ai_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_interaction_type ON ai_interactions(interaction_type);

-- 3. Create RLS policies for ai_interactions table
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own interactions
CREATE POLICY ai_interactions_select ON ai_interactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Policy for users to insert their own interactions
CREATE POLICY ai_interactions_insert ON ai_interactions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy for consultants to view all interactions
CREATE POLICY ai_interactions_select_consultant ON ai_interactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM consultant_users cu
      WHERE cu.user_id = auth.uid()
    )
  );

-- 4. Create a function to log AI interactions
CREATE OR REPLACE FUNCTION log_ai_interaction(
  p_user_id UUID,
  p_book_id UUID,
  p_section_id UUID,
  p_prompt TEXT,
  p_context TEXT,
  p_response TEXT,
  p_interaction_type VARCHAR DEFAULT 'chat',
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO ai_interactions (
    user_id,
    book_id,
    section_id,
    prompt,
    context,
    response,
    interaction_type,
    metadata
  ) VALUES (
    p_user_id,
    p_book_id,
    p_section_id,
    p_prompt,
    p_context,
    p_response,
    p_interaction_type,
    p_metadata
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create a function to get AI interactions for a user
CREATE OR REPLACE FUNCTION get_user_ai_interactions(
  p_user_id UUID,
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0,
  p_book_id UUID DEFAULT NULL,
  p_section_id UUID DEFAULT NULL,
  p_interaction_type VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  prompt TEXT,
  response TEXT,
  context TEXT,
  created_at TIMESTAMPTZ,
  book_title TEXT,
  section_title TEXT,
  interaction_type VARCHAR,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ai.id,
    ai.prompt,
    ai.response,
    ai.context,
    ai.created_at,
    b.title AS book_title,
    s.title AS section_title,
    ai.interaction_type,
    ai.metadata
  FROM 
    ai_interactions ai
    LEFT JOIN books b ON ai.book_id = b.id
    LEFT JOIN sections s ON ai.section_id = s.id
  WHERE 
    ai.user_id = p_user_id
    AND (p_book_id IS NULL OR ai.book_id = p_book_id)
    AND (p_section_id IS NULL OR ai.section_id = p_section_id)
    AND (p_interaction_type IS NULL OR ai.interaction_type = p_interaction_type)
  ORDER BY 
    ai.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create a function to get AI interaction statistics
CREATE OR REPLACE FUNCTION get_ai_interaction_stats(
  p_user_id UUID,
  p_book_id UUID DEFAULT NULL,
  p_days INT DEFAULT 30
)
RETURNS TABLE (
  total_interactions BIGINT,
  chat_interactions BIGINT,
  explain_interactions BIGINT,
  quiz_interactions BIGINT,
  simplify_interactions BIGINT,
  dictionary_lookups BIGINT,
  avg_interactions_per_day NUMERIC,
  most_active_day DATE,
  most_active_day_count BIGINT
) AS $$
DECLARE
  v_start_date DATE := CURRENT_DATE - p_days;
BEGIN
  RETURN QUERY
  WITH daily_counts AS (
    SELECT 
      DATE(created_at) AS day,
      COUNT(*) AS day_count
    FROM 
      ai_interactions
    WHERE 
      user_id = p_user_id
      AND (p_book_id IS NULL OR book_id = p_book_id)
      AND created_at >= v_start_date
    GROUP BY 
      DATE(created_at)
  ),
  max_day AS (
    SELECT 
      day,
      day_count
    FROM 
      daily_counts
    ORDER BY 
      day_count DESC
    LIMIT 1
  )
  SELECT
    COUNT(*) AS total_interactions,
    COUNT(*) FILTER (WHERE interaction_type = 'chat') AS chat_interactions,
    COUNT(*) FILTER (WHERE interaction_type = 'explain') AS explain_interactions,
    COUNT(*) FILTER (WHERE interaction_type = 'quiz') AS quiz_interactions,
    COUNT(*) FILTER (WHERE interaction_type = 'simplify') AS simplify_interactions,
    COUNT(*) FILTER (WHERE interaction_type = 'dictionary') AS dictionary_lookups,
    COALESCE(COUNT(*) / NULLIF(p_days, 0), 0)::NUMERIC AS avg_interactions_per_day,
    COALESCE((SELECT day FROM max_day), CURRENT_DATE) AS most_active_day,
    COALESCE((SELECT day_count FROM max_day), 0) AS most_active_day_count
  FROM 
    ai_interactions
  WHERE 
    user_id = p_user_id
    AND (p_book_id IS NULL OR book_id = p_book_id)
    AND created_at >= v_start_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create a function to check if a user needs help
CREATE OR REPLACE FUNCTION check_if_user_needs_help(
  p_user_id UUID,
  p_book_id UUID,
  p_section_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_time_on_section INT;
  v_interaction_count INT;
  v_reading_speed NUMERIC;
  v_needs_help BOOLEAN := FALSE;
BEGIN
  -- Get time spent on section
  SELECT 
    COALESCE(time_on_current_section, 0) INTO v_time_on_section
  FROM 
    reader_statistics
  WHERE 
    user_id = p_user_id
    AND book_id = p_book_id;
  
  -- Get interaction count for this section
  SELECT 
    COUNT(*) INTO v_interaction_count
  FROM 
    ai_interactions
  WHERE 
    user_id = p_user_id
    AND book_id = p_book_id
    AND section_id = p_section_id;
  
  -- Get reading speed
  SELECT 
    COALESCE(reading_speed, 0) INTO v_reading_speed
  FROM 
    reader_statistics
  WHERE 
    user_id = p_user_id
    AND book_id = p_book_id;
  
  -- Check if user needs help
  -- Criteria: 
  -- 1. User has been on the section for more than 5 minutes
  -- 2. User has made no AI interactions in this section
  -- 3. User has a low reading speed (less than 100 words per minute)
  IF (v_time_on_section > 300 AND (v_interaction_count = 0 OR v_reading_speed < 100)) THEN
    v_needs_help := TRUE;
  END IF;
  
  RETURN v_needs_help;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create a function to log help offers
CREATE OR REPLACE FUNCTION log_help_offer(
  p_user_id UUID,
  p_book_id UUID,
  p_section_id UUID,
  p_accepted BOOLEAN,
  p_offer_type VARCHAR DEFAULT 'reading_difficulty',
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO consultant_triggers (
    user_id,
    book_id,
    section_id,
    trigger_type,
    accepted,
    trigger_data
  ) VALUES (
    p_user_id,
    p_book_id,
    p_section_id,
    'ai_assistance_offer',
    p_accepted,
    jsonb_build_object(
      'timestamp', NOW(),
      'offer_type', p_offer_type,
      'metadata', p_metadata
    )
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
