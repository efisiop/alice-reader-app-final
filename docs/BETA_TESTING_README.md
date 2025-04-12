# Alice Reader Beta Testing Guide

Welcome to the Alice Reader beta testing program! This guide will help you get started with testing the application and provide instructions for reporting issues and feedback.

## Getting Started

### Setting Up the Test Environment

1. Clone the repository:
   ```bash
   git clone https://github.com/efisiop/alice-reader-app.git
   cd alice-reader-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the test environment:
   ```bash
   npm run setup:test
   ```

4. Start the application in test mode:
   ```bash
   npm run beta:start
   ```

### Test Accounts

For testing, you can use the following accounts:

**Readers:**
- Email: leo@example.com, Password: Password123!
- Email: sarah@example.com, Password: Password123!
- Email: michael@example.com, Password: Password123!
- Email: emma@example.com, Password: Password123!
- Email: robert@example.com, Password: Password123!

**Consultants:**
- Email: jennifer@publisher.com, Password: Password123!
- Email: david@publisher.com, Password: Password123!

### Test Verification Codes

You can use the following verification codes to activate the book:
- ALICE123
- WONDERLAND
- RABBIT
- TEAPARTY
- CHESHIRE

## Testing Process

### 1. Follow the Test Checklists

We've prepared detailed checklists to guide your testing:

- [Reader Journey Checklist](./test-checklists/reader-journey-checklist.md)
- [Consultant Journey Checklist](./test-checklists/consultant-journey-checklist.md)
- [Cross-Browser and Device Checklist](./test-checklists/cross-browser-device-checklist.md)
- [Performance and Accessibility Checklist](./test-checklists/performance-accessibility-checklist.md)

### 2. Test User Personas

When testing, try to embody the characteristics of these personas to ensure we're meeting diverse user needs:

**Leo (10)**: Young reader who needs help with vocabulary
**Sarah (21)**: University student studying literature
**Michael (35)**: Busy professional reading in short bursts
**Emma (14)**: Middle school student with reading difficulties
**Robert (67)**: Retired teacher with vision impairment

**Jennifer**: Experienced editor who monitors reader engagement
**David**: Former teacher who helps with reading comprehension

### 3. Generate Test Data

If you need more test data, you can generate it using:

```bash
npm run test:generate-data
```

This will create reading progress, statistics, AI interactions, help requests, feedback, and consultant triggers for the test accounts.

### 4. Reset Test Data

If you want to start fresh, you can reset the test data:

```bash
npm run test:reset
```

## Reporting Issues

When you find an issue, please report it with the following information:

1. **Issue Title**: A brief, descriptive title
2. **Environment**: Browser, device, screen size
3. **Steps to Reproduce**: Detailed steps to reproduce the issue
4. **Expected Behavior**: What you expected to happen
5. **Actual Behavior**: What actually happened
6. **Screenshots/Videos**: If applicable
7. **Severity**: Critical, High, Medium, Low
8. **User Persona**: Which persona you were testing as

## Providing Feedback

In addition to reporting issues, we welcome general feedback on the application. Please consider:

1. **Usability**: How intuitive is the interface?
2. **Performance**: Does the application feel responsive?
3. **Features**: Are there features missing that would be valuable?
4. **Content**: Is the content clear and helpful?
5. **Accessibility**: Are there any accessibility concerns?

## Testing Schedule

The beta testing period will run from [Start Date] to [End Date]. We'll have focused testing sessions on:

- Week 1: Reader Journey
- Week 2: Consultant Journey
- Week 3: Cross-Browser and Device Testing
- Week 4: Performance and Accessibility

## Contact

If you have any questions or need assistance, please contact:

- [Contact Name] - [Contact Email]

Thank you for helping us improve the Alice Reader application!
