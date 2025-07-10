# TCC-UFU Integration Tests

This directory contains comprehensive integration tests for the TCC-UFU Customer API using Playwright for API testing.

## Overview

The integration tests cover all API endpoints and include:
- ✅ **POST /customers** - Create customer functionality
- ✅ **GET /customers** - List all customers functionality  
- ✅ **GET /customers/:id** - Get customer by ID functionality
- ✅ **PUT /customers/:id** - Update customer functionality
- ✅ **DELETE /customers/:id** - Delete customer functionality
- ✅ **End-to-end workflows** - Complete customer lifecycle testing
- ✅ **Error handling** - Invalid data and edge case testing
- ✅ **Concurrent operations** - Stress testing and race condition detection

## Prerequisites

1. **Node.js** (v16 or higher)
2. **Backend API** running on `http://localhost:8080`
3. **DynamoDB Local** running on `http://localhost:8000` (recommended)

## Important: Backend Management

**The integration tests do NOT manage the backend services.** You must start the backend API and DynamoDB before running the tests.

### Starting Backend Services

```bash
# In the backend directory
cd ../backend

# Start DynamoDB Local
make run-docker

# Start the API server (in another terminal)
make run
```

### Verifying Services

The integration tests will automatically check if the backend is available before running tests.

## Setup

```bash
# Navigate to integration_test directory
cd integration_test

# Complete setup (install dependencies + browsers)
make setup

# Or step by step:
make install            # Install Node.js dependencies
make install-browsers   # Install Playwright browsers
```

## Running Tests

### Basic Test Execution
```bash
# Check if backend is running and run all tests
make test

# Run tests with verbose output
make test-verbose

# Run tests in headed mode (with browser UI)
make test-headed

# Run tests in debug mode
make test-debug

# Run tests with Playwright UI
make test-ui
```

### Alternative: Using npm directly
```bash
# Run all tests (backend must be running)
npm test

# Run tests in headed mode
npm run test:headed

# Run tests in debug mode
npm run test:debug

# Run tests with UI mode
npm run test:ui
```

### Specific Test Files
```bash
# Using Makefile
make test-file FILE=create-customer.test.js
make test-grep PATTERN="should create"

# Using npm/npx directly
npx playwright test create-customer.test.js
npx playwright test --grep "POST /customers"
npx playwright test --grep "should create"
```

### Test Reports
```bash
# Using Makefile
make report          # Generate and show HTML report
make show-report     # Show last report

# Using npm directly
npm run test:report
npx playwright show-report
```

## Test Structure

### Test Files
- **`create-customer.test.js`** - Tests for POST /customers endpoint
- **`get-customers.test.js`** - Tests for GET /customers endpoint  
- **`get-customer-by-id.test.js`** - Tests for GET /customers/:id endpoint
- **`update-customer.test.js`** - Tests for PUT /customers/:id endpoint
- **`delete-customer.test.js`** - Tests for DELETE /customers/:id endpoint
- **`api-e2e.test.js`** - End-to-end workflow tests

### Utilities
- **`utils/test-helpers.js`** - Shared test utilities and helper functions
- **`global-setup.js`** - Global test setup and API health checks
- **`global-teardown.js`** - Global test cleanup

## Test Coverage

### Create Customer (POST /customers)
- ✅ Valid customer creation
- ✅ UUID generation validation
- ✅ Missing required fields rejection
- ✅ Empty field validation
- ✅ Invalid email format rejection
- ✅ Malformed JSON handling
- ✅ Special characters support
- ✅ Long name handling
- ✅ Email plus addressing
- ✅ Concurrent creation testing

### Get All Customers (GET /customers)
- ✅ Empty list handling
- ✅ Multiple customers listing
- ✅ Correct data structure validation
- ✅ Large dataset handling
- ✅ Consistency across requests
- ✅ Concurrent request handling
- ✅ CORS headers validation
- ✅ Content-Type validation

### Get Customer by ID (GET /customers/:id)
- ✅ Valid ID retrieval
- ✅ Non-existent ID handling (404)
- ✅ Invalid UUID format handling
- ✅ Special characters in data
- ✅ Concurrent request testing
- ✅ Data consistency validation
- ✅ CORS headers validation

### Update Customer (PUT /customers/:id)
- ✅ Valid data updates
- ✅ Non-existent customer handling
- ✅ Required field validation
- ✅ Invalid data rejection
- ✅ Special characters handling
- ✅ ID preservation
- ✅ Update persistence verification
- ✅ Concurrent updates
- ✅ Multiple sequential updates

### Delete Customer (DELETE /customers/:id)
- ✅ Valid customer deletion
- ✅ Non-existent customer handling
- ✅ Deletion verification
- ✅ Double deletion prevention
- ✅ Invalid UUID handling
- ✅ Concurrent deletions
- ✅ List removal verification
- ✅ Complete workflow testing

### End-to-End Scenarios
- ✅ Complete customer lifecycle (CRUD)
- ✅ Multiple customers management
- ✅ Error handling workflows
- ✅ Concurrent operations stress testing
- ✅ Data persistence validation
- ✅ API health monitoring

## Configuration

### Playwright Configuration (`playwright.config.js`)
- **Base URL**: `http://localhost:8080`
- **Test Timeout**: 30 seconds
- **Workers**: 1 (sequential execution for API tests)
- **Retries**: 2 on CI, 0 locally
- **Reports**: HTML, JSON, JUnit

### Environment Setup
The tests automatically:
1. Wait for API server to be ready
2. Start DynamoDB Local if needed
3. Clean up test data after execution

## Test Data Management

### Test Data Generation
- Random customer data generation
- UUID-based unique identifiers
- Email validation patterns
- Special character testing

### Data Cleanup
- Automatic cleanup after each test suite
- Global teardown for remaining test data
- No interference between test runs

## CI/CD Integration

### GitHub Actions Ready
```yaml
# Start backend services first
- name: Start Backend Services
  run: |
    cd backend
    make run-docker
    make run &
    sleep 5

# Run integration tests
- name: Run Integration Tests
  run: |
    cd integration_test
    make setup
    make test

# Cleanup
- name: Stop Backend Services
  run: |
    cd backend
    make stop-docker
```

### Docker Support
Tests can run against containerized API:
```bash
# Start backend with Docker
cd ../backend && make run-docker && make run

# In another terminal, run tests
cd integration_test
make test
```

### Local Development Workflow
```bash
# Terminal 1: Start backend services
cd backend
make run-docker
make run

# Terminal 2: Run integration tests
cd integration_test
make setup      # First time only
make test       # Run tests

# For development/debugging
make test-ui    # Interactive testing
make test-debug # Debug specific issues
```

## Troubleshooting

### Common Issues

**API Server Not Running**
```bash
# Check if backend is running
make check-backend

# If not, start the backend API
cd ../backend && make run
```

**DynamoDB Not Available**
```bash
# Check if DynamoDB is running
make check-dynamodb

# If not, start DynamoDB Local
cd ../backend && make run-docker
```

**Prerequisites Check**
```bash
# Check all prerequisites at once
make check-prereqs

# Validate test environment
make validate
```

**Test Failures Due to Data Conflicts**
```bash
# Clean up test data manually
make clean

# Or run global teardown
npx playwright test tests/global-teardown.js
```

**Port Conflicts**
- Ensure port 8080 is available for API
- Ensure port 8000 is available for DynamoDB
- Use `make info` to see current configuration

### Debug Mode
```bash
# Using Makefile
make test-debug                              # Debug mode
make test-file FILE=create-customer.test.js  # Single test file
make stats                                   # Show test statistics
make info                                    # Show configuration

# Using npm/npx directly  
DEBUG=pw:api npm test                        # Detailed logs
npx playwright test --debug create-customer.test.js  # Debug single test
```

## Best Practices

1. **Test Isolation**: Each test cleans up its own data
2. **Concurrent Safety**: Tests handle concurrent operations safely
3. **Error Validation**: Comprehensive error response validation
4. **Data Integrity**: Verify data persistence across operations
5. **Performance**: Monitor response times and system health

## Contributing

When adding new tests:
1. Follow existing naming conventions
2. Use TestHelpers for common operations
3. Include both positive and negative test cases
4. Add proper cleanup in `afterAll` hooks
5. Update this README with new test coverage