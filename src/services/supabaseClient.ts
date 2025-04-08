import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../config';

const supabaseUrl = supabaseConfig.supabaseUrl;
const supabaseAnonKey = supabaseConfig.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);