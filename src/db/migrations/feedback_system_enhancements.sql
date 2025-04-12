-- Feedback System Enhancements Migration Script for Alice Reader
-- This script enhances the feedback system with additional fields and functions

-- 1. Add new columns to user_feedback table
ALTER TABLE user_feedback
ADD COLUMN IF NOT EXISTS sentiment_score FLOAT,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS consultant_notes TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- 2. Add indexes to user_feedback table for better performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_book_id ON user_feedback(book_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_section_id ON user_feedback(section_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_feedback_type ON user_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_user_feedback_is_public ON user_feedback(is_public);
CREATE INDEX IF NOT EXISTS idx_user_feedback_is_featured ON user_feedback(is_featured);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback(created_at);

-- 3. Create a function to get feedback counts by type
CREATE OR REPLACE FUNCTION get_feedback_counts_by_type(
  p_book_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  feedback_type TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uf.feedback_type::TEXT,
    COUNT(*)::BIGINT
  FROM 
    user_feedback uf
  WHERE 
    uf.book_id = p_book_id
    AND (p_user_id IS NULL OR uf.user_id = p_user_id)
  GROUP BY 
    uf.feedback_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create a function to get feedback statistics
CREATE OR REPLACE FUNCTION get_feedback_stats(
  p_book_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  total_count BIGINT,
  aha_moment_count BIGINT,
  confusion_count BIGINT,
  general_count BIGINT,
  public_count BIGINT,
  featured_count BIGINT,
  recent_count BIGINT
) AS $$
DECLARE
  v_seven_days_ago TIMESTAMPTZ := NOW() - INTERVAL '7 days';
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM user_feedback WHERE book_id = p_book_id AND (p_user_id IS NULL OR user_id = p_user_id))::BIGINT AS total_count,
    (SELECT COUNT(*) FROM user_feedback WHERE book_id = p_book_id AND feedback_type = 'AHA_MOMENT' AND (p_user_id IS NULL OR user_id = p_user_id))::BIGINT AS aha_moment_count,
    (SELECT COUNT(*) FROM user_feedback WHERE book_id = p_book_id AND feedback_type = 'CONFUSION' AND (p_user_id IS NULL OR user_id = p_user_id))::BIGINT AS confusion_count,
    (SELECT COUNT(*) FROM user_feedback WHERE book_id = p_book_id AND feedback_type = 'GENERAL' AND (p_user_id IS NULL OR user_id = p_user_id))::BIGINT AS general_count,
    (SELECT COUNT(*) FROM user_feedback WHERE book_id = p_book_id AND is_public = TRUE AND (p_user_id IS NULL OR user_id = p_user_id))::BIGINT AS public_count,
    (SELECT COUNT(*) FROM user_feedback WHERE book_id = p_book_id AND is_featured = TRUE AND (p_user_id IS NULL OR user_id = p_user_id))::BIGINT AS featured_count,
    (SELECT COUNT(*) FROM user_feedback WHERE book_id = p_book_id AND created_at >= v_seven_days_ago AND (p_user_id IS NULL OR user_id = p_user_id))::BIGINT AS recent_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create a function to get related feedback
CREATE OR REPLACE FUNCTION get_related_feedback(
  p_feedback_id UUID,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  book_id UUID,
  section_id UUID,
  feedback_type TEXT,
  content TEXT,
  is_public BOOLEAN,
  created_at TIMESTAMPTZ,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  WITH target AS (
    SELECT 
      content, 
      feedback_type,
      section_id,
      book_id
    FROM 
      user_feedback
    WHERE 
      id = p_feedback_id
  )
  SELECT 
    uf.id,
    uf.user_id,
    uf.book_id,
    uf.section_id,
    uf.feedback_type::TEXT,
    uf.content,
    uf.is_public,
    uf.created_at,
    CASE
      WHEN uf.section_id = t.section_id THEN 0.5
      ELSE 0.0
    END +
    CASE
      WHEN uf.feedback_type = t.feedback_type THEN 0.3
      ELSE 0.0
    END +
    CASE
      WHEN uf.content ILIKE '%' || (SELECT SUBSTRING(t.content FROM 1 FOR 50)) || '%' THEN 0.2
      ELSE 0.0
    END AS similarity
  FROM 
    user_feedback uf
    CROSS JOIN target t
  WHERE 
    uf.id != p_feedback_id
    AND uf.book_id = t.book_id
  ORDER BY 
    similarity DESC,
    uf.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create a function to log feedback interaction
CREATE OR REPLACE FUNCTION log_feedback_interaction(
  p_user_id UUID,
  p_book_id UUID,
  p_interaction_type TEXT,
  p_feedback_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO ai_interactions (
    user_id,
    book_id,
    prompt,
    interaction_type,
    metadata
  ) VALUES (
    p_user_id,
    p_book_id,
    'Feedback interaction: ' || p_interaction_type,
    'feedback',
    jsonb_build_object(
      'interaction_type', p_interaction_type,
      'feedback_id', p_feedback_id,
      'timestamp', NOW(),
      'additional_data', p_metadata
    )
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_feedback_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_feedback_timestamp ON user_feedback;
CREATE TRIGGER update_user_feedback_timestamp
BEFORE UPDATE ON user_feedback
FOR EACH ROW
EXECUTE FUNCTION update_user_feedback_timestamp();

-- 8. Create RLS policies for user_feedback table if they don't exist
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own feedback
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'user_feedback' AND policyname = 'user_feedback_select_own'
  ) THEN
    CREATE POLICY user_feedback_select_own ON user_feedback
      FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END
$$;

-- Policy for users to view public feedback
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'user_feedback' AND policyname = 'user_feedback_select_public'
  ) THEN
    CREATE POLICY user_feedback_select_public ON user_feedback
      FOR SELECT TO authenticated
      USING (is_public = TRUE);
  END IF;
END
$$;

-- Policy for users to insert their own feedback
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'user_feedback' AND policyname = 'user_feedback_insert'
  ) THEN
    CREATE POLICY user_feedback_insert ON user_feedback
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END
$$;

-- Policy for users to update their own feedback
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'user_feedback' AND policyname = 'user_feedback_update'
  ) THEN
    CREATE POLICY user_feedback_update ON user_feedback
      FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END
$$;

-- Policy for consultants to view all feedback
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'user_feedback' AND policyname = 'user_feedback_select_consultant'
  ) THEN
    CREATE POLICY user_feedback_select_consultant ON user_feedback
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM consultant_users cu
          WHERE cu.user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- Policy for consultants to update any feedback
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'user_feedback' AND policyname = 'user_feedback_update_consultant'
  ) THEN
    CREATE POLICY user_feedback_update_consultant ON user_feedback
      FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM consultant_users cu
          WHERE cu.user_id = auth.uid()
        )
      );
  END IF;
END
$$;
