# Alice Reader Beta Testing Guide

## Overview

This guide provides detailed instructions for conducting controlled beta testing of the Alice Reader application. The beta testing process is designed to validate key functionality, gather user feedback, and identify issues before public release.

## Beta Testing Infrastructure

The Alice Reader beta testing infrastructure includes:

1. **Beta Test Harness**: A UI overlay that provides tools for reporting bugs, submitting feedback, and viewing performance metrics.
2. **Test Scenarios**: Structured test cases that guide testers through key application workflows.
3. **Service Status Check**: A dashboard for monitoring the health of application services.
4. **Beta Test Dashboard**: A central hub for accessing all beta testing tools and information.
5. **Reporting Tools**: Scripts for generating beta testing reports and summaries.

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Git
- Access to the Alice Reader repository

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/efisiop/alice-reader-app.git
   cd alice-reader-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Prepare the beta environment:
   ```
   npm run prepare-beta
   ```

4. Start the beta application:
   ```
   npm run beta:start
   ```

## Beta Testing Process

### 1. Test Account Setup

The beta testing environment includes pre-configured test accounts:

**Reader Accounts:**
- Email: leo@test.com / Password: Test1234!
- Email: sarah@test.com / Password: Test1234!

**Consultant Accounts:**
- Email: consultant1@test.com / Password: Test1234!

### 2. Test Scenario Execution

1. Navigate to the Beta Dashboard at `/beta-dashboard`
2. Select the "Test Scenarios" tab
3. Work through each test scenario, following the step-by-step instructions
4. Mark each step as successful or failed based on the completion criteria
5. Complete all scenarios to ensure comprehensive testing

### 3. Bug Reporting

When you encounter an issue:

1. Click the menu icon in the top-left corner of the beta test harness
2. Select "Report a Bug"
3. Fill out the bug report form with:
   - Title: A clear, concise description of the issue
   - Severity: Low, Medium, High, or Critical
   - Component: The affected part of the application
   - Steps to Reproduce: Detailed steps to recreate the issue
   - Description: Additional details about the bug

### 4. Feedback Submission

To provide feedback on features or usability:

1. Click the menu icon in the top-left corner of the beta test harness
2. Select "Submit Feedback"
3. Fill out the feedback form with:
   - Feedback Type: Feature, Usability, Performance, or Suggestion
   - Rating: 1-5 scale
   - Content: Detailed feedback

### 5. Performance Monitoring

To check application performance:

1. Click the menu icon in the top-left corner of the beta test harness
2. Select "Performance Metrics"
3. Review the metrics for page load time, render time, and interaction time

## Beta Testing Schedule

The beta testing process is divided into three phases:

1. **Phase 1: Core Functionality** (Days 1-5)
   - User registration and authentication
   - Basic reading interface
   - Dictionary functionality

2. **Phase 2: Consultant Features** (Days 6-10)
   - Consultant dashboard
   - Help request management
   - Reader progress monitoring

3. **Phase 3: Edge Cases & Performance** (Days 11-15)
   - Offline functionality
   - Performance with large datasets
   - Cross-browser compatibility

## Generating Reports

To generate a summary report of beta testing activities:

```
npm run beta:report
```

This will create a markdown report in the `reports` directory with:
- Bug report summary
- Feedback summary
- Test scenario completion status
- Tester participation statistics
- Performance metrics

## Troubleshooting

If you encounter issues with the beta testing environment:

1. Check the Service Status page at `/service-status`
2. Verify that all services are properly registered and initialized
3. If services are not initializing, try restarting the application
4. For persistent issues, contact the development team

## Contact

For questions or assistance with beta testing:
- Email: beta@alicereader.app
- Discord: #alice-reader-beta
