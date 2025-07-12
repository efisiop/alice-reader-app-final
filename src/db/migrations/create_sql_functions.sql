-- Function to execute arbitrary SQL (admin only!)
CREATE OR REPLACE FUNCTION run_sql(sql TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Alternative function for statement execution
CREATE OR REPLACE FUNCTION exec_sql(query TEXT) 
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;

-- Grant permission to authenticated users (in production, restrict this further)
GRANT EXECUTE ON FUNCTION run_sql TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql TO authenticated;
