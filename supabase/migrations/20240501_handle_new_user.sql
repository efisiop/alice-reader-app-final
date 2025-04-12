-- Function to handle new user creation
-- This function will be triggered when a new user is created in auth.users
-- It will create a corresponding row in public.profiles

-- Create or replace the function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert a new row into public.profiles
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    is_verified,
    book_verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    '', -- Default empty first name
    '', -- Default empty last name
    FALSE, -- Not verified by default
    FALSE, -- Book not verified by default
    NOW(),
    NOW()
  );
  
  -- Log the creation for debugging
  INSERT INTO public.audit_logs (
    action,
    table_name,
    record_id,
    user_id,
    details,
    created_at
  )
  VALUES (
    'CREATE',
    'profiles',
    NEW.id,
    NEW.id,
    json_build_object('email', NEW.email, 'trigger', 'handle_new_user'),
    NOW()
  )
  ON CONFLICT DO NOTHING; -- In case audit_logs table doesn't exist
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
