# API Integration Tests

## Overview

Comprehensive integration tests for the Bike Angel API covering all major endpoints and workflows.

## Test Coverage

### Authentication Flow (7 tests)
- ✅ User registration with valid UCSD email
- ✅ Rejection of non-UCSD email registration
- ✅ Rejection of duplicate email registration
- ✅ Rejection of login with unverified email
- ✅ Successful login after email verification
- ✅ Rejection of login with incorrect password
- ✅ Rejection of login with non-existent email

### Zone Data Retrieval (5 tests)
- ✅ Fetch all parking zones
- ✅ Fetch specific zone by ID
- ✅ Return 404 for non-existent zone
- ✅ Allow authenticated user to suggest new zone
- ✅ Reject zone suggestion without authentication

### Parking Report Submission (5 tests)
- ✅ Create parking report with photo
- ✅ Reject parking report without authentication
- ✅ Reject parking report without photo
- ✅ Reject parking report with invalid zone
- ✅ Fetch parking reports for zone

### Theft Incident Reporting (7 tests)
- ✅ Create unverified theft incident
- ✅ Create verified theft incident with police report
- ✅ Reject theft incident without authentication
- ✅ Reject theft incident without required fields (zoneId, dateTime, description)
- ✅ Reject theft incident with invalid zone
- ✅ Fetch theft incidents for zone
- ✅ Verify zone risk rating updates after theft incident

## Running the Tests

```bash
# Run all integration tests
npm test -- --testPathPattern=api.integration.test.js

# Run with detailed output
npm test -- --testPathPattern=api.integration.test.js --verbose

# Run in band (sequential) for better debugging
npm test -- --testPathPattern=api.integration.test.js --runInBand
```

## Test Structure

The integration tests are located in `src/__tests__/api.integration.test.js` and follow this structure:

1. **Setup**: Creates a test user and authenticates
2. **Test Execution**: Tests each API endpoint with valid and invalid inputs
3. **Cleanup**: Removes test data from the database

## Requirements Validated

These tests validate the following requirements from the design document:

- **Requirement 1**: User registration and authentication with UCSD email
- **Requirement 2**: Parking report submission with photo upload
- **Requirement 3**: Theft incident reporting with verification
- **Requirement 4**: Campus map zone data retrieval
- **Requirement 11**: Zone management and suggestions

## Test Configuration

The tests use:
- **Jest** as the test framework
- **node-fetch** for HTTP requests
- **FormData** for multipart file uploads
- **Sharp** for creating test images
- **PostgreSQL** for database operations

## Notes

- Tests run against a live server instance (started automatically)
- Each test run creates a unique test user to avoid conflicts
- Test data is cleaned up after all tests complete
- Tests require the database to be initialized and seeded with parking zones
