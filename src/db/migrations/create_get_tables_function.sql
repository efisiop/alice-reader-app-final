-- Function to get all tables and their information
CREATE OR REPLACE FUNCTION get_tables()
RETURNS TABLE (
  table_name TEXT,
  row_count BIGINT,
  last_modified TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tables.table_name::TEXT,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tables.table_name)::BIGINT AS row_count,
    NULL::TIMESTAMPTZ AS last_modified
  FROM 
    information_schema.tables tables
  WHERE 
    table_schema = 'public'
  ORDER BY 
    tables.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission to authenticated users
GRANT EXECUTE ON FUNCTION get_tables() TO authenticated;
