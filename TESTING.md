# Alice Reader Testing Guide

This document provides instructions for testing the Supabase integration in the Alice Reader application.

## Prerequisites

1. **Environment Setup**
   - Create a `.env.local` file in the project root with the following variables:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

2. **Database Setup**
   - Run the SQL script in `scripts/setup_test_data.sql` in your Supabase SQL editor to create test data.

## Testing Procedure

### 1. Authentication Testing

#### User Registration
1. Navigate to `/register`
2. Fill in the registration form with:
   - First Name: Test
   - Last Name: User
   - Email: test@example.com
   - Password: password123
3. Submit the form
4. Verify you are redirected to the verification page

#### User Login
1. Navigate to `/login`
2. Enter the credentials:
   - Email: test@example.com
   - Password: password123
3. Submit the form
4. Verify you are redirected to the verification page (if not verified) or reader dashboard (if verified)

### 2. Book Verification Testing

1. Navigate to `/verify`
2. Enter one of the test verification codes:
   - ALICE123
   - WONDERLAND
   - RABBIT
   - TEAPARTY
   - CHESHIRE
3. Fill in the required profile information
4. Submit the form
5. Verify you are redirected to the reader dashboard
6. Check the Supabase dashboard to confirm the code is marked as used

### 3. Reader Dashboard Testing

1. Navigate to `/reader`
2. Verify the book information is displayed
3. Check that reading progress is shown (if you've started reading)
4. Click on "Continue Reading" and verify it takes you to the correct section

### 4. Reader Interface Testing

#### Navigation
1. Navigate to `/reader/interface`
2. Test page navigation by entering a page number
3. Test section navigation using the "Previous Section" and "Next Section" buttons
4. Verify that reading progress is saved when navigating between sections

#### Text Interaction
1. Highlight text and verify the selection is captured
2. Click on words to test definition lookups
3. Verify definitions are displayed in the popup

#### AI Assistant
1. Open the AI assistant drawer
2. Ask a question about the book
3. Verify a response is generated
4. Try asking a question with text selected for context
5. Verify the response references the selected text

### 5. Debugging

If you encounter issues, you can use the debugging helpers in the browser console:

```javascript
// Test database connection
window._debug.db();

// Check authentication state
window._debug.auth();

// Access Supabase client directly
window._debug.supabase;
```

## Fallback Mechanism

The application includes fallback mechanisms to local data if Supabase is not available. This allows for development and testing without a complete Supabase setup.

## Common Issues and Solutions

### Authentication Issues
- Check that your Supabase URL and anon key are correct
- Verify that email confirmation is disabled for testing
- Check browser console for specific error messages

### Database Access Issues
- Verify that RLS policies are correctly applied
- Check that the test data has been properly inserted
- Ensure the user has the correct permissions

### Content Loading Issues
- If book content doesn't load from Supabase, the app will fall back to local data
- Check the browser console for specific error messages
- Verify the structure of your test data matches the expected format
