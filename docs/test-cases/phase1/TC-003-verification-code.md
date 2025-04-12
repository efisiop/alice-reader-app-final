# Test Case - Book Verification

**Test ID:** TC-003  
**Test Name:** Book Verification Code Entry  
**Feature:** Onboarding - Book Verification  
**Phase:** Phase 1 - Core Functionality  
**Priority:** High  

## Objective
Verify that users can successfully activate a book using a verification code.

## Preconditions
- Test environment is set up and running
- User is registered and logged in
- Test verification codes are available in the system
- User has not yet verified a book

## Test Data
- **Test User:** leo@example.com / Password123!
- **Valid Verification Codes:** ALICE123, WONDERLAND, RABBIT
- **Invalid Verification Code:** INVALID123

## Test Steps
1. Log in with test user credentials
   - **Expected:** User is logged in successfully and directed to dashboard
   - **Actual:** 
   - **Pass/Fail:** 
   - **Notes:** 

2. Navigate to book verification page (if not automatically redirected)
   - **Expected:** Verification code entry form is displayed
   - **Actual:** 
   - **Pass/Fail:** 
   - **Notes:** 

3. Enter valid verification code (ALICE123)
   - **Expected:** Code is accepted with no validation errors
   - **Actual:** 
   - **Pass/Fail:** 
   - **Notes:** 

4. Submit the verification form
   - **Expected:** Code is verified successfully, user receives confirmation
   - **Actual:** 
   - **Pass/Fail:** 
   - **Notes:** 

5. Verify user is granted access to the book
   - **Expected:** User is redirected to reader dashboard or book content
   - **Actual:** 
   - **Pass/Fail:** 
   - **Notes:** 

6. Log out and log back in
   - **Expected:** User still has access to the verified book
   - **Actual:** 
   - **Pass/Fail:** 
   - **Notes:** 

7. Try to use the same verification code again (with another test account)
   - **Expected:** System indicates the code has already been used
   - **Actual:** 
   - **Pass/Fail:** 
   - **Notes:** 

8. Try to enter an invalid verification code
   - **Expected:** System displays appropriate error message
   - **Actual:** 
   - **Pass/Fail:** 
   - **Notes:** 

## Edge Cases to Test
- Verification with expired code (if applicable)
- Verification with code in different case (e.g., alice123)
- Verification with code containing extra spaces
- Verification with empty code
- Verification when user already has verified a book
- Verification with QR code scanning (if implemented)

## Performance Metrics to Capture
- Time to validate verification code
- Time to grant access to book content

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
