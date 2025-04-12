-- Schema fixes for Alice Reader application

-- 1. Add missing column to reading_progress table
ALTER TABLE reading_progress
ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Create reading_stats table if it doesn't exist
CREATE TABLE IF NOT EXISTS reading_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  total_reading_time INT DEFAULT 0,
  pages_read INT DEFAULT 0,
  percentage_complete FLOAT DEFAULT 0,
  last_session_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reading_stats_user_id ON reading_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_stats_book_id ON reading_stats(book_id);

-- 4. Add string_id column to books table for better ID handling
ALTER TABLE books
ADD COLUMN IF NOT EXISTS string_id TEXT;

-- 5. Update the existing books to add string IDs
UPDATE books
SET string_id = 'alice-in-wonderland'
WHERE id = '550e8400-e29b-41d4-a716-446655440000'::UUID
AND string_id IS NULL;

-- 6. Create a function to look up books by string ID
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

-- 7. Set up RLS policies for reading_stats
ALTER TABLE reading_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reading stats"
ON reading_stats FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own reading stats"
ON reading_stats FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own reading stats"
ON reading_stats FOR INSERT WITH CHECK (user_id = auth.uid());

-- 8. Create necessary triggers to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_reading_stats_timestamp ON reading_stats;
CREATE TRIGGER update_reading_stats_timestamp
BEFORE UPDATE ON reading_stats
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_reading_progress_timestamp ON reading_progress;
CREATE TRIGGER update_reading_progress_timestamp
BEFORE UPDATE ON reading_progress
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
