# Tests Documentation

This directory contains unit and integration tests for the Farm Scheduler application.

## Test Structure

```
tests/
├── fixtures/           # Mock data and test fixtures
│   └── mockData.js    # Mock Google Sheets data
├── integration/        # Integration tests
│   └── api.test.js    # API endpoint tests
├── unit/              # Unit tests
│   └── rowsToObjects.test.js  # Helper function tests
├── setup.js           # Test setup and configuration
└── README.md          # This file
```

## Running Tests

### Run All Tests
```bash
cd server
npm test
```

### Run Unit Tests Only
```bash
npm run test:unit
```

### Run Integration Tests Only
```bash
npm run test:integration
```

### Watch Mode (Re-run on file changes)
```bash
npm run test:watch
```

### CI Mode (For GitHub Actions)
```bash
npm run test:ci
```

## Test Coverage

After running tests, coverage reports are generated in the `coverage/` directory:

- **HTML Report**: `coverage/index.html` - Open in browser for interactive report
- **LCOV Report**: `coverage/lcov.info` - For CI tools like Codecov
- **Text Report**: Displayed in terminal after running tests

### Viewing Coverage
```bash
# Run tests with coverage
npm test

# Open HTML coverage report (macOS)
open coverage/index.html

# Open HTML coverage report (Linux)
xdg-open coverage/index.html
```

## Test Suites

### Unit Tests

**File**: `tests/unit/rowsToObjects.test.js`

Tests the `rowsToObjects` helper function that converts Google Sheets rows into JavaScript objects.

**Test Cases:**
- Convert task rows to objects
- Convert user rows to objects
- Handle empty arrays
- Handle null/undefined inputs
- Parse row indices as integers
- Handle missing values
- Skip first column (Row Index)
- Handle extra columns
- Handle special characters
- Handle whitespace

### Integration Tests

**File**: `tests/integration/api.test.js`

Tests the API endpoints with mocked Google Sheets API.

**Test Cases:**
- **GET /api/tasks**
  - Return tasks and pins successfully
  - Return 404 when no data found
  - Handle Google Sheets API errors

- **POST /api/update-status**
  - Update task status with valid PIN
  - Return 400 for missing fields
  - Return 401 for invalid PIN
  - Validate status values

- **Static File Serving**
  - Serve index.html for root path

## Mock Data

**File**: `tests/fixtures/mockData.js`

Contains mock Google Sheets data for testing:
- `mockTasksSheetData` - Sample task data with headers
- `mockUsersSheetData` - Sample user/PIN data
- `mockParsedTasks` - Expected parsed task objects
- `mockParsedPins` - Expected parsed PIN objects

## Writing New Tests

### Adding a Unit Test

1. Create a new file in `tests/unit/`:
   ```javascript
   // tests/unit/myFunction.test.js
   describe('MyFunction', () => {
     test('should do something', () => {
       expect(myFunction()).toBe(expectedResult);
     });
   });
   ```

2. Run the test:
   ```bash
   npm run test:unit
   ```

### Adding an Integration Test

1. Create a new file in `tests/integration/`:
   ```javascript
   // tests/integration/myEndpoint.test.js
   const request = require('supertest');

   describe('My Endpoint', () => {
     test('should return expected data', async () => {
       const response = await request(app)
         .get('/api/my-endpoint')
         .expect(200);

       expect(response.body).toHaveProperty('data');
     });
   });
   ```

2. Run the test:
   ```bash
   npm run test:integration
   ```

## Mocking

### Mocking Google Sheets API

The integration tests use Jest mocks to simulate the Google Sheets API:

```javascript
jest.mock('googleapis', () => {
  return {
    google: {
      auth: {
        GoogleAuth: jest.fn().mockImplementation(() => ({}))
      },
      sheets: jest.fn().mockReturnValue({
        spreadsheets: {
          values: {
            get: jest.fn(),
            update: jest.fn()
          }
        }
      })
    }
  };
});
```

### Mocking Environment Variables

Environment variables are set in `tests/setup.js`:

```javascript
process.env.SHEET_ID = 'test-sheet-id-123';
process.env.PORT = '0';
```

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Clear Assertions**: Use descriptive test names and clear expectations
3. **Mock External Dependencies**: Always mock external APIs and services
4. **Test Edge Cases**: Include tests for error conditions and edge cases
5. **Keep Tests Fast**: Use mocks to avoid slow network calls
6. **Maintain Coverage**: Aim for at least 80% code coverage
7. **Clean Up**: Use `beforeEach` and `afterEach` to reset state

## Troubleshooting

### Tests Failing Locally

1. **Clear Jest cache**:
   ```bash
   cd server
   npx jest --clearCache
   npm test
   ```

2. **Check Node version**:
   ```bash
   node --version  # Should be 18.x, 20.x, or 22.x
   ```

3. **Reinstall dependencies**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Coverage Not Generating

Ensure `jest.config.js` has correct paths:
```javascript
collectCoverageFrom: [
  'server.js',
  '!**/node_modules/**',
  '!**/tests/**'
]
```

### Mocks Not Working

1. Ensure mocks are defined before requiring the module
2. Use `jest.clearAllMocks()` in `beforeEach`
3. Check mock implementation matches the actual API

## CI/CD Integration

Tests run automatically on:
- Every push to `main` or `develop` branches
- Every pull request to `main` or `develop` branches
- Multiple Node.js versions (18.x, 20.x, 22.x)

View test results in GitHub Actions:
1. Go to repository on GitHub
2. Click "Actions" tab
3. Select the workflow run
4. View test results in the "Test and Validate" job

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/ladjs/supertest)
- [Testing Best Practices](https://testingjavascript.com/)

## Contributing

When adding new features:
1. Write tests first (TDD approach recommended)
2. Ensure all tests pass: `npm test`
3. Check coverage: Coverage should not decrease
4. Update this README if adding new test categories
