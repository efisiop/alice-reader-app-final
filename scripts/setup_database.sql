-- *** Create Database Tables ***

-- Users Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  is_consultant BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Books
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  total_pages INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chapters
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  number INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, number)
);
CREATE INDEX IF NOT EXISTS idx_chapters_book_id ON chapters(book_id);

-- Sections
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  start_page INT NOT NULL,
  end_page INT NOT NULL,
  number INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chapter_id, number)
);
CREATE INDEX IF NOT EXISTS idx_sections_chapter_id ON sections(chapter_id);
CREATE INDEX IF NOT EXISTS idx_sections_page_range ON sections(start_page, end_page);

-- Book Verification Codes
CREATE TABLE IF NOT EXISTS verification_codes (
  code TEXT PRIMARY KEY,
  book_id UUID REFERENCES books(id) NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_verification_codes_book_id ON verification_codes(book_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_used_by ON verification_codes(used_by);

-- Dictionary Terms (with refined context)
CREATE TABLE IF NOT EXISTS dictionary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, term, chapter_id, section_id)
);
CREATE INDEX IF NOT EXISTS idx_dictionary_book_id ON dictionary(book_id);
CREATE INDEX IF NOT EXISTS idx_dictionary_chapter_id ON dictionary(chapter_id);
CREATE INDEX IF NOT EXISTS idx_dictionary_section_id ON dictionary(section_id);
CREATE INDEX IF NOT EXISTS idx_dictionary_term ON dictionary(term);

-- Reading Progress
CREATE TABLE IF NOT EXISTS reading_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE NOT NULL,
  last_position TEXT, -- Could store page number or percentage
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_book_id ON reading_progress(book_id);

-- Reading Statistics
CREATE TABLE IF NOT EXISTS reading_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  total_reading_time INT DEFAULT 0, -- in seconds
  pages_read INT DEFAULT 0,
  last_session_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);
CREATE INDEX IF NOT EXISTS idx_reading_stats_user_id ON reading_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_stats_book_id ON reading_stats(book_id);

-- AI Interactions
CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  context TEXT, -- Selected text that provided context
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_book_id ON ai_interactions(book_id);

-- AI Prompts (for automated check-ins)
CREATE TABLE IF NOT EXISTS ai_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_text TEXT NOT NULL,
  prompt_type TEXT NOT NULL, -- e.g., 'engagement', 'comprehension', 'reflection'
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_type ON ai_prompts(prompt_type);

-- User Prompt Responses
CREATE TABLE IF NOT EXISTS user_prompt_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES ai_prompts(id) ON DELETE CASCADE NOT NULL,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_prompt_responses_user_id ON user_prompt_responses(user_id);

-- Consultant Assignments (for monitoring user progress)
CREATE TABLE IF NOT EXISTS consultant_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(consultant_id, user_id, book_id)
);
CREATE INDEX IF NOT EXISTS idx_consultant_assignments_consultant_id ON consultant_assignments(consultant_id);
CREATE INDEX IF NOT EXISTS idx_consultant_assignments_user_id ON consultant_assignments(user_id);

-- Consultant Triggers (for AI-initiated prompts)
CREATE TABLE IF NOT EXISTS consultant_triggers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  trigger_type TEXT NOT NULL, -- 'engagement', 'check-in', 'quiz', etc.
  message TEXT,
  is_processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_consultant_triggers_user_id ON consultant_triggers(user_id);
CREATE INDEX IF NOT EXISTS idx_consultant_triggers_is_processed ON consultant_triggers(is_processed);

-- *** Create Database Functions ***

-- Function to get sections for a specific page number
CREATE OR REPLACE FUNCTION get_sections_for_page(book_id_param UUID, page_number_param INT)
RETURNS TABLE (
  id UUID,
  chapter_id UUID,
  title TEXT,
  content TEXT,
  start_page INT,
  end_page INT,
  number INT,
  chapter_title TEXT,
  chapter_number INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id, s.chapter_id, s.title, s.content, s.start_page, s.end_page, s.number,
    c.title as chapter_title, c.number as chapter_number
  FROM 
    sections s
  JOIN 
    chapters c ON s.chapter_id = c.id
  WHERE 
    c.book_id = book_id_param AND
    page_number_param BETWEEN s.start_page AND s.end_page
  ORDER BY 
    c.number, s.number;
END;
$$ LANGUAGE plpgsql;

-- Function to get definitions with context priority
CREATE OR REPLACE FUNCTION get_definition_with_context(
  book_id_param UUID, 
  term_param TEXT,
  section_id_param UUID DEFAULT NULL,
  chapter_id_param UUID DEFAULT NULL
)
RETURNS TABLE (
  definition TEXT,
  priority INT -- Lower number means higher priority
) AS $$
BEGIN
  -- First try section-specific definition
  IF section_id_param IS NOT NULL THEN
    RETURN QUERY
    SELECT d.definition, 1 as priority
    FROM dictionary d
    WHERE d.book_id = book_id_param
      AND LOWER(d.term) = LOWER(term_param)
      AND d.section_id = section_id_param;
  END IF;
  
  -- Then try chapter-specific definition
  IF chapter_id_param IS NOT NULL THEN
    RETURN QUERY
    SELECT d.definition, 2 as priority
    FROM dictionary d
    WHERE d.book_id = book_id_param
      AND LOWER(d.term) = LOWER(term_param)
      AND d.chapter_id = chapter_id_param
      AND d.section_id IS NULL;
  END IF;
  
  -- Finally try book-wide definition
  RETURN QUERY
  SELECT d.definition, 3 as priority
  FROM dictionary d
  WHERE d.book_id = book_id_param
    AND LOWER(d.term) = LOWER(term_param)
    AND d.chapter_id IS NULL
    AND d.section_id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Helper function to increment counter fields atomically
CREATE OR REPLACE FUNCTION increment_counter(
  table_name text,
  column_name text,
  row_id uuid,
  increment_by integer
) RETURNS void AS $$
DECLARE
  update_query text;
BEGIN
  update_query := format('UPDATE %I SET %I = %I + %L WHERE id = %L',
                         table_name, column_name, column_name, increment_by, row_id);
  EXECUTE update_query;
END;
$$ LANGUAGE plpgsql;
