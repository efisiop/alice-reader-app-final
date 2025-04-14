-- Create an RPC function to update profiles with proper security
-- This can be used as an alternative method when direct updates fail

-- First, create the function
CREATE OR REPLACE FUNCTION public.update_profile(
  user_id UUID,
  profile_updates JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  updated_record RECORD;
BEGIN
  -- Log the attempt
  RAISE NOTICE 'update_profile: Updating profile for user %', user_id;
  
  -- Security check - only allow users to update their own profile
  -- or allow service role to update any profile
  IF auth.uid() != user_id AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Not authorized to update this profile';
  END IF;
  
  -- Perform the update
  UPDATE public.profiles
  SET 
    first_name = COALESCE(profile_updates->>'first_name', first_name),
    last_name = COALESCE(profile_updates->>'last_name', last_name),
    book_verified = COALESCE((profile_updates->>'book_verified')::boolean, book_verified),
    updated_at = NOW()
  WHERE id = user_id
  RETURNING *
  INTO updated_record;
  
  -- Check if anything was updated
  IF updated_record IS NULL THEN
    RAISE EXCEPTION 'Profile not found or update failed';
  END IF;
  
  -- Convert the record to JSON for the return value
  SELECT row_to_json(updated_record)::JSONB INTO result;
  
  -- Log success
  RAISE NOTICE 'update_profile: Successfully updated profile for %', user_id;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    RAISE NOTICE 'update_profile: Error updating profile for %: %', user_id, SQLERRM;
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Grant execute privileges
GRANT EXECUTE ON FUNCTION public.update_profile(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_profile(UUID, JSONB) TO service_role;

-- Log that this migration was applied
INSERT INTO public.migrations (name, applied_at)
VALUES ('20240601_profile_update_rpc', NOW())
ON CONFLICT (name) DO UPDATE
SET applied_at = NOW(); 