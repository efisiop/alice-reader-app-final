-- Fix the ambiguous column reference in get_tables function
CREATE OR REPLACE FUNCTION get_tables()
RETURNS TABLE (
  table_name TEXT,
  row_count BIGINT,
  last_modified TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::TEXT,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t.table_name)::BIGINT AS row_count,
    NULL::TIMESTAMPTZ AS last_modified
  FROM 
    information_schema.tables t
  WHERE 
    t.table_schema = 'public'
  ORDER BY 
    t.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission to authenticated users
GRANT EXECUTE ON FUNCTION get_tables() TO authenticated;

-- Fix the RLS policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own reading stats" ON reading_stats;
DROP POLICY IF EXISTS "Users can update their own reading stats" ON reading_stats;
DROP POLICY IF EXISTS "Users can insert their own reading stats" ON reading_stats;

-- Create policies
CREATE POLICY "Users can view their own reading stats" 
ON reading_stats FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own reading stats" 
ON reading_stats FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own reading stats" 
ON reading_stats FOR INSERT WITH CHECK (user_id = auth.uid());
