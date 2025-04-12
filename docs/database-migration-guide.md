# Alice Reader Database Migration Guide

This guide explains how to fix database schema issues in the Alice Reader application.

## Common Database Schema Issues

The Alice Reader application may encounter the following database schema issues:

1. **Missing `reading_stats` Table**: 
   ```
   relation "public.reading_stats" does not exist
   ```

2. **Missing `last_read_at` Column**:
   ```
   column reading_progress.last_read_at does not exist
   ```

3. **Book ID Type Mismatch**:
   The application needs to handle both string IDs and UUIDs for books.

## How to Fix Database Schema Issues

### Option 1: Using the Status Dashboard (Recommended)

1. Navigate to the Status Dashboard at `/status`
2. Look for the "Database Schema Status" card
3. Click the "Run Database Fixes" button
4. Wait for the migration to complete
5. The page will automatically refresh when done

### Option 2: Manual SQL Execution

If the automatic migration doesn't work, you can run the SQL manually:

1. Connect to your Supabase database using the SQL Editor
2. Copy the SQL from `src/db/migrations/schema_fixes.sql`
3. Execute the SQL in the Supabase SQL Editor

## Migration Details

The database migration performs the following changes:

1. **Adds missing columns**:
   - Adds `last_read_at` column to the `reading_progress` table

2. **Creates missing tables**:
   - Creates the `reading_stats` table if it doesn't exist

3. **Adds book ID handling**:
   - Adds `string_id` column to the `books` table
   - Updates the Alice in Wonderland book with the string ID "alice-in-wonderland"
   - Creates a function to look up books by string ID

4. **Sets up security**:
   - Enables Row Level Security (RLS) on the `reading_stats` table
   - Creates policies to ensure users can only access their own data

5. **Adds database triggers**:
   - Creates triggers to automatically update timestamps

## Verifying the Migration

After running the migration, you can verify it worked by:

1. Refreshing the Status Dashboard
2. Checking that all database tests now pass
3. Navigating to the Reader Dashboard to verify that reading progress and stats are now working

## Troubleshooting

If you encounter issues with the migration:

1. **Check the logs**: Open the browser console (F12) to see detailed error messages
2. **Try manual SQL**: Run the SQL statements one by one in the Supabase SQL Editor
3. **Check permissions**: Ensure your Supabase user has the necessary permissions
4. **Contact support**: If you continue to have issues, please contact support

## Technical Details

The migration uses the following Supabase functions:

- `run_sql`: Executes arbitrary SQL (requires appropriate permissions)
- `exec_sql`: Alternative function for statement execution

These functions need to be created in your Supabase database with appropriate permissions.
