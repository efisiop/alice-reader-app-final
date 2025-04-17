-- Interaction Logging Migration Script for Alice Reader
-- This script creates and configures the interactions table for comprehensive user activity logging

-- 1. Create the interactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
  section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
  page_number INTEGER,
  content TEXT,
  context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON public.interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_event_type ON public.interactions(event_type);
CREATE INDEX IF NOT EXISTS idx_interactions_book_id ON public.interactions(book_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON public.interactions(created_at);

-- 3. Set up Row Level Security (RLS)
-- Enable RLS on the interactions table
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view only their own interactions
CREATE POLICY "Users can view their own interactions"
  ON public.interactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own interactions
CREATE POLICY "Users can insert their own interactions"
  ON public.interactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow service role to manage all interactions
CREATE POLICY "Service role can manage all interactions"
  ON public.interactions
  USING (auth.role() = 'service_role');

-- 4. Add event_type enum values (for documentation purposes)
COMMENT ON COLUMN public.interactions.event_type IS 'Event types include: 
LOGIN, 
PAGE_SYNC, 
SECTION_SYNC, 
DEFINITION_LOOKUP, 
AI_QUERY, 
HELP_REQUEST, 
FEEDBACK_SUBMISSION, 
QUIZ_ATTEMPT, 
NOTE_CREATION';

-- 5. Add function to log interactions (for direct database calls)
CREATE OR REPLACE FUNCTION log_interaction(
  p_user_id UUID,
  p_event_type TEXT,
  p_book_id UUID DEFAULT NULL,
  p_section_id UUID DEFAULT NULL,
  p_page_number INTEGER DEFAULT NULL,
  p_content TEXT DEFAULT NULL,
  p_context JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_interaction_id UUID;
BEGIN
  INSERT INTO public.interactions (
    user_id,
    event_type,
    book_id,
    section_id,
    page_number,
    content,
    context,
    created_at
  ) VALUES (
    p_user_id,
    p_event_type,
    p_book_id,
    p_section_id,
    p_page_number,
    p_content,
    p_context,
    NOW()
  )
  RETURNING id INTO v_interaction_id;
  
  RETURN v_interaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
