-- SQL commands to verify profile UPDATE permissions and test direct update

-- 1. Check table grants for profiles table
SELECT grantee, privilege_type, table_schema, table_name
FROM information_schema.table_privileges
WHERE table_name = 'profiles';

-- 2. Check RLS policies for profiles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 3. Test direct SQL update as authenticated user

-- Step 1: Find a test user ID
SELECT id, email, first_name, last_name, book_verified FROM public.profiles LIMIT 5;
-- Note: Copy one of the user IDs for use in subsequent steps

-- Step 2: Set role to authenticated
SET ROLE authenticated;

-- Step 3: Set auth.uid() to the test user ID
-- This is the crucial step - we need to set up the auth context properly
SELECT set_config('request.jwt.claim.sub', 'USER_ID_HERE', false);
-- Replace USER_ID_HERE with actual ID from Step 1

-- Step 4: Verify the auth context is set up
SELECT current_setting('request.jwt.claim.sub');

-- Step 5: Attempt the profile update
UPDATE public.profiles
SET 
  first_name = 'Direct SQL Test',
  last_name = 'Final Test', 
  book_verified = true
WHERE id = 'USER_ID_HERE';
-- Replace USER_ID_HERE with actual ID from Step 1

-- Step 6: Verify the update worked
SELECT id, email, first_name, last_name, book_verified
FROM public.profiles 
WHERE id = 'USER_ID_HERE';
-- Replace USER_ID_HERE with actual ID from Step 1

-- Step 7: Reset role
RESET ROLE;

