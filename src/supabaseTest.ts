import { createClient } from '@supabase/supabase-js';
import { appLog } from './components/LogViewer';

// Simple function to test Supabase connection
export async function testConnection() {
  try {
    console.log('supabaseTest: Testing connection to Supabase');
    
    // Get Supabase URL and key from environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('supabaseTest: Missing Supabase URL or key');
      return {
        success: false,
        error: new Error('Missing Supabase URL or key')
      };
    }
    
    console.log('supabaseTest: Creating Supabase client');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test a simple query
    console.log('supabaseTest: Executing test query');
    const { data, error } = await supabase
      .from('books')
      .select('id, title')
      .limit(1);
      
    if (error) {
      console.error('supabaseTest: Query failed', error);
      return {
        success: false,
        error
      };
    }
    
    console.log('supabaseTest: Connection successful', data);
    return {
      success: true,
      data: {
        message: 'Connection successful',
        timestamp: new Date().toISOString(),
        testData: data
      }
    };
  } catch (error) {
    console.error('supabaseTest: Error testing connection', error);
    return {
      success: false,
      error
    };
  }
}
