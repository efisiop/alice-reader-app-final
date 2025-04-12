# Test Case - Login Functionality

**Test ID:** TC-002  
**Test Name:** Standard User Login  
**Feature:** Authentication - Login  
**Phase:** Phase 1 - Core Functionality  
**Priority:** High  

## Objective
Verify that registered users can successfully log in to the application.

## Preconditions
- Test environment is set up and running
- Test user account exists in the system
- User is not currently logged in

## Test Data
- **Email:** leo@example.com
- **Password:** Password123!
- **Alternative Test Account:** sarah@example.com / Password123!

## Test Steps
1. Navigate to the application's home page
   - **Expected:** Home page loads successfully
   - **Actual:** 
   - **Pass/Fail:** 
   - **Notes:** 

2. Click on "Login" or "Sign In" button
   - **Expected:** Login form is displayed
   - **Actual:** 
   - **Pass/Fail:** 
   - **Notes:** 

3. Enter test email address in the email field
   - **Expected:** Email is accepted with no validation errors
   - **Actual:** 
   - **Pass/Fail:** 
   - **Notes:** 

4. Enter test password in the password field
   - **Expected:** Password field accepts input and masks characters
   - **Actual:** 
   - **Pass/Fail:** 
   - **Notes:** 

5. Check "Remember me" checkbox (if available)
   - **Expected:** Checkbox state changes to checked
   - **Actual:** 
   - **Pass/Fail:** 
   - **Notes:** 

6. Submit the login form
   - **Expected:** Form submits successfully, user is logged in and redirected to dashboard
   - **Actual:** 
   - **Pass/Fail:** 
   - **Notes:** 

7. Verify user-specific content is displayed
   - **Expected:** User's name or email is displayed in header/profile area
   - **Actual:** 
   - **Pass/Fail:** 
   - **Notes:** 

8. Log out of the application
   - **Expected:** User is logged out and returned to login page
   - **Actual:** 
   - **Pass/Fail:** 
   - **Notes:** 

9. Close browser and reopen application (with "Remember me" checked)
   - **Expected:** User session is remembered and login is automatic or facilitated
   - **Actual:** 
   - **Pass/Fail:** 
   - **Notes:** 

## Edge Cases to Test
- Login with incorrect password
- Login with non-existent email
- Login with correct email but wrong case (e.g., LEO@example.com)
- Login with empty fields
- Login after session timeout
- Multiple failed login attempts (security lockout)

## Performance Metrics to Capture
- Time to load login page
- Time to process login and redirect to dashboard
- Session token persistence

## Test Environment
- **Browser:** Chrome (latest), Firefox (latest)
- **Device:** Desktop, Mobile
- **Screen Size:** 1920x1080, 375x667
- **Network:** Standard broadband connection

## Test Results Summary
**Overall Result:**   
**Issues Found:**   
**Tested By:**   
**Test Date:**   
**Notes:**
