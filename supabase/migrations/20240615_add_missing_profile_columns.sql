-- Add missing columns to profiles table if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS book_verified BOOLEAN DEFAULT FALSE;

-- Grant permissions on these columns
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Log the change
INSERT INTO public.audit_logs (
  action,
  table_name,
  details,
  created_at
)
VALUES (
  'ALTER',
  'profiles',
  json_build_object('description', 'Added missing columns is_verified and book_verified'),
  NOW()
)
ON CONFLICT DO NOTHING; -- In case audit_logs table doesn't exist
