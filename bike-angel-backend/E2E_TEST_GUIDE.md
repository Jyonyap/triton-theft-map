# End-to-End Testing Guide

## Overview

This document describes the end-to-end (E2E) testing strategy for the Bike Angel application. E2E tests validate complete user workflows across the entire application stack.

## Test Coverage

### 1. Complete User Registration Flow
- User registration with UCSD email
- Email verification process
- Login after verification
- Access to protected endpoints

### 2. Parking Report Submission Flow
- Viewing available parking zones
- Checking zone details before parking
- Taking photo and submitting report
- Congestion level updates
- Report visibility to other users

### 3. Theft Incident Reporting Flow
- Accessing theft report form
- Submitting unverified incident
- Submitting verified incident with police report
- Risk rating updates
- Incident visibility in zone details

### 4. Map Navigation and Zone Details Flow
- Loading map with all zones
- Clicking zone markers
- Viewing parking photos
- Viewing theft history
- Adding zones to favorites
- Navigating between zones

### 5. Cross-Browser and Device Compatibility
- CORS configuration
- Mobile image uploads
- JSON response formatting
- Concurrent request handling

### 6. Error Handling
- Invalid credentials
- Unauthorized access
- Invalid zone IDs
- Missing required fields

## Running E2E Tests

### Prerequisites

1. **Backend server must be running:**
   ```bash
   cd bike-angel-backend
   npm start
   ```

2. **Database must be initialized with seed data:**
   ```bash
   npm run db:reset
   npm run db:seed
   ```

3. **Environment variables must be configured:**
   - Check `.env` file has all required variables
   - Ensure storage service is configured

### Running Tests

```bash
cd bike-angel-backend
npm test -- e2e.test.js
```

### Expected Output

The tests will output detailed progress information:

```
✓ User registered successfully, verification email sent
✓ Login blocked for unverified email
✓ Email verified successfully
✓ User logged in successfully, JWT token received
✓ Protected endpoint accessible with valid token
✓ Fetched 10 parking zones
✓ Zone details loaded
✓ Parking report submitted successfully
✓ Congestion level updated: filling
✓ Report visible in zone (3 total reports)
...
```

## Test Architecture

### Test Structure

```
bike-angel-backend/src/__tests__/
├── e2e.test.js              # Main E2E test suite
├── api.integration.test.js  # API integration tests
└── ...
```

### Test Flow

1. **Setup**: Create test user, authenticate
2. **Execute**: Run complete user workflows
3. **Verify**: Check API responses and database state
4. **Cleanup**: Remove test data

### Helper Functions

- `createTestImage()`: Generates test image buffers
- `manuallyVerifyEmail()`: Simulates email verification
- `wait()`: Delays for async operations

## Testing on Multiple Devices/Browsers

### Desktop Browsers
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Mobile Devices
- iOS Safari
- Android Chrome
- Mobile responsive views

### Testing Approach

Since this is a web application, the E2E tests focus on:
1. **API compatibility**: Ensuring endpoints work across all clients
2. **Response formats**: JSON responses parse correctly
3. **CORS configuration**: Cross-origin requests succeed
4. **Image handling**: Various image sizes/formats work
5. **Concurrent access**: Multiple users can access simultaneously

### Manual Testing Checklist

For comprehensive device/browser testing, manually verify:

#### Desktop (Chrome, Firefox, Safari, Edge)
- [ ] User can register and login
- [ ] Map loads and displays zones correctly
- [ ] Camera/file upload works
- [ ] Photos display in zone details
- [ ] Theft reports submit successfully
- [ ] Navigation between pages works
- [ ] Responsive design adapts to window size

#### Mobile (iOS Safari, Android Chrome)
- [ ] Touch interactions work smoothly
- [ ] Native camera opens for photo capture
- [ ] GPS location displays on map
- [ ] Pinch-to-zoom works on map
- [ ] Forms are easy to fill on small screens
- [ ] Buttons are large enough to tap
- [ ] PWA can be installed to home screen
- [ ] Offline mode works (cached data)

## Continuous Integration

### GitHub Actions Workflow (Recommended)

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd bike-angel-backend
          npm install
      
      - name: Setup database
        run: |
          cd bike-angel-backend
          npm run db:reset
          npm run db:seed
      
      - name: Start server
        run: |
          cd bike-angel-backend
          npm start &
          sleep 5
      
      - name: Run E2E tests
        run: |
          cd bike-angel-backend
          npm test -- e2e.test.js
```

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "Connection refused"
- **Solution**: Ensure backend server is running on port 3000

**Issue**: Tests fail with database errors
- **Solution**: Run `npm run db:reset` and `npm run db:seed`

**Issue**: Photo upload tests fail
- **Solution**: Check storage service configuration in `.env`

**Issue**: Tests timeout
- **Solution**: Increase Jest timeout in test file or jest.config.js

### Debug Mode

Run tests with verbose output:
```bash
npm test -- e2e.test.js --verbose
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data in `afterAll`
3. **Realistic Data**: Use realistic test data (valid emails, descriptions)
4. **Error Cases**: Test both success and failure scenarios
5. **Performance**: Keep tests fast (< 30 seconds total)

## Future Enhancements

- [ ] Add Playwright for true browser automation
- [ ] Add visual regression testing
- [ ] Add performance benchmarks
- [ ] Add accessibility testing
- [ ] Add load testing for concurrent users
- [ ] Add mobile device emulation tests

## Related Documentation

- [API Integration Tests](./src/__tests__/api.integration.test.js)
- [Frontend Component Tests](../bike-angel-frontend/src/test/)
- [Database Setup](./DATABASE_SETUP.md)
- [Authentication Setup](./AUTHENTICATION_SETUP.md)
