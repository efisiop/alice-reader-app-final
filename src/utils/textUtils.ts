// Text processing utilities for the Alice Reader app

/**
 * Clean text from encoding issues and replacement characters
 */
export const cleanText = (text: string): string => {
  if (!text) return '';
  
  return text
    // Remove Unicode replacement characters (�)
    .replace(/\uFFFD/g, '')
    // Remove null characters
    .replace(/\0/g, '')
    // Fix smart quotes that might be corrupted
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    // Fix more problematic apostrophes and quotes that appear as squares
    .replace(/\u2018/g, "'")  // Left single quotation mark
    .replace(/\u2019/g, "'")  // Right single quotation mark (common apostrophe)
    .replace(/\u201A/g, "'")  // Single low-9 quotation mark
    .replace(/\u201C/g, '"')  // Left double quotation mark
    .replace(/\u201D/g, '"')  // Right double quotation mark
    .replace(/\u201E/g, '"')  // Double low-9 quotation mark
    .replace(/\u2032/g, "'")  // Prime (sometimes used as apostrophe)
    .replace(/\u2033/g, '"')  // Double prime
    // Fix em dashes that might be corrupted
    .replace(/\u2014/g, '—')  // Em dash
    .replace(/\u2013/g, '–')  // En dash
    // Fix other problematic characters
    .replace(/\u2026/g, '...')  // Horizontal ellipsis
    .replace(/\u00A0/g, ' ')   // Non-breaking space
    .replace(/\u2010/g, '-')   // Hyphen
    .replace(/\u2011/g, '-')   // Non-breaking hyphen
    // Remove any other problematic control characters and high-value unicode that might display as squares
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[\u0080-\u009F]/g, '')  // Remove C1 control characters
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Fix common text encoding issues specifically for Alice in Wonderland
 */
export const fixAliceText = (text: string): string => {
  if (!text) return '';
  
  let cleanedText = cleanText(text);
  
  // Fix specific Alice in Wonderland text issues
  cleanedText = cleanedText
    // Fix "DRINK ME" and "EAT ME" text that might have encoding issues
    .replace(/D\s*R\s*I\s*N\s*K\s*\s*M\s*E/gi, 'DRINK ME')
    .replace(/E\s*A\s*T\s*\s*M\s*E/gi, 'EAT ME')
    // Fix quotation marks around speech
    .replace(/\s*(['""])\s*/g, ' $1')
    // Fix common Carroll punctuation
    .replace(/\s*!\s*/g, '!')
    .replace(/\s*\?\s*/g, '?')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*\.\s*/g, '. ')
    .replace(/\s*;\s*/g, '; ')
    .replace(/\s*:\s*/g, ': ')
    // Fix spacing around parentheses
    .replace(/\s*\(\s*/g, ' (')
    .replace(/\s*\)\s*/g, ') ')
    // Clean up multiple spaces
    .replace(/\s{2,}/g, ' ')
    .trim();
  
  return cleanedText;
};

/**
 * Validate that text doesn't contain problematic characters
 */
export const validateText = (text: string): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  if (!text) {
    return { isValid: true, issues: [] };
  }
  
  // Check for replacement characters
  if (text.includes('\uFFFD')) {
    issues.push('Contains Unicode replacement characters (squares)');
  }
  
  // Check for null characters
  if (text.includes('\0')) {
    issues.push('Contains null characters');
  }
  
  // Check for other control characters
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(text)) {
    issues.push('Contains control characters');
  }
  
  // Check for C1 control characters that might appear as squares
  if (/[\u0080-\u009F]/.test(text)) {
    issues.push('Contains C1 control characters');
  }
  
  // Check for problematic Unicode quotes/punctuation
  if (/[\u2018\u2019\u201A\u201C\u201D\u201E\u2032\u2033]/.test(text)) {
    issues.push('Contains problematic Unicode quotes/apostrophes');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

/**
 * Debug function to show character codes for problematic text
 */
export const debugText = (text: string, maxLength: number = 100): string => {
  if (!text) return 'Empty text';
  
  const sample = text.substring(0, maxLength);
  const charCodes = sample.split('').map((char, index) => {
    const code = char.charCodeAt(0);
    if (code > 127 || code < 32) {
      return `[${index}:${char}(${code})]`;
    }
    return char;
  }).join('');
  
  return charCodes;
}; 