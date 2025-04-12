import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { appLog } from '../components/LogViewer';

/**
 * Represents a database migration
 */
export interface Migration {
  id: number;
  name: string;
  description: string;
  sql: string;
  rollback_sql: string;
}

/**
 * List of all migrations in order
 * Each migration should have a unique ID and include both the SQL to apply
 * and the SQL to roll back the migration
 */
export const migrations: Migration[] = [
  {
    id: 1,
    name: 'create_schema_version_table',
    description: 'Create schema version tracking table',
    sql: `
      CREATE TABLE IF NOT EXISTS schema_versions (
        id SERIAL PRIMARY KEY,
        version INTEGER NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW(),
        description TEXT
      );
    `,
    rollback_sql: `DROP TABLE IF EXISTS schema_versions;`
  },
  {
    id: 2,
    name: 'create_dictionary_table',
    description: 'Create table for storing dictionary definitions',
    sql: `
      CREATE TABLE IF NOT EXISTS dictionary (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        book_id UUID REFERENCES books(id),
        page_number INTEGER NOT NULL,
        section_index INTEGER NOT NULL,
        trigger_text TEXT NOT NULL,
        explanation_type TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(book_id, page_number, section_index, trigger_text)
      );
    `,
    rollback_sql: `DROP TABLE IF EXISTS dictionary;`
  },
  {
    id: 3,
    name: 'create_reading_stats_table',
    description: 'Create table for tracking reading statistics',
    sql: `
      CREATE TABLE IF NOT EXISTS reading_stats (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
        total_reading_time INTEGER DEFAULT 0,
        pages_read INTEGER DEFAULT 0,
        percentage_complete FLOAT DEFAULT 0,
        last_session_date TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, book_id)
      );
    `,
    rollback_sql: `DROP TABLE IF EXISTS reading_stats;`
  },
  {
    id: 4,
    name: 'create_consultant_triggers_table',
    description: 'Create table for storing consultant-triggered prompts',
    sql: `
      CREATE TABLE IF NOT EXISTS consultant_triggers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        consultant_id UUID REFERENCES auth.users(id),
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        book_id UUID REFERENCES books(id) NOT NULL,
        trigger_type TEXT NOT NULL,
        message TEXT,
        is_processed BOOLEAN DEFAULT FALSE,
        processed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT valid_trigger_type CHECK (trigger_type IN ('quiz', 'reflection', 'help', 'custom'))
      );
    `,
    rollback_sql: `DROP TABLE IF EXISTS consultant_triggers;`
  },
  {
    id: 5,
    name: 'create_help_requests_table',
    description: 'Create table for storing help requests from readers',
    sql: `
      CREATE TABLE IF NOT EXISTS help_requests (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        book_id UUID REFERENCES books(id) NOT NULL,
        section_id UUID REFERENCES sections(id),
        content TEXT NOT NULL,
        context TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        assigned_to UUID REFERENCES auth.users(id),
        resolved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed'))
      );
    `,
    rollback_sql: `DROP TABLE IF EXISTS help_requests;`
  },
  {
    id: 6,
    name: 'create_user_feedback_table',
    description: 'Create table for storing user feedback',
    sql: `
      CREATE TABLE IF NOT EXISTS user_feedback (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        book_id UUID REFERENCES books(id) NOT NULL,
        section_id UUID REFERENCES sections(id),
        feedback_type TEXT NOT NULL,
        content TEXT NOT NULL,
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT valid_feedback_type CHECK (feedback_type IN ('general', 'content', 'difficulty', 'suggestion', 'praise'))
      );
    `,
    rollback_sql: `DROP TABLE IF EXISTS user_feedback;`
  },
  {
    id: 7,
    name: 'create_consultant_actions_log',
    description: 'Create table for logging consultant actions',
    sql: `
      CREATE TABLE IF NOT EXISTS consultant_actions_log (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        consultant_id UUID REFERENCES auth.users(id) NOT NULL,
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        action_type TEXT NOT NULL,
        details JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `,
    rollback_sql: `DROP TABLE IF EXISTS consultant_actions_log;`
  },
  {
    id: 8,
    name: 'add_string_id_to_books',
    description: 'Add string_id column to books table for easier reference',
    sql: `
      ALTER TABLE books
      ADD COLUMN IF NOT EXISTS string_id TEXT;

      -- Update existing books with string IDs
      UPDATE books
      SET string_id = 'alice-in-wonderland'
      WHERE id = '550e8400-e29b-41d4-a716-446655440000'
      AND string_id IS NULL;
    `,
    rollback_sql: `
      ALTER TABLE books
      DROP COLUMN IF EXISTS string_id;
    `
  },
  {
    id: 9,
    name: 'create_book_lookup_function',
    description: 'Create function to look up books by string ID',
    sql: `
      CREATE OR REPLACE FUNCTION get_book_by_string_id(p_string_id TEXT)
      RETURNS TABLE (
        id UUID,
        title TEXT,
        author TEXT,
        description TEXT,
        total_pages INTEGER,
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
    `,
    rollback_sql: `
      DROP FUNCTION IF EXISTS get_book_by_string_id(TEXT);
    `
  },
  {
    id: 10,
    name: 'setup_rls_policies',
    description: 'Set up Row Level Security policies for tables',
    sql: `
      -- Enable RLS on tables
      ALTER TABLE reading_stats ENABLE ROW LEVEL SECURITY;
      ALTER TABLE dictionary ENABLE ROW LEVEL SECURITY;
      ALTER TABLE consultant_triggers ENABLE ROW LEVEL SECURITY;
      ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;
      ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

      -- Reading stats policies
      DROP POLICY IF EXISTS "Users can view their own reading stats" ON reading_stats;
      CREATE POLICY "Users can view their own reading stats"
      ON reading_stats FOR SELECT USING (user_id = auth.uid());

      DROP POLICY IF EXISTS "Users can update their own reading stats" ON reading_stats;
      CREATE POLICY "Users can update their own reading stats"
      ON reading_stats FOR UPDATE USING (user_id = auth.uid());

      DROP POLICY IF EXISTS "Users can insert their own reading stats" ON reading_stats;
      CREATE POLICY "Users can insert their own reading stats"
      ON reading_stats FOR INSERT WITH CHECK (user_id = auth.uid());

      -- Dictionary policies
      DROP POLICY IF EXISTS "Anyone can view dictionary entries" ON dictionary;
      CREATE POLICY "Anyone can view dictionary entries"
      ON dictionary FOR SELECT USING (true);

      -- Help requests policies
      DROP POLICY IF EXISTS "Users can view their own help requests" ON help_requests;
      CREATE POLICY "Users can view their own help requests"
      ON help_requests FOR SELECT USING (user_id = auth.uid());

      DROP POLICY IF EXISTS "Users can create help requests" ON help_requests;
      CREATE POLICY "Users can create help requests"
      ON help_requests FOR INSERT WITH CHECK (user_id = auth.uid());

      DROP POLICY IF EXISTS "Consultants can view all help requests" ON help_requests;
      CREATE POLICY "Consultants can view all help requests"
      ON help_requests FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM consultant_users
          WHERE user_id = auth.uid() AND is_active = true
        )
      );

      DROP POLICY IF EXISTS "Consultants can update help requests" ON help_requests;
      CREATE POLICY "Consultants can update help requests"
      ON help_requests FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM consultant_users
          WHERE user_id = auth.uid() AND is_active = true
        )
      );

      -- User feedback policies
      DROP POLICY IF EXISTS "Users can view their own feedback" ON user_feedback;
      CREATE POLICY "Users can view their own feedback"
      ON user_feedback FOR SELECT USING (user_id = auth.uid());

      DROP POLICY IF EXISTS "Users can create feedback" ON user_feedback;
      CREATE POLICY "Users can create feedback"
      ON user_feedback FOR INSERT WITH CHECK (user_id = auth.uid());

      DROP POLICY IF EXISTS "Anyone can view public feedback" ON user_feedback;
      CREATE POLICY "Anyone can view public feedback"
      ON user_feedback FOR SELECT USING (is_public = true);

      DROP POLICY IF EXISTS "Consultants can view all feedback" ON user_feedback;
      CREATE POLICY "Consultants can view all feedback"
      ON user_feedback FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM consultant_users
          WHERE user_id = auth.uid() AND is_active = true
        )
      );
    `,
    rollback_sql: `
      -- Disable RLS on tables
      ALTER TABLE reading_stats DISABLE ROW LEVEL SECURITY;
      ALTER TABLE dictionary DISABLE ROW LEVEL SECURITY;
      ALTER TABLE consultant_triggers DISABLE ROW LEVEL SECURITY;
      ALTER TABLE help_requests DISABLE ROW LEVEL SECURITY;
      ALTER TABLE user_feedback DISABLE ROW LEVEL SECURITY;

      -- Drop policies
      DROP POLICY IF EXISTS "Users can view their own reading stats" ON reading_stats;
      DROP POLICY IF EXISTS "Users can update their own reading stats" ON reading_stats;
      DROP POLICY IF EXISTS "Users can insert their own reading stats" ON reading_stats;

      DROP POLICY IF EXISTS "Anyone can view dictionary entries" ON dictionary;

      DROP POLICY IF EXISTS "Users can view their own help requests" ON help_requests;
      DROP POLICY IF EXISTS "Users can create help requests" ON help_requests;
      DROP POLICY IF EXISTS "Consultants can view all help requests" ON help_requests;
      DROP POLICY IF EXISTS "Consultants can update help requests" ON help_requests;

      DROP POLICY IF EXISTS "Users can view their own feedback" ON user_feedback;
      DROP POLICY IF EXISTS "Users can create feedback" ON user_feedback;
      DROP POLICY IF EXISTS "Anyone can view public feedback" ON user_feedback;
      DROP POLICY IF EXISTS "Consultants can view all feedback" ON user_feedback;
    `
  },
  {
    id: 11,
    name: 'create_timestamp_triggers',
    description: 'Create triggers to automatically update timestamps',
    sql: `
      -- Create update_timestamp function
      CREATE OR REPLACE FUNCTION update_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
         NEW.updated_at = NOW();
         RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Create triggers for each table with updated_at
      DROP TRIGGER IF EXISTS update_reading_stats_timestamp ON reading_stats;
      CREATE TRIGGER update_reading_stats_timestamp
      BEFORE UPDATE ON reading_stats
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp();

      DROP TRIGGER IF EXISTS update_help_requests_timestamp ON help_requests;
      CREATE TRIGGER update_help_requests_timestamp
      BEFORE UPDATE ON help_requests
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp();

      DROP TRIGGER IF EXISTS update_user_feedback_timestamp ON user_feedback;
      CREATE TRIGGER update_user_feedback_timestamp
      BEFORE UPDATE ON user_feedback
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp();
    `,
    rollback_sql: `
      -- Drop triggers
      DROP TRIGGER IF EXISTS update_reading_stats_timestamp ON reading_stats;
      DROP TRIGGER IF EXISTS update_help_requests_timestamp ON help_requests;
      DROP TRIGGER IF EXISTS update_user_feedback_timestamp ON user_feedback;

      -- Drop function
      DROP FUNCTION IF EXISTS update_timestamp();
    `
  },
  {
    id: 12,
    name: 'create_diagnostic_functions',
    description: 'Create diagnostic functions for database health checks',
    sql: `
      -- Function to get all tables and their row counts
      CREATE OR REPLACE FUNCTION get_tables()
      RETURNS TABLE (
        table_name TEXT,
        row_count BIGINT,
        last_modified TIMESTAMPTZ
      ) AS $$
      DECLARE
        t record;
      BEGIN
        FOR t IN
          SELECT table_schema, table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
          ORDER BY table_name
        LOOP
          RETURN QUERY EXECUTE format(
            'SELECT %L::text, count(*)::bigint, max(updated_at)::timestamptz FROM %I.%I',
            t.table_name, t.table_schema, t.table_name
          );
        END LOOP;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Function to execute SQL (for migrations)
      CREATE OR REPLACE FUNCTION exec_sql(query TEXT)
      RETURNS VOID AS $$
      BEGIN
        EXECUTE query;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Grant permissions to authenticated users
      GRANT EXECUTE ON FUNCTION get_tables() TO authenticated;
      GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO authenticated;
    `,
    rollback_sql: `
      -- Revoke permissions
      REVOKE EXECUTE ON FUNCTION get_tables() FROM authenticated;
      REVOKE EXECUTE ON FUNCTION exec_sql(TEXT) FROM authenticated;

      -- Drop functions
      DROP FUNCTION IF EXISTS get_tables();
      DROP FUNCTION IF EXISTS exec_sql(TEXT);
    `
  },
  {
    id: 13,
    name: 'id_consistency',
    description: 'Improve ID handling and consistency',
    sql: `
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

      -- 7. Create a function to get sections for a page with ID handling
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

      -- 8. Create a function to get a definition with context and ID handling
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
    `,
    rollback_sql: `
      -- Drop functions
      DROP FUNCTION IF EXISTS get_definition_with_context(TEXT, TEXT, TEXT, TEXT);
      DROP FUNCTION IF EXISTS get_sections_for_page(TEXT, INT);
      DROP FUNCTION IF EXISTS get_book_id(TEXT);
      DROP FUNCTION IF EXISTS is_valid_uuid(TEXT);
      DROP FUNCTION IF EXISTS get_book_by_string_id(TEXT);

      -- Remove string_id column from books table
      ALTER TABLE books DROP COLUMN IF EXISTS string_id;
    `
  },
  {
    id: 14,
    name: 'dictionary_enhancements',
    description: 'Enhance dictionary functionality with better indexing and user vocabulary',
    sql: `
      -- 1. Add indexes to the dictionary table for better performance
      CREATE INDEX IF NOT EXISTS idx_dictionary_book_id ON dictionary(book_id);
      CREATE INDEX IF NOT EXISTS idx_dictionary_term ON dictionary(term);
      CREATE INDEX IF NOT EXISTS idx_dictionary_book_term ON dictionary(book_id, term);
      CREATE INDEX IF NOT EXISTS idx_dictionary_context ON dictionary(book_id, chapter_id, section_id);

      -- 2. Create a function to search for terms
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

      -- 3. Create a table for user vocabulary
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

      -- 4. Add indexes to user_vocabulary table
      CREATE INDEX IF NOT EXISTS idx_user_vocabulary_user_id ON user_vocabulary(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_vocabulary_term ON user_vocabulary(term);
      CREATE INDEX IF NOT EXISTS idx_user_vocabulary_book_id ON user_vocabulary(book_id);

      -- 5. Create RLS policies for user_vocabulary table
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

      -- 6. Create a function to save a term to user vocabulary
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

      -- 7. Create a function to get user vocabulary
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

      -- 8. Create a function to log dictionary lookups
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
          response,
          interaction_type
        ) VALUES (
          p_user_id,
          p_book_id,
          p_section_id,
          'Dictionary lookup: ' || p_term,
          CASE WHEN p_found THEN 'Definition found for "' || p_term || '"'
               ELSE 'No definition found for "' || p_term || '"'
          END,
          'dictionary'
        );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `,
    rollback_sql: `
      -- Drop functions
      DROP FUNCTION IF EXISTS log_dictionary_lookup(UUID, UUID, UUID, TEXT, BOOLEAN);
      DROP FUNCTION IF EXISTS get_user_vocabulary(UUID, INT, INT, TEXT);
      DROP FUNCTION IF EXISTS save_to_vocabulary(UUID, TEXT, TEXT, UUID, UUID);
      DROP FUNCTION IF EXISTS search_dictionary_terms(UUID, TEXT, INT);

      -- Drop policies
      DROP POLICY IF EXISTS user_vocabulary_delete ON user_vocabulary;
      DROP POLICY IF EXISTS user_vocabulary_update ON user_vocabulary;
      DROP POLICY IF EXISTS user_vocabulary_insert ON user_vocabulary;
      DROP POLICY IF EXISTS user_vocabulary_select ON user_vocabulary;

      -- Drop indexes
      DROP INDEX IF EXISTS idx_user_vocabulary_book_id;
      DROP INDEX IF EXISTS idx_user_vocabulary_term;
      DROP INDEX IF EXISTS idx_user_vocabulary_user_id;
      DROP INDEX IF EXISTS idx_dictionary_context;
      DROP INDEX IF EXISTS idx_dictionary_book_term;
      DROP INDEX IF EXISTS idx_dictionary_term;
      DROP INDEX IF EXISTS idx_dictionary_book_id;

      -- Drop tables
      DROP TABLE IF EXISTS user_vocabulary;
    `
  },
  {
    id: 15,
    name: 'ai_assistant_enhancements',
    description: 'Enhance AI assistant functionality with better logging and help offers',
    sql: `
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
    `,
    rollback_sql: `
      -- Drop functions
      DROP FUNCTION IF EXISTS log_help_offer(UUID, UUID, UUID, BOOLEAN, VARCHAR, JSONB);
      DROP FUNCTION IF EXISTS check_if_user_needs_help(UUID, UUID, UUID);
      DROP FUNCTION IF EXISTS get_ai_interaction_stats(UUID, UUID, INT);
      DROP FUNCTION IF EXISTS get_user_ai_interactions(UUID, INT, INT, UUID, UUID, VARCHAR);
      DROP FUNCTION IF EXISTS log_ai_interaction(UUID, UUID, UUID, TEXT, TEXT, TEXT, VARCHAR, JSONB);

      -- Drop policies
      DROP POLICY IF EXISTS ai_interactions_select_consultant ON ai_interactions;
      DROP POLICY IF EXISTS ai_interactions_insert ON ai_interactions;
      DROP POLICY IF EXISTS ai_interactions_select ON ai_interactions;

      -- Drop indexes
      DROP INDEX IF EXISTS idx_ai_interactions_interaction_type;
      DROP INDEX IF EXISTS idx_ai_interactions_created_at;
      DROP INDEX IF EXISTS idx_ai_interactions_section_id;
      DROP INDEX IF EXISTS idx_ai_interactions_book_id;
      DROP INDEX IF EXISTS idx_ai_interactions_user_id;

      -- Note: We don't drop the ai_interactions table as it might be used by other features
    `
  },
  {
    id: 16,
    name: 'create_feedback_system',
    description: 'Create feedback system tables and RLS policies',
    sql: `
      -- Create user_feedback table
      CREATE TABLE IF NOT EXISTS user_feedback (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        feedback_type TEXT NOT NULL,
        content TEXT NOT NULL,
        sentiment TEXT,
        has_been_reviewed BOOLEAN DEFAULT FALSE,
        reading_context JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Add indexes
      CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_feedback_feedback_type ON user_feedback(feedback_type);
      CREATE INDEX IF NOT EXISTS idx_user_feedback_has_been_reviewed ON user_feedback(has_been_reviewed);

      -- Enable RLS
      ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

      -- Users can insert their own feedback
      CREATE POLICY insert_own_feedback ON user_feedback
        FOR INSERT TO authenticated
        WITH CHECK (auth.uid() = user_id);

      -- Users can view their own feedback
      CREATE POLICY select_own_feedback ON user_feedback
        FOR SELECT TO authenticated
        USING (auth.uid() = user_id);

      -- Consultants can view all feedback
      CREATE POLICY select_all_feedback_consultant ON user_feedback
        FOR SELECT TO authenticated
        USING (EXISTS (
          SELECT 1 FROM consultant_users
          WHERE consultant_users.user_id = auth.uid()
        ));

      -- Consultants can update feedback (mark as reviewed)
      CREATE POLICY update_feedback_consultant ON user_feedback
        FOR UPDATE TO authenticated
        USING (EXISTS (
          SELECT 1 FROM consultant_users
          WHERE consultant_users.user_id = auth.uid()
        ));
    `,
    rollback_sql: `
      -- Drop policies
      DROP POLICY IF EXISTS insert_own_feedback ON user_feedback;
      DROP POLICY IF EXISTS select_own_feedback ON user_feedback;
      DROP POLICY IF EXISTS select_all_feedback_consultant ON user_feedback;
      DROP POLICY IF EXISTS update_feedback_consultant ON user_feedback;

      -- Drop indexes
      DROP INDEX IF EXISTS idx_user_feedback_user_id;
      DROP INDEX IF EXISTS idx_user_feedback_feedback_type;
      DROP INDEX IF EXISTS idx_user_feedback_has_been_reviewed;

      -- Drop table
      DROP TABLE IF EXISTS user_feedback;
    `
  }
];

/**
 * Get the current schema version from the database
 */
export const getCurrentSchemaVersion = async (
  supabase: SupabaseClient<Database>
): Promise<number> => {
  try {
    appLog('MigrationUtils', 'Checking current schema version', 'info');

    // Check if schema_versions table exists
    const { error: checkError } = await supabase.from('schema_versions').select('id').limit(1);

    if (checkError) {
      appLog('MigrationUtils', 'Schema versions table does not exist yet', 'info');
      return 0;
    }

    const { data, error } = await supabase
      .from('schema_versions')
      .select('version')
      .order('version', { ascending: false })
      .limit(1);

    if (error) {
      appLog('MigrationUtils', 'Error getting schema version', 'error', error);
      throw error;
    }

    const version = data && data.length > 0 ? data[0].version : 0;
    appLog('MigrationUtils', `Current schema version: ${version}`, 'info');
    return version;
  } catch (error) {
    appLog('MigrationUtils', 'Failed to get schema version', 'error', error);
    return 0;
  }
};

/**
 * Apply migrations up to the specified version
 */
export const applyMigrations = async (
  supabase: SupabaseClient<Database>,
  targetVersion: number
): Promise<{ success: boolean; appliedMigrations: string[]; error?: string }> => {
  const currentVersion = await getCurrentSchemaVersion(supabase);
  const appliedMigrations: string[] = [];

  appLog('MigrationUtils', `Applying migrations from version ${currentVersion} to ${targetVersion}`, 'info');

  if (currentVersion >= targetVersion) {
    appLog('MigrationUtils', 'No migrations to apply', 'info');
    return { success: true, appliedMigrations };
  }

  try {
    // Sort migrations by ID
    const migrationsToApply = migrations
      .filter(m => m.id > currentVersion && m.id <= targetVersion)
      .sort((a, b) => a.id - b.id);

    appLog('MigrationUtils', `Found ${migrationsToApply.length} migrations to apply`, 'info');

    for (const migration of migrationsToApply) {
      appLog('MigrationUtils', `Applying migration ${migration.id}: ${migration.name}`, 'info');

      try {
        // Execute the migration SQL
        const { error } = await supabase.rpc('exec_sql', { query: migration.sql });

        if (error) {
          appLog('MigrationUtils', `Error applying migration ${migration.id}`, 'error', error);
          return {
            success: false,
            appliedMigrations,
            error: `Migration ${migration.id} (${migration.name}) failed: ${error.message}`
          };
        }

        // Record the applied migration
        if (migration.id > 1) { // Skip recording the first migration that creates the schema_versions table
          const { error: insertError } = await supabase.from('schema_versions').insert({
            version: migration.id,
            description: migration.description
          });

          if (insertError) {
            appLog('MigrationUtils', `Error recording migration ${migration.id}`, 'error', insertError);
            return {
              success: false,
              appliedMigrations,
              error: `Failed to record migration ${migration.id}: ${insertError.message}`
            };
          }
        } else {
          // For the first migration, manually insert the record
          const { error: insertError } = await supabase.rpc('exec_sql', {
            query: `INSERT INTO schema_versions (version, description) VALUES (1, 'Create schema version tracking table');`
          });

          if (insertError) {
            appLog('MigrationUtils', `Error recording first migration`, 'error', insertError);
            // Continue anyway since the table was created
          }
        }

        appliedMigrations.push(migration.name);
        appLog('MigrationUtils', `Successfully applied migration ${migration.id}`, 'success');
      } catch (error) {
        appLog('MigrationUtils', `Exception applying migration ${migration.id}`, 'error', error);
        return {
          success: false,
          appliedMigrations,
          error: `Migration ${migration.id} (${migration.name}) failed with exception: ${error.message}`
        };
      }
    }

    appLog('MigrationUtils', `Successfully applied ${appliedMigrations.length} migrations`, 'success');
    return { success: true, appliedMigrations };
  } catch (error: any) {
    appLog('MigrationUtils', 'Error in applyMigrations', 'error', error);
    return {
      success: false,
      appliedMigrations,
      error: error.message
    };
  }
};

/**
 * Rollback migrations to the specified version
 */
export const rollbackMigrations = async (
  supabase: SupabaseClient<Database>,
  targetVersion: number
): Promise<{ success: boolean; rolledBackMigrations: string[]; error?: string }> => {
  const currentVersion = await getCurrentSchemaVersion(supabase);
  const rolledBackMigrations: string[] = [];

  appLog('MigrationUtils', `Rolling back migrations from version ${currentVersion} to ${targetVersion}`, 'info');

  if (currentVersion <= targetVersion) {
    appLog('MigrationUtils', 'No migrations to roll back', 'info');
    return { success: true, rolledBackMigrations };
  }

  try {
    // Sort migrations in reverse order
    const migrationsToRollback = migrations
      .filter(m => m.id > targetVersion && m.id <= currentVersion)
      .sort((a, b) => b.id - a.id); // Reverse order

    appLog('MigrationUtils', `Found ${migrationsToRollback.length} migrations to roll back`, 'info');

    for (const migration of migrationsToRollback) {
      appLog('MigrationUtils', `Rolling back migration ${migration.id}: ${migration.name}`, 'info');

      try {
        // Execute the rollback SQL
        const { error } = await supabase.rpc('exec_sql', { query: migration.rollback_sql });

        if (error) {
          appLog('MigrationUtils', `Error rolling back migration ${migration.id}`, 'error', error);
          return {
            success: false,
            rolledBackMigrations,
            error: `Rollback ${migration.id} (${migration.name}) failed: ${error.message}`
          };
        }

        // Delete the version record
        const { error: deleteError } = await supabase
          .from('schema_versions')
          .delete()
          .eq('version', migration.id);

        if (deleteError) {
          appLog('MigrationUtils', `Error deleting migration record ${migration.id}`, 'error', deleteError);
          // Continue anyway since the rollback was successful
        }

        rolledBackMigrations.push(migration.name);
        appLog('MigrationUtils', `Successfully rolled back migration ${migration.id}`, 'success');
      } catch (error) {
        appLog('MigrationUtils', `Exception rolling back migration ${migration.id}`, 'error', error);
        return {
          success: false,
          rolledBackMigrations,
          error: `Rollback ${migration.id} (${migration.name}) failed with exception: ${error.message}`
        };
      }
    }

    appLog('MigrationUtils', `Successfully rolled back ${rolledBackMigrations.length} migrations`, 'success');
    return { success: true, rolledBackMigrations };
  } catch (error: any) {
    appLog('MigrationUtils', 'Error in rollbackMigrations', 'error', error);
    return {
      success: false,
      rolledBackMigrations,
      error: error.message
    };
  }
};

/**
 * Verify that the database schema matches the expected state
 */
export const verifySchema = async (
  supabase: SupabaseClient<Database>
): Promise<{
  valid: boolean;
  missingTables: string[];
  missingColumns: Record<string, string[]>;
  errors: string[];
}> => {
  appLog('MigrationUtils', 'Verifying database schema', 'info');

  const expectedTables = [
    'books',
    'chapters',
    'sections',
    'profiles',
    'consultant_users',
    'verification_codes',
    'dictionary',
    'reading_progress',
    'reading_stats',
    'ai_interactions',
    'ai_prompts',
    'user_prompt_responses',
    'consultant_assignments',
    'consultant_triggers',
    'help_requests',
    'user_feedback',
    'consultant_actions_log',
    'schema_versions'
  ];

  const missingTables: string[] = [];
  const missingColumns: Record<string, string[]> = {};
  const errors: string[] = [];

  try {
    // Check for each expected table
    for (const tableName of expectedTables) {
      try {
        const { data, error } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_name', tableName);

        if (error) {
          appLog('MigrationUtils', `Error checking table ${tableName}`, 'error', error);
          errors.push(`Error checking table ${tableName}: ${error.message}`);
          continue;
        }

        if (!data || data.length === 0) {
          appLog('MigrationUtils', `Missing table: ${tableName}`, 'warning');
          missingTables.push(tableName);
        }
      } catch (error) {
        appLog('MigrationUtils', `Exception checking table ${tableName}`, 'error', error);
        errors.push(`Exception checking table ${tableName}: ${error.message}`);
      }
    }

    // Define expected columns for key tables
    const expectedColumns: Record<string, string[]> = {
      'profiles': ['id', 'first_name', 'last_name', 'email', 'book_verified', 'verified_book_code', 'is_consultant'],
      'dictionary': ['id', 'book_id', 'page_number', 'section_index', 'trigger_text', 'explanation_type', 'content', 'created_at'],
      'consultant_triggers': ['id', 'consultant_id', 'user_id', 'book_id', 'trigger_type', 'message', 'is_processed', 'processed_at', 'created_at'],
      'reading_stats': ['id', 'user_id', 'book_id', 'total_reading_time', 'pages_read', 'percentage_complete', 'last_session_date', 'created_at', 'updated_at'],
      'books': ['id', 'title', 'author', 'description', 'total_pages', 'created_at', 'string_id']
    };

    // Check columns for specific tables
    for (const [tableName, columns] of Object.entries(expectedColumns)) {
      if (missingTables.includes(tableName)) continue;

      try {
        const { data, error } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_schema', 'public')
          .eq('table_name', tableName);

        if (error) {
          appLog('MigrationUtils', `Error checking columns for ${tableName}`, 'error', error);
          errors.push(`Error checking columns for ${tableName}: ${error.message}`);
          continue;
        }

        if (!data) {
          appLog('MigrationUtils', `No column data returned for ${tableName}`, 'warning');
          continue;
        }

        const existingColumns = data.map(c => c.column_name);
        const missing = columns.filter(col => !existingColumns.includes(col));

        if (missing.length > 0) {
          appLog('MigrationUtils', `Missing columns in ${tableName}: ${missing.join(', ')}`, 'warning');
          missingColumns[tableName] = missing;
        }
      } catch (error) {
        appLog('MigrationUtils', `Exception checking columns for ${tableName}`, 'error', error);
        errors.push(`Exception checking columns for ${tableName}: ${error.message}`);
      }
    }

    const valid = missingTables.length === 0 && Object.keys(missingColumns).length === 0 && errors.length === 0;

    if (valid) {
      appLog('MigrationUtils', 'Schema verification passed', 'success');
    } else {
      appLog('MigrationUtils', 'Schema verification failed', 'warning', {
        missingTables,
        missingColumns,
        errors
      });
    }

    return {
      valid,
      missingTables,
      missingColumns,
      errors
    };
  } catch (error) {
    appLog('MigrationUtils', 'Error in verifySchema', 'error', error);
    return {
      valid: false,
      missingTables,
      missingColumns,
      errors: [...errors, `Exception in verifySchema: ${error.message}`]
    };
  }
};
