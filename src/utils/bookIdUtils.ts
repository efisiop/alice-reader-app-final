// src/utils/bookIdUtils.ts
import { BookId } from '../types/idTypes';

// Alice in Wonderland book ID
export const ALICE_BOOK_ID = "alice-in-wonderland";
export const ALICE_BOOK_ID_STRING = "alice-in-wonderland";
export const ALICE_BOOK_ID_UUID = "alice-in-wonderland-uuid";

/**
 * Function to get book UUID
 * @param bookId Book ID
 * @returns Book UUID
 */
export function getBookUuid(bookId: string): string {
  // In a real implementation, this would map the friendly ID to a UUID
  // For now, we'll just return the ID as is
  return bookId;
}

/**
 * Check if a book ID is valid
 * @param bookId Book ID to check
 * @returns True if valid
 */
export function isValidBookId(bookId: string | BookId): boolean {
  // In a real implementation, this would validate against a list of known book IDs
  // For now, we'll just check if it's a non-empty string
  return typeof bookId === 'string' && bookId.trim().length > 0;
}
