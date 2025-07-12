-- ID Consistency Migration Script for Alice Reader
-- This script improves ID handling in the database

-- 1. Ensure the uuid-ossp extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Add string_id column to books table if it doesn't exist
ALTER TABLE books
ADD COLUMN IF NOT EXISTS string_id TEXT;

-- 3. Update existing books with string IDs
UPDATE books
SET string_id = 'alice-in-wonderland'
WHERE id = '550e8400-e29b-41d4-a716-446655440000'::UUID
AND string_id IS NULL;

-- 4. Create a function to look up books by string ID
CREATE OR REPLACE FUNCTION get_book_by_string_id(p_string_id TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  author TEXT,
  description TEXT,
  total_pages INT,
  created_at TIMESTAMPTZ,
  string_id TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT b.id, b.title, b.author, b.description, b.total_pages, b.created_at, b.string_id
  FROM books b
  WHERE b.string_id = p_string_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Create a function to validate UUIDs
CREATE OR REPLACE FUNCTION is_valid_uuid(p_uuid TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_uuid ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 6. Create a function to get a book ID (either by UUID or string ID)
CREATE OR REPLACE FUNCTION get_book_id(p_id TEXT)
RETURNS UUID AS $$
DECLARE
  v_book_id UUID;
BEGIN
  -- Check if it's a valid UUID
  IF is_valid_uuid(p_id) THEN
    -- It's a UUID, check if it exists
    SELECT id INTO v_book_id
    FROM books
    WHERE id = p_id::UUID;
    
    IF v_book_id IS NOT NULL THEN
      RETURN v_book_id;
    END IF;
  END IF;
  
  -- Not a UUID or UUID not found, try string ID
  SELECT id INTO v_book_id
  FROM books
  WHERE string_id = p_id;
  
  RETURN v_book_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Create a trigger to ensure book IDs are valid UUIDs
CREATE OR REPLACE FUNCTION validate_book_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT is_valid_uuid(NEW.id::TEXT) THEN
    RAISE EXCEPTION 'Invalid book ID: %', NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create the trigger on the books table
DROP TRIGGER IF EXISTS validate_book_id_trigger ON books;
CREATE TRIGGER validate_book_id_trigger
BEFORE INSERT OR UPDATE ON books
FOR EACH ROW
EXECUTE FUNCTION validate_book_id();

-- 9. Create a function to get sections for a page with ID handling
CREATE OR REPLACE FUNCTION get_sections_for_page(book_id_param TEXT, page_number_param INT)
RETURNS TABLE (
  id UUID,
  chapter_id UUID,
  title TEXT,
  content TEXT,
  start_page INT,
  end_page INT,
  number INT,
  created_at TIMESTAMPTZ,
  chapter_title TEXT,
  chapter_number INT
) AS $$
DECLARE
  v_book_id UUID;
BEGIN
  -- Get the book ID (either from UUID or string ID)
  v_book_id := get_book_id(book_id_param);
  
  IF v_book_id IS NULL THEN
    RAISE EXCEPTION 'Book not found with ID: %', book_id_param;
  END IF;
  
  RETURN QUERY
  SELECT 
    s.id, s.chapter_id, s.title, s.content, s.start_page, s.end_page, s.number, s.created_at,
    c.title AS chapter_title, c.number AS chapter_number
  FROM 
    sections s
    JOIN chapters c ON s.chapter_id = c.id
  WHERE 
    c.book_id = v_book_id
    AND s.start_page <= page_number_param
    AND s.end_page >= page_number_param
  ORDER BY 
    c.number, s.number;
END;
$$ LANGUAGE plpgsql;

-- 10. Create a function to get a definition with context and ID handling
CREATE OR REPLACE FUNCTION get_definition_with_context(
  book_id_param TEXT,
  term_param TEXT,
  section_id_param TEXT DEFAULT NULL,
  chapter_id_param TEXT DEFAULT NULL
)
RETURNS TABLE (
  term TEXT,
  definition TEXT,
  priority INT
) AS $$
DECLARE
  v_book_id UUID;
  v_section_id UUID;
  v_chapter_id UUID;
BEGIN
  -- Get the book ID (either from UUID or string ID)
  v_book_id := get_book_id(book_id_param);
  
  IF v_book_id IS NULL THEN
    RAISE EXCEPTION 'Book not found with ID: %', book_id_param;
  END IF;
  
  -- Convert section ID if provided
  IF section_id_param IS NOT NULL AND section_id_param != '' THEN
    IF is_valid_uuid(section_id_param) THEN
      v_section_id := section_id_param::UUID;
    ELSE
      RAISE EXCEPTION 'Invalid section ID: %', section_id_param;
    END IF;
  END IF;
  
  -- Convert chapter ID if provided
  IF chapter_id_param IS NOT NULL AND chapter_id_param != '' THEN
    IF is_valid_uuid(chapter_id_param) THEN
      v_chapter_id := chapter_id_param::UUID;
    ELSE
      RAISE EXCEPTION 'Invalid chapter ID: %', chapter_id_param;
    END IF;
  END IF;
  
  -- Return definitions with priority based on context specificity
  RETURN QUERY
  
  -- Most specific: book + section + term
  SELECT d.term, d.definition, 1 AS priority
  FROM dictionary d
  WHERE d.book_id = v_book_id
    AND d.section_id = v_section_id
    AND LOWER(d.term) = LOWER(term_param)
  
  UNION ALL
  
  -- Second most specific: book + chapter + term
  SELECT d.term, d.definition, 2 AS priority
  FROM dictionary d
  WHERE d.book_id = v_book_id
    AND d.chapter_id = v_chapter_id
    AND d.section_id IS NULL
    AND LOWER(d.term) = LOWER(term_param)
  
  UNION ALL
  
  -- Least specific: book + term
  SELECT d.term, d.definition, 3 AS priority
  FROM dictionary d
  WHERE d.book_id = v_book_id
    AND d.chapter_id IS NULL
    AND d.section_id IS NULL
    AND LOWER(d.term) = LOWER(term_param);
END;
$$ LANGUAGE plpgsql;
