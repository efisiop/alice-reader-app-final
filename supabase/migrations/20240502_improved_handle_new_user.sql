-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create an improved function with better error handling and logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Log the attempt (this will appear in Supabase logs)
    RAISE NOTICE 'handle_new_user: Trigger fired for user % with email %', NEW.id, NEW.email;
    
    -- Check if profile already exists to avoid conflicts
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
        RAISE NOTICE 'handle_new_user: Profile already exists for user %', NEW.id;
        RETURN NEW;
    END IF;
    
    -- Log the attempt to insert
    RAISE NOTICE 'handle_new_user: Attempting to insert profile for user %', NEW.id;
    
    -- Insert the new profile
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
    
    RAISE NOTICE 'handle_new_user: Successfully created profile for user % with email %', NEW.id, NEW.email;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error (this will appear in Supabase logs)
        RAISE NOTICE 'handle_new_user: Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW; -- Still return NEW to allow the user creation to proceed
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Verify the trigger was created
SELECT 
    tgname AS trigger_name,
    tgenabled AS is_enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' 
  AND c.relname = 'users'
  AND t.tgname = 'on_auth_user_created';
