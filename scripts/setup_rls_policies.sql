-- *** Row Level Security Policies ***

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view public profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE USING (auth.uid() = id);

-- Consultants can view all profiles
CREATE POLICY "Consultants can view all profiles" 
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_consultant = true
  )
);

-- Books
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Books are viewable by all authenticated users
CREATE POLICY "Books are viewable by authenticated users" 
ON books FOR SELECT USING (auth.role() = 'authenticated');

-- Chapters and Sections
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

-- Chapters and sections are viewable by all authenticated users
CREATE POLICY "Chapters are viewable by authenticated users" 
ON chapters FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Sections are viewable by authenticated users" 
ON sections FOR SELECT USING (auth.role() = 'authenticated');

-- Verification Codes
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Users can check if a code exists
CREATE POLICY "Anyone can verify a code exists" 
ON verification_codes FOR SELECT
USING (auth.role() = 'authenticated');

-- Users can update verification codes for themselves
CREATE POLICY "Users can mark codes as used by themselves" 
ON verification_codes FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (used_by = auth.uid() OR used_by IS NULL);

-- Dictionary
ALTER TABLE dictionary ENABLE ROW LEVEL SECURITY;

-- Dictionary terms are viewable by all authenticated users
CREATE POLICY "Dictionary entries are viewable by authenticated users" 
ON dictionary FOR SELECT USING (auth.role() = 'authenticated');

-- Reading Progress
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

-- Users can view and manage their own reading progress
CREATE POLICY "Users can view their own reading progress" 
ON reading_progress FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own reading progress" 
ON reading_progress FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own reading progress" 
ON reading_progress FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own reading progress" 
ON reading_progress FOR DELETE USING (user_id = auth.uid());

-- Consultants can view their assigned users' reading progress
CREATE POLICY "Consultants can view assigned users' reading progress" 
ON reading_progress FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM consultant_assignments ca
    WHERE ca.consultant_id = auth.uid()
    AND ca.user_id = reading_progress.user_id
    AND ca.book_id = reading_progress.book_id
    AND ca.active = true
  )
);

-- Reading Stats
ALTER TABLE reading_stats ENABLE ROW LEVEL SECURITY;

-- Similar policies for reading_stats
CREATE POLICY "Users can view their own reading stats" 
ON reading_stats FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own reading stats" 
ON reading_stats FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own reading stats" 
ON reading_stats FOR INSERT WITH CHECK (user_id = auth.uid());

-- Consultants can view their assigned users' reading stats
CREATE POLICY "Consultants can view assigned users' reading stats" 
ON reading_stats FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM consultant_assignments ca
    WHERE ca.consultant_id = auth.uid()
    AND ca.user_id = reading_stats.user_id
    AND ca.book_id = reading_stats.book_id
    AND ca.active = true
  )
);

-- AI Interactions
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- Users can view and create their own AI interactions
CREATE POLICY "Users can view their own AI interactions" 
ON ai_interactions FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own AI interactions" 
ON ai_interactions FOR INSERT WITH CHECK (user_id = auth.uid());

-- Consultants can view their assigned users' AI interactions
CREATE POLICY "Consultants can view assigned users' AI interactions" 
ON ai_interactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM consultant_assignments ca
    WHERE ca.consultant_id = auth.uid()
    AND ca.user_id = ai_interactions.user_id
    AND ca.book_id = ai_interactions.book_id
    AND ca.active = true
  )
);

-- AI Prompts
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;

-- AI prompts are viewable by all authenticated users
CREATE POLICY "AI prompts are viewable by authenticated users" 
ON ai_prompts FOR SELECT USING (auth.role() = 'authenticated');

-- User Prompt Responses
ALTER TABLE user_prompt_responses ENABLE ROW LEVEL SECURITY;

-- Users can view and create their own prompt responses
CREATE POLICY "Users can view their own prompt responses" 
ON user_prompt_responses FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own prompt responses" 
ON user_prompt_responses FOR INSERT WITH CHECK (user_id = auth.uid());

-- Consultants can view their assigned users' prompt responses
CREATE POLICY "Consultants can view assigned users' prompt responses" 
ON user_prompt_responses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM consultant_assignments ca
    WHERE ca.consultant_id = auth.uid()
    AND ca.user_id = user_prompt_responses.user_id
    AND ca.active = true
  )
);

-- Consultant Assignments
ALTER TABLE consultant_assignments ENABLE ROW LEVEL SECURITY;

-- Consultants can view their own assignments
CREATE POLICY "Consultants can view their own assignments" 
ON consultant_assignments FOR SELECT USING (consultant_id = auth.uid());

-- Users can view their own consultant assignments
CREATE POLICY "Users can view their own consultant assignments" 
ON consultant_assignments FOR SELECT USING (user_id = auth.uid());

-- Only admin can create consultant assignments (via service role)

-- Consultant Triggers
ALTER TABLE consultant_triggers ENABLE ROW LEVEL SECURITY;

-- Consultants can view and create triggers for their assigned users
CREATE POLICY "Consultants can view and create triggers for assigned users" 
ON consultant_triggers FOR SELECT
USING (
  consultant_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM consultant_assignments ca
    WHERE ca.consultant_id = auth.uid()
    AND ca.user_id = consultant_triggers.user_id
    AND ca.active = true
  )
);

CREATE POLICY "Consultants can create triggers for assigned users" 
ON consultant_triggers FOR INSERT
WITH CHECK (
  consultant_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM consultant_assignments ca
    WHERE ca.consultant_id = auth.uid()
    AND ca.user_id = consultant_triggers.user_id
    AND ca.active = true
  )
);

-- Users receive triggers targeted to them
CREATE POLICY "Users can view triggers targeted to them" 
ON consultant_triggers FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update processed status on their triggers" 
ON consultant_triggers FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND (OLD.is_processed IS DISTINCT FROM NEW.is_processed));
