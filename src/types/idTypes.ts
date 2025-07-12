// src/types/idTypes.ts
import { appLog } from '../components/LogViewer';

/**
 * Type definitions for entity IDs
 * 
 * Using branded types to ensure type safety when working with different ID types
 */

// Base ID type for all entity IDs
export type EntityId = string & { readonly _brand: unique symbol };

// Specific ID types for different entities
export type UserId = EntityId & { readonly _type: 'user' };
export type BookId = EntityId & { readonly _type: 'book' };
export type ChapterId = EntityId & { readonly _type: 'chapter' };
export type SectionId = EntityId & { readonly _type: 'section' };
export type ProfileId = EntityId & { readonly _type: 'profile' };
export type DictionaryId = EntityId & { readonly _type: 'dictionary' };
export type ReadingProgressId = EntityId & { readonly _type: 'reading_progress' };
export type ReadingStatsId = EntityId & { readonly _type: 'reading_stats' };
export type HelpRequestId = EntityId & { readonly _type: 'help_request' };
export type FeedbackId = EntityId & { readonly _type: 'feedback' };
export type ConsultantTriggerId = EntityId & { readonly _type: 'consultant_trigger' };
export type ConsultantActionId = EntityId & { readonly _type: 'consultant_action' };

// Type guards
export function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// Type conversion functions
export function asUserId(id: string): UserId {
  return id as UserId;
}

export function asBookId(id: string): BookId {
  return id as BookId;
}

export function asChapterId(id: string): ChapterId {
  return id as ChapterId;
}

export function asSectionId(id: string): SectionId {
  return id as SectionId;
}

export function asProfileId(id: string): ProfileId {
  return id as ProfileId;
}

export function asDictionaryId(id: string): DictionaryId {
  return id as DictionaryId;
}

export function asReadingProgressId(id: string): ReadingProgressId {
  return id as ReadingProgressId;
}

export function asReadingStatsId(id: string): ReadingStatsId {
  return id as ReadingStatsId;
}

export function asHelpRequestId(id: string): HelpRequestId {
  return id as HelpRequestId;
}

export function asFeedbackId(id: string): FeedbackId {
  return id as FeedbackId;
}

export function asConsultantTriggerId(id: string): ConsultantTriggerId {
  return id as ConsultantTriggerId;
}

export function asConsultantActionId(id: string): ConsultantActionId {
  return id as ConsultantActionId;
}

// Map of string IDs to UUIDs for known books
const BOOK_ID_MAP: Record<string, string> = {
  'alice-in-wonderland': '550e8400-e29b-41d4-a716-446655440000',
  // Add more mappings as needed
};

/**
 * Converts a string book ID to a UUID format
 * @param bookId String ID of the book
 * @returns UUID string as BookId type
 */
export function getBookUuid(bookId: string): BookId {
  // If it already looks like a UUID, return it as is
  if (isUuid(bookId)) {
    return asBookId(bookId);
  }
  
  // Check if we have a mapping for this string ID
  const uuid = BOOK_ID_MAP[bookId];
  
  if (uuid) {
    appLog('IdTypes', `Converted string ID "${bookId}" to UUID "${uuid}"`, 'debug');
    return asBookId(uuid);
  }
  
  // If no mapping exists, log a warning and return the original ID
  appLog('IdTypes', `No UUID mapping found for book ID "${bookId}"`, 'warning');
  return asBookId(bookId);
}

/**
 * Gets the string ID for a book UUID
 * @param uuid UUID of the book
 * @returns String ID or the original UUID if no mapping exists
 */
export function getBookStringId(uuid: string): string {
  // Check if this UUID is in our mapping
  for (const [stringId, bookUuid] of Object.entries(BOOK_ID_MAP)) {
    if (bookUuid === uuid) {
      appLog('IdTypes', `Converted UUID "${uuid}" to string ID "${stringId}"`, 'debug');
      return stringId;
    }
  }
  
  // If no mapping exists, log a warning and return the original UUID
  appLog('IdTypes', `No string ID mapping found for UUID "${uuid}"`, 'warning');
  return uuid;
}

/**
 * Validates a UUID string
 * @param id The ID to validate
 * @returns True if the ID is a valid UUID, false otherwise
 */
export function validateUuid(id: string): boolean {
  return isUuid(id);
}

/**
 * Generates a new UUID v4
 * @returns A new UUID v4 string
 */
export function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Constants for commonly used book IDs
export const ALICE_BOOK_ID_STRING = 'alice-in-wonderland';
export const ALICE_BOOK_ID_UUID = asBookId('550e8400-e29b-41d4-a716-446655440000');
