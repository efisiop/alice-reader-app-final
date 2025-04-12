// src/services/verificationService.ts
import { getSupabaseClient } from './supabaseClient';
import { appLog } from '../components/LogViewer';
import { BookId } from '../types/idTypes';

/**
 * Generate a random verification code
 * @param length Length of the code
 * @returns Random verification code
 */
export const generateRandomCode = (length: number = 8): string => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};

/**
 * Create a new verification code
 * @param bookId ID of the book
 * @param code Optional custom code (will generate random if not provided)
 * @returns The created verification code or null if failed
 */
export const createVerificationCode = async (
  bookId: string | BookId,
  code?: string
): Promise<string | null> => {
  try {
    appLog('VerificationService', 'Creating verification code', 'info');
    const supabase = await getSupabaseClient();
    
    // Generate code if not provided
    const verificationCode = code || generateRandomCode(8);
    
    // Insert into database
    const { data, error } = await supabase
      .from('verification_codes')
      .insert({
        code: verificationCode,
        book_id: bookId.toString(),
        is_used: false
      })
      .select('code')
      .single();
    
    if (error) {
      appLog('VerificationService', `Error creating verification code: ${error.message}`, 'error');
      return null;
    }
    
    appLog('VerificationService', 'Verification code created successfully', 'success');
    return data.code;
  } catch (error: any) {
    appLog('VerificationService', `Error creating verification code: ${error.message}`, 'error');
    return null;
  }
};

/**
 * Get all verification codes for a book
 * @param bookId ID of the book
 * @returns Array of verification codes
 */
export const getVerificationCodes = async (bookId: string | BookId) => {
  try {
    appLog('VerificationService', 'Getting verification codes', 'info');
    const supabase = await getSupabaseClient();
    
    const { data, error } = await supabase
      .from('verification_codes')
      .select('code, is_used, used_by, created_at')
      .eq('book_id', bookId.toString())
      .order('created_at', { ascending: false });
    
    if (error) {
      appLog('VerificationService', `Error getting verification codes: ${error.message}`, 'error');
      return [];
    }
    
    appLog('VerificationService', `Retrieved ${data.length} verification codes`, 'success');
    return data;
  } catch (error: any) {
    appLog('VerificationService', `Error getting verification codes: ${error.message}`, 'error');
    return [];
  }
};

/**
 * Validate a verification code
 * @param code Verification code to validate
 * @returns Object with validation result
 */
export const validateVerificationCode = async (code: string) => {
  try {
    appLog('VerificationService', 'Validating verification code', 'info');
    const supabase = await getSupabaseClient();
    
    const { data, error } = await supabase
      .from('verification_codes')
      .select('book_id, is_used')
      .eq('code', code)
      .single();
    
    if (error) {
      appLog('VerificationService', `Error validating verification code: ${error.message}`, 'error');
      return { valid: false, bookId: null, isUsed: false };
    }
    
    appLog('VerificationService', 'Verification code validated', 'success');
    return { valid: true, bookId: data.book_id, isUsed: data.is_used };
  } catch (error: any) {
    appLog('VerificationService', `Error validating verification code: ${error.message}`, 'error');
    return { valid: false, bookId: null, isUsed: false };
  }
};

/**
 * Mark a verification code as used
 * @param code Verification code to mark
 * @param userId ID of the user who used the code
 * @returns Success status
 */
export const markVerificationCodeAsUsed = async (code: string, userId: string) => {
  try {
    appLog('VerificationService', 'Marking verification code as used', 'info');
    const supabase = await getSupabaseClient();
    
    const { error } = await supabase
      .from('verification_codes')
      .update({
        is_used: true,
        used_by: userId
      })
      .eq('code', code);
    
    if (error) {
      appLog('VerificationService', `Error marking verification code as used: ${error.message}`, 'error');
      return false;
    }
    
    appLog('VerificationService', 'Verification code marked as used', 'success');
    return true;
  } catch (error: any) {
    appLog('VerificationService', `Error marking verification code as used: ${error.message}`, 'error');
    return false;
  }
};

/**
 * Generate multiple verification codes at once
 * @param bookId ID of the book
 * @param count Number of codes to generate
 * @returns Array of generated codes
 */
export const generateBulkVerificationCodes = async (
  bookId: string | BookId,
  count: number
): Promise<string[]> => {
  try {
    appLog('VerificationService', `Generating ${count} verification codes`, 'info');
    const supabase = await getSupabaseClient();
    
    const codes: string[] = [];
    const codeEntries = [];
    
    // Generate codes
    for (let i = 0; i < count; i++) {
      const code = generateRandomCode(8);
      codes.push(code);
      codeEntries.push({
        code,
        book_id: bookId.toString(),
        is_used: false
      });
    }
    
    // Insert into database
    const { error } = await supabase
      .from('verification_codes')
      .insert(codeEntries);
    
    if (error) {
      appLog('VerificationService', `Error generating bulk verification codes: ${error.message}`, 'error');
      return [];
    }
    
    appLog('VerificationService', `Generated ${codes.length} verification codes`, 'success');
    return codes;
  } catch (error: any) {
    appLog('VerificationService', `Error generating bulk verification codes: ${error.message}`, 'error');
    return [];
  }
};
