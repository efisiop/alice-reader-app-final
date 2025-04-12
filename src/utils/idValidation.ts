// src/utils/idValidation.ts
import { appLog } from '../components/LogViewer';
import { 
  isUuid, 
  UserId, 
  BookId, 
  ChapterId, 
  SectionId, 
  ProfileId,
  EntityId
} from '../types/idTypes';
import { isValidBookId } from './bookIdUtils';

/**
 * Validates a UUID string
 * @param id The ID to validate
 * @param entityType Optional entity type for logging
 * @returns True if the ID is a valid UUID, false otherwise
 */
export function validateUuid(id: string, entityType?: string): boolean {
  const valid = isUuid(id);
  if (!valid && entityType) {
    appLog('IdValidation', `Invalid ${entityType} UUID: ${id}`, 'warning');
  }
  return valid;
}

/**
 * Validates a user ID
 * @param userId The user ID to validate
 * @returns True if the ID is valid, false otherwise
 */
export function validateUserId(userId: string | UserId): boolean {
  return validateUuid(userId.toString(), 'user');
}

/**
 * Validates a book ID (can be UUID or string ID)
 * @param bookId The book ID to validate
 * @returns True if the ID is valid, false otherwise
 */
export function validateBookId(bookId: string | BookId): boolean {
  const idStr = bookId.toString();
  const valid = isValidBookId(idStr);
  if (!valid) {
    appLog('IdValidation', `Invalid book ID: ${idStr}`, 'warning');
  }
  return valid;
}

/**
 * Validates a chapter ID
 * @param chapterId The chapter ID to validate
 * @returns True if the ID is valid, false otherwise
 */
export function validateChapterId(chapterId: string | ChapterId): boolean {
  return validateUuid(chapterId.toString(), 'chapter');
}

/**
 * Validates a section ID
 * @param sectionId The section ID to validate
 * @returns True if the ID is valid, false otherwise
 */
export function validateSectionId(sectionId: string | SectionId): boolean {
  return validateUuid(sectionId.toString(), 'section');
}

/**
 * Validates a profile ID
 * @param profileId The profile ID to validate
 * @returns True if the ID is valid, false otherwise
 */
export function validateProfileId(profileId: string | ProfileId): boolean {
  return validateUuid(profileId.toString(), 'profile');
}

/**
 * Generic ID validation function
 * @param id The ID to validate
 * @param entityType The entity type for logging
 * @returns True if the ID is valid, false otherwise
 */
export function validateId(id: string | EntityId, entityType: string): boolean {
  // Special case for book IDs
  if (entityType === 'book') {
    return validateBookId(id.toString());
  }
  
  return validateUuid(id.toString(), entityType);
}

/**
 * Ensures an ID is a valid UUID, throwing an error if not
 * @param id The ID to validate
 * @param entityType The entity type for error messages
 * @returns The original ID if valid
 * @throws Error if the ID is invalid
 */
export function ensureValidId(id: string, entityType: string): string {
  if (!validateId(id, entityType)) {
    throw new Error(`Invalid ${entityType} ID: ${id}`);
  }
  return id;
}
