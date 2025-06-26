-- Migration: Add Alice in Wonderland Glossary Table
-- Purpose: Store specific uncommon definitions for Alice in Wonderland that should take priority over external definitions

-- Create alice_glossary table
CREATE TABLE IF NOT EXISTS alice_glossary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  source_sentence TEXT, -- The sentence where this term appears in the book
  example TEXT, -- Usage example
  chapter_reference TEXT, -- Which chapters this appears in (e.g., "1,2,3" or "1-3")
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, term)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_alice_glossary_book_id ON alice_glossary(book_id);
CREATE INDEX IF NOT EXISTS idx_alice_glossary_term ON alice_glossary(term);
CREATE INDEX IF NOT EXISTS idx_alice_glossary_book_term ON alice_glossary(book_id, term);

-- Create function to get glossary definition with fallback to regular dictionary
CREATE OR REPLACE FUNCTION get_glossary_definition(
  book_id_param UUID,
  term_param TEXT,
  section_id_param UUID DEFAULT NULL,
  chapter_id_param UUID DEFAULT NULL
)
RETURNS TABLE (
  term TEXT,
  definition TEXT,
  source_sentence TEXT,
  example TEXT,
  source_type TEXT,
  priority INT
) AS $$
BEGIN
  -- First check alice_glossary for exact matches (highest priority)
  RETURN QUERY
  SELECT 
    ag.term,
    ag.definition,
    ag.source_sentence,
    ag.example,
    'glossary'::TEXT as source_type,
    0 as priority
  FROM alice_glossary ag
  WHERE ag.book_id = book_id_param
    AND LOWER(ag.term) = LOWER(term_param);

  -- If no glossary entry found, fallback to regular dictionary with context
  IF NOT FOUND THEN
    -- Most specific: book + section + term
    IF section_id_param IS NOT NULL THEN
      RETURN QUERY
      SELECT 
        d.term,
        d.definition,
        NULL::TEXT as source_sentence,
        NULL::TEXT as example,
        'dictionary_section'::TEXT as source_type,
        1 as priority
      FROM dictionary d
      WHERE d.book_id = book_id_param
        AND d.section_id = section_id_param
        AND LOWER(d.term) = LOWER(term_param);
    END IF;
    
    -- Second most specific: book + chapter + term
    IF chapter_id_param IS NOT NULL AND NOT FOUND THEN
      RETURN QUERY
      SELECT 
        d.term,
        d.definition,
        NULL::TEXT as source_sentence,
        NULL::TEXT as example,
        'dictionary_chapter'::TEXT as source_type,
        2 as priority
      FROM dictionary d
      WHERE d.book_id = book_id_param
        AND d.chapter_id = chapter_id_param
        AND d.section_id IS NULL
        AND LOWER(d.term) = LOWER(term_param);
    END IF;
    
    -- Least specific: book + term
    IF NOT FOUND THEN
      RETURN QUERY
      SELECT 
        d.term,
        d.definition,
        NULL::TEXT as source_sentence,
        NULL::TEXT as example,
        'dictionary_book'::TEXT as source_type,
        3 as priority
      FROM dictionary d
      WHERE d.book_id = book_id_param
        AND d.chapter_id IS NULL
        AND d.section_id IS NULL
        AND LOWER(d.term) = LOWER(term_param);
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to import glossary from CSV data
CREATE OR REPLACE FUNCTION import_glossary_term(
  p_book_id UUID,
  p_term TEXT,
  p_definition TEXT,
  p_source_sentence TEXT DEFAULT NULL,
  p_example TEXT DEFAULT NULL,
  p_chapter_reference TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Insert or update the glossary entry
  INSERT INTO alice_glossary (book_id, term, definition, source_sentence, example, chapter_reference)
  VALUES (p_book_id, p_term, p_definition, p_source_sentence, p_example, p_chapter_reference)
  ON CONFLICT (book_id, term)
  DO UPDATE SET
    definition = p_definition,
    source_sentence = COALESCE(p_source_sentence, alice_glossary.source_sentence),
    example = COALESCE(p_example, alice_glossary.example),
    chapter_reference = COALESCE(p_chapter_reference, alice_glossary.chapter_reference),
    updated_at = NOW()
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to search glossary terms
CREATE OR REPLACE FUNCTION search_glossary_terms(
  book_id_param UUID,
  search_term TEXT,
  limit_param INT DEFAULT 10
)
RETURNS TABLE (
  term TEXT,
  definition TEXT,
  source_sentence TEXT,
  example TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ag.term,
    ag.definition,
    ag.source_sentence,
    ag.example
  FROM alice_glossary ag
  WHERE ag.book_id = book_id_param
    AND (
      LOWER(ag.term) LIKE '%' || LOWER(search_term) || '%'
      OR LOWER(ag.definition) LIKE '%' || LOWER(search_term) || '%'
    )
  ORDER BY 
    CASE WHEN LOWER(ag.term) = LOWER(search_term) THEN 0
         WHEN LOWER(ag.term) LIKE LOWER(search_term) || '%' THEN 1
         WHEN LOWER(ag.term) LIKE '%' || LOWER(search_term) || '%' THEN 2
         ELSE 3
    END,
    ag.term
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS for the alice_glossary table
ALTER TABLE alice_glossary ENABLE ROW LEVEL SECURITY;

-- Policy for users to view glossary entries (all authenticated users can read)
CREATE POLICY alice_glossary_select ON alice_glossary
  FOR SELECT TO authenticated
  USING (true);

-- Policy for admins/consultants to insert/update glossary entries
CREATE POLICY alice_glossary_modify ON alice_glossary
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.is_consultant = true
    )
  );

-- Create a view for easy glossary browsing
CREATE OR REPLACE VIEW glossary_view AS
SELECT 
  ag.id,
  ag.term,
  ag.definition,
  ag.source_sentence,
  ag.example,
  ag.chapter_reference,
  b.title as book_title,
  ag.created_at,
  ag.updated_at
FROM alice_glossary ag
JOIN books b ON ag.book_id = b.id
ORDER BY ag.term; 