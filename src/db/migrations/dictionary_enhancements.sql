-- Dictionary Enhancements Migration Script for Alice Reader
-- This script enhances the dictionary table and adds related functions

-- 1. Add indexes to the dictionary table for better performance
CREATE INDEX IF NOT EXISTS idx_dictionary_book_id ON dictionary(book_id);
CREATE INDEX IF NOT EXISTS idx_dictionary_term ON dictionary(term);
CREATE INDEX IF NOT EXISTS idx_dictionary_book_term ON dictionary(book_id, term);
CREATE INDEX IF NOT EXISTS idx_dictionary_context ON dictionary(book_id, chapter_id, section_id);

-- 2. Create a function to get definitions with context priority
CREATE OR REPLACE FUNCTION get_definition_with_context(
  book_id_param UUID,
  term_param TEXT,
  section_id_param UUID DEFAULT NULL,
  chapter_id_param UUID DEFAULT NULL
)
RETURNS TABLE (
  term TEXT,
  definition TEXT,
  priority INT
) AS $$
BEGIN
  -- Return definitions with priority based on context specificity
  RETURN QUERY
  
  -- Most specific: book + section + term
  SELECT d.term, d.definition, 1 AS priority
  FROM dictionary d
  WHERE d.book_id = book_id_param
    AND d.section_id = section_id_param
    AND LOWER(d.term) = LOWER(term_param)
  
  UNION ALL
  
  -- Second most specific: book + chapter + term
  SELECT d.term, d.definition, 2 AS priority
  FROM dictionary d
  WHERE d.book_id = book_id_param
    AND d.chapter_id = chapter_id_param
    AND d.section_id IS NULL
    AND LOWER(d.term) = LOWER(term_param)
  
  UNION ALL
  
  -- Least specific: book + term
  SELECT d.term, d.definition, 3 AS priority
  FROM dictionary d
  WHERE d.book_id = book_id_param
    AND d.chapter_id IS NULL
    AND d.section_id IS NULL
    AND LOWER(d.term) = LOWER(term_param);
END;
$$ LANGUAGE plpgsql;

-- 3. Create a function to search for terms
CREATE OR REPLACE FUNCTION search_dictionary_terms(
  book_id_param UUID,
  search_term TEXT,
  limit_param INT DEFAULT 10
)
RETURNS TABLE (
  term TEXT,
  definition TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT d.term, d.definition
  FROM dictionary d
  WHERE d.book_id = book_id_param
    AND (
      LOWER(d.term) LIKE '%' || LOWER(search_term) || '%'
      OR LOWER(d.definition) LIKE '%' || LOWER(search_term) || '%'
    )
  GROUP BY d.term, d.definition
  ORDER BY 
    CASE WHEN LOWER(d.term) = LOWER(search_term) THEN 0
         WHEN LOWER(d.term) LIKE LOWER(search_term) || '%' THEN 1
         WHEN LOWER(d.term) LIKE '%' || LOWER(search_term) || '%' THEN 2
         ELSE 3
    END,
    d.term
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- 4. Create a table for user vocabulary
CREATE TABLE IF NOT EXISTS user_vocabulary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  book_id UUID REFERENCES books(id),
  section_id UUID REFERENCES sections(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, term)
);

-- 5. Add indexes to user_vocabulary table
CREATE INDEX IF NOT EXISTS idx_user_vocabulary_user_id ON user_vocabulary(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vocabulary_term ON user_vocabulary(term);
CREATE INDEX IF NOT EXISTS idx_user_vocabulary_book_id ON user_vocabulary(book_id);

-- 6. Create RLS policies for user_vocabulary table
ALTER TABLE user_vocabulary ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own vocabulary
CREATE POLICY user_vocabulary_select ON user_vocabulary
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Policy for users to insert into their own vocabulary
CREATE POLICY user_vocabulary_insert ON user_vocabulary
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy for users to update their own vocabulary
CREATE POLICY user_vocabulary_update ON user_vocabulary
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy for users to delete from their own vocabulary
CREATE POLICY user_vocabulary_delete ON user_vocabulary
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 7. Create a function to save a term to user vocabulary
CREATE OR REPLACE FUNCTION save_to_vocabulary(
  p_user_id UUID,
  p_term TEXT,
  p_definition TEXT,
  p_book_id UUID DEFAULT NULL,
  p_section_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Insert or update the vocabulary entry
  INSERT INTO user_vocabulary (user_id, term, definition, book_id, section_id)
  VALUES (p_user_id, p_term, p_definition, p_book_id, p_section_id)
  ON CONFLICT (user_id, term)
  DO UPDATE SET
    definition = p_definition,
    book_id = COALESCE(p_book_id, user_vocabulary.book_id),
    section_id = COALESCE(p_section_id, user_vocabulary.section_id),
    updated_at = NOW()
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create a function to get user vocabulary
CREATE OR REPLACE FUNCTION get_user_vocabulary(
  p_user_id UUID,
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  term TEXT,
  definition TEXT,
  book_id UUID,
  book_title TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uv.id,
    uv.term,
    uv.definition,
    uv.book_id,
    b.title AS book_title,
    uv.created_at,
    uv.updated_at
  FROM 
    user_vocabulary uv
    LEFT JOIN books b ON uv.book_id = b.id
  WHERE 
    uv.user_id = p_user_id
    AND (
      p_search IS NULL
      OR LOWER(uv.term) LIKE '%' || LOWER(p_search) || '%'
      OR LOWER(uv.definition) LIKE '%' || LOWER(p_search) || '%'
    )
  ORDER BY 
    uv.updated_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create a function to log dictionary lookups
CREATE OR REPLACE FUNCTION log_dictionary_lookup(
  p_user_id UUID,
  p_book_id UUID,
  p_section_id UUID,
  p_term TEXT,
  p_found BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  -- Log as AI interaction for analytics
  INSERT INTO ai_interactions (
    user_id,
    book_id,
    section_id,
    prompt,
    response
  ) VALUES (
    p_user_id,
    p_book_id,
    p_section_id,
    'Dictionary lookup: ' || p_term,
    CASE WHEN p_found THEN 'Definition found for "' || p_term || '"'
         ELSE 'No definition found for "' || p_term || '"'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
