-- Minimal tables for testing

-- Books table
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  total_pages INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verification codes table
CREATE TABLE IF NOT EXISTS verification_codes (
  code TEXT PRIMARY KEY,
  book_id TEXT REFERENCES books(id) NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert test book
INSERT INTO books (id, title, author, description, total_pages)
VALUES (
  'alice-in-wonderland', 
  'Alice in Wonderland', 
  'Lewis Carroll', 
  'The classic tale of a girl who falls through a rabbit hole into a fantasy world.',
  100
) ON CONFLICT (id) DO NOTHING;

-- Insert test verification codes
INSERT INTO verification_codes (code, book_id, is_used)
VALUES 
  ('ALICE123', 'alice-in-wonderland', false),
  ('WONDERLAND', 'alice-in-wonderland', false),
  ('RABBIT', 'alice-in-wonderland', false),
  ('TEAPARTY', 'alice-in-wonderland', false),
  ('CHESHIRE', 'alice-in-wonderland', false)
ON CONFLICT (code) DO NOTHING;
