-- ALICE READER - CONSULTANT FEATURE MIGRATION SCRIPT

-- 1. Fix schema issues from Phase 2
-- Add missing last_read_at column to reading_progress
ALTER TABLE reading_progress 
ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ DEFAULT NOW();

-- Create reading_stats table if it doesn't exist
CREATE TABLE IF NOT EXISTS reading_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  total_reading_time INT DEFAULT 0,
  pages_read INT DEFAULT 0,
  last_session_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- Add string_id column to books table for better ID handling
ALTER TABLE books
ADD COLUMN IF NOT EXISTS string_id TEXT;

-- Update the existing books to add string IDs
UPDATE books
SET string_id = 'alice-in-wonderland'
WHERE id = '550e8400-e29b-41d4-a716-446655440000'
AND string_id IS NULL;

-- 2. Add new tables for consultant features

-- Create consultant_users table to track consultants
CREATE TABLE IF NOT EXISTS consultant_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_feedback table for reader experiences
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
  feedback_type TEXT NOT NULL, -- 'AHA_MOMENT', 'CONFUSION', 'GENERAL'
  content TEXT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create help_requests table for assistance
CREATE TABLE IF NOT EXISTS help_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'IN_PROGRESS', 'RESOLVED'
  content TEXT NOT NULL,
  context TEXT, -- Selected text that prompted the help request
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create consultant_triggers table for AI prompts
CREATE TABLE IF NOT EXISTS consultant_triggers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  trigger_type TEXT NOT NULL, -- 'ENGAGEMENT', 'CHECK_IN', 'QUIZ', 'ENCOURAGE'
  message TEXT,
  is_processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create consultant_actions_log for audit trail
CREATE TABLE IF NOT EXISTS consultant_actions_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL, -- 'TRIGGER_PROMPT', 'RESOLVE_HELP', 'VIEW_PROFILE', etc.
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Set up RLS policies

-- RLS for reading_stats
ALTER TABLE reading_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reading stats" 
ON reading_stats FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own reading stats" 
ON reading_stats FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own reading stats" 
ON reading_stats FOR INSERT WITH CHECK (user_id = auth.uid());

-- Consultant access to reading_stats
CREATE POLICY "Consultants can view all reading stats" 
ON reading_stats FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM consultant_users WHERE user_id = auth.uid() AND is_active = true
));

-- RLS for consultant_users
ALTER TABLE consultant_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can view consultant list" 
ON consultant_users FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM consultant_users WHERE user_id = auth.uid() AND is_active = true
) OR user_id = auth.uid());

-- Only superadmins can modify consultants (handled via service role)

-- RLS for user_feedback
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback" 
ON user_feedback FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own feedback" 
ON user_feedback FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Consultants can view all feedback" 
ON user_feedback FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM consultant_users WHERE user_id = auth.uid() AND is_active = true
));

-- RLS for help_requests
ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own help requests" 
ON help_requests FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own help requests" 
ON help_requests FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own help requests" 
ON help_requests FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Consultants can view all help requests" 
ON help_requests FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM consultant_users WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Consultants can update help requests" 
ON help_requests FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM consultant_users WHERE user_id = auth.uid() AND is_active = true
));

-- RLS for consultant_triggers
ALTER TABLE consultant_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view triggers targeted at them" 
ON consultant_triggers FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Consultants can view all triggers" 
ON consultant_triggers FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM consultant_users WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Consultants can insert triggers" 
ON consultant_triggers FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM consultant_users WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Consultants can update triggers" 
ON consultant_triggers FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM consultant_users WHERE user_id = auth.uid() AND is_active = true
));

-- RLS for consultant_actions_log
ALTER TABLE consultant_actions_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can view action logs involving them" 
ON consultant_actions_log FOR SELECT 
USING (consultant_id = auth.uid() OR EXISTS (
  SELECT 1 FROM consultant_users WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Consultants can insert their own action logs" 
ON consultant_actions_log FOR INSERT 
WITH CHECK (consultant_id = auth.uid() AND EXISTS (
  SELECT 1 FROM consultant_users WHERE user_id = auth.uid() AND is_active = true
));

-- 4. Create indexes for performance

CREATE INDEX IF NOT EXISTS idx_reading_stats_user_id ON reading_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_stats_book_id ON reading_stats(book_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_user_id ON help_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_status ON help_requests(status);
CREATE INDEX IF NOT EXISTS idx_consultant_triggers_user_id ON consultant_triggers(user_id);
CREATE INDEX IF NOT EXISTS idx_consultant_triggers_processed ON consultant_triggers(is_processed);
CREATE INDEX IF NOT EXISTS idx_consultant_actions_log_consultant_id ON consultant_actions_log(consultant_id);
CREATE INDEX IF NOT EXISTS idx_consultant_actions_log_user_id ON consultant_actions_log(user_id);

-- 5. Create helper functions

-- Function to check if user is a consultant
CREATE OR REPLACE FUNCTION is_consultant()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM consultant_users
    WHERE user_id = auth.uid() AND is_active = true
  );
END;
$$;

-- Function to log consultant actions
CREATE OR REPLACE FUNCTION log_consultant_action(
  p_user_id UUID,
  p_action_type TEXT,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_action_id UUID;
BEGIN
  -- Verify caller is a consultant
  IF NOT EXISTS (
    SELECT 1 FROM consultant_users
    WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Not authorized to log consultant actions';
  END IF;
  
  -- Insert the action log
  INSERT INTO consultant_actions_log (
    consultant_id, user_id, action_type, details
  ) VALUES (
    auth.uid(), p_user_id, p_action_type, p_details
  )
  RETURNING id INTO v_action_id;
  
  RETURN v_action_id;
END;
$$;

-- Function to create consultant-triggered prompt
CREATE OR REPLACE FUNCTION create_consultant_trigger(
  p_user_id UUID,
  p_book_id UUID,
  p_trigger_type TEXT,
  p_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trigger_id UUID;
BEGIN
  -- Verify caller is a consultant
  IF NOT EXISTS (
    SELECT 1 FROM consultant_users
    WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Not authorized to create triggers';
  END IF;
  
  -- Insert the trigger
  INSERT INTO consultant_triggers (
    consultant_id, user_id, book_id, trigger_type, message
  ) VALUES (
    auth.uid(), p_user_id, p_book_id, p_trigger_type, p_message
  )
  RETURNING id INTO v_trigger_id;
  
  -- Log the action
  PERFORM log_consultant_action(
    p_user_id, 
    'TRIGGER_PROMPT',
    jsonb_build_object(
      'trigger_id', v_trigger_id,
      'trigger_type', p_trigger_type
    )
  );
  
  RETURN v_trigger_id;
END;
$$;

-- Function to update help request status
CREATE OR REPLACE FUNCTION update_help_request_status(
  p_request_id UUID,
  p_status TEXT,
  p_assign_to_self BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verify caller is a consultant
  IF NOT EXISTS (
    SELECT 1 FROM consultant_users
    WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Not authorized to update help requests';
  END IF;
  
  -- Get the user ID for the help request
  SELECT user_id INTO v_user_id
  FROM help_requests
  WHERE id = p_request_id;
  
  IF v_user_id IS NULL THEN
    RETURN FALSE; -- Help request not found
  END IF;
  
  -- Update the help request
  UPDATE help_requests
  SET 
    status = p_status,
    assigned_to = CASE WHEN p_assign_to_self THEN auth.uid() ELSE assigned_to END,
    resolved_at = CASE WHEN p_status = 'RESOLVED' THEN NOW() ELSE resolved_at END,
    updated_at = NOW()
  WHERE id = p_request_id;
  
  -- Log the action
  PERFORM log_consultant_action(
    v_user_id, 
    'UPDATE_HELP_REQUEST',
    jsonb_build_object(
      'request_id', p_request_id,
      'new_status', p_status,
      'assigned_to_self', p_assign_to_self
    )
  );
  
  RETURN TRUE;
END;
$$;

-- Create trigger functions for timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for timestamps
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

DROP TRIGGER IF EXISTS update_reading_progress_timestamp ON reading_progress;
CREATE TRIGGER update_reading_progress_timestamp
BEFORE UPDATE ON reading_progress
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 6. Add sample data for testing (uncomment to use)
/*
-- Add a consultant user (for testing - use an existing user ID)
INSERT INTO consultant_users (user_id)
VALUES ('your-user-id-here');

-- Create sample feedback
INSERT INTO user_feedback (user_id, book_id, feedback_type, content)
VALUES 
  ('user-id-1', '550e8400-e29b-41d4-a716-446655440000', 'AHA_MOMENT', 'I finally understood why the Cheshire Cat disappears!'),
  ('user-id-2', '550e8400-e29b-41d4-a716-446655440000', 'GENERAL', 'The wordplay in this book is fascinating.');

-- Create sample help request
INSERT INTO help_requests (user_id, book_id, status, content)
VALUES ('user-id-3', '550e8400-e29b-41d4-a716-446655440000', 'PENDING', 'I''m confused about the symbolism in the tea party scene.');
*/
