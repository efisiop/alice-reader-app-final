import { appLog } from '../components/LogViewer';
import { getSupabaseClient } from '../services/supabaseClient';

/**
 * Diagnostic function to test profile updates
 * This is for debugging purposes only
 */
export async function testProfileUpdate(userId: string, updates: any) {
  try {
    console.log('DIAGNOSTIC: Testing profile update for user:', userId);
    console.log('DIAGNOSTIC: Updates to apply:', updates);
    
    const client = await getSupabaseClient();
    
    // First check if profile exists
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    console.log('DIAGNOSTIC: Current profile:', profile);
    console.log('DIAGNOSTIC: Profile error:', profileError);
    
    if (profileError) {
      return { success: false, error: profileError };
    }
    
    // Try direct update
    console.log('DIAGNOSTIC: Attempting direct update');
    const { data: updateResult, error: updateError } = await client
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select();
      
    console.log('DIAGNOSTIC: Update result:', updateResult);
    console.log('DIAGNOSTIC: Update error:', updateError);
    
    if (!updateError) {
      return { success: true, data: updateResult };
    }
    
    // Try RPC method
    console.log('DIAGNOSTIC: Attempting RPC update');
    const { data: rpcResult, error: rpcError } = await client
      .rpc('update_profile', {
        user_id: userId,
        profile_updates: updates
      });
      
    console.log('DIAGNOSTIC: RPC result:', rpcResult);
    console.log('DIAGNOSTIC: RPC error:', rpcError);
    
    if (!rpcError) {
      return { success: true, data: rpcResult };
    }
    
    return { 
      success: false, 
      error: 'All update methods failed',
      directError: updateError,
      rpcError: rpcError
    };
  } catch (error) {
    console.log('DIAGNOSTIC: Exception during profile update test:', error);
    return { success: false, error };
  }
}
