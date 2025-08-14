# Makefile for TCC-UFU Integration Tests

# Variables
API_URL=http://localhost:8080
FRONTEND_URL=http://localhost:3000
DYNAMODB_URL=http://localhost:8000
NODE_MODULES=node_modules
TEST_RESULTS=test-results
PLAYWRIGHT_REPORT=playwright-report

# Default target
.PHONY: all
all: install test

# Install dependencies
.PHONY: install
install:
	@echo "Installing Node.js dependencies..."
	@npm install
	@echo "Dependencies installed"

# Install Playwright browsers
.PHONY: install-browsers
install-browsers:
	@echo "Installing Playwright browsers..."
	@npm run install:browsers
	@echo "Playwright browsers installed"

# Setup complete environment (install + browsers)
.PHONY: setup
setup: install install-browsers
	@echo "Integration test environment setup complete"

# Check if backend is running
.PHONY: check-backend
check-backend:
	@echo "Checking if backend API is available at $(API_URL)..."
	@curl -f -s --max-time 10 $(API_URL)/customers >/dev/null || (echo "❌ Backend API not available at $(API_URL)" && echo "Please start the backend service first" && exit 1)
	@echo "✅ Backend API is available"

# Check if frontend is running
.PHONY: check-frontend
check-frontend:
	@echo "Checking if frontend is available at $(FRONTEND_URL)..."
	@curl -f -s --max-time 10 $(FRONTEND_URL) >/dev/null || (echo "❌ Frontend not available at $(FRONTEND_URL)" && echo "Please start the frontend service first" && exit 1)
	@echo "✅ Frontend is available"

# Check if DynamoDB is running
.PHONY: check-dynamodb
check-dynamodb:
	@echo "Checking if DynamoDB is available at $(DYNAMODB_URL)..."
	@curl -f -s --max-time 10 $(DYNAMODB_URL) >/dev/null || (echo "⚠️ DynamoDB not available at $(DYNAMODB_URL)" && echo "This might cause test failures if backend expects local DynamoDB")
	@echo "✅ DynamoDB is available"

# Check all prerequisites for API tests
.PHONY: check-prereqs
check-prereqs: check-backend check-dynamodb
	@echo "✅ All prerequisites are met for API tests"

# Check all prerequisites for frontend tests
.PHONY: check-frontend-prereqs
check-frontend-prereqs: check-frontend
	@echo "✅ All prerequisites are met for frontend tests"

# Check all prerequisites for all tests
.PHONY: check-all-prereqs
check-all-prereqs: check-backend check-frontend check-dynamodb
	@echo "✅ All prerequisites are met for all tests"

# Run all tests (both API and frontend)
.PHONY: test
test: check-all-prereqs
	@echo "Running all integration tests..."
	@npm test
	@echo "All integration tests complete"

# Run all tests without prereq checks (for CI)
.PHONY: test-ci
test-ci:
	@echo "Running all integration tests (CI mode)..."
	@npm test
	@echo "All integration tests complete"

# Run only API tests
.PHONY: test-api
test-api: check-prereqs
	@echo "Running API integration tests..."
	@npx playwright test --project="API Tests"
	@echo "API integration tests complete"

# Run only API tests without prereq checks (for CI)
.PHONY: test-api-ci
test-api-ci:
	@echo "Running API integration tests (CI mode)..."
	@npx playwright test --project="API Tests"
	@echo "API integration tests complete"

# Run only frontend tests
.PHONY: test-frontend
test-frontend: check-frontend-prereqs
	@echo "Running frontend integration tests..."
	@npx playwright test --project="Frontend Chrome"
	@echo "Frontend integration tests complete"

# Run only frontend tests without prereq checks (for CI)
.PHONY: test-frontend-ci
test-frontend-ci:
	@echo "Running frontend integration tests (CI mode)..."
	@npx playwright test --project="Frontend Chrome"
	@echo "Frontend integration tests complete"

# Run frontend tests on all browsers
.PHONY: test-frontend-all
test-frontend-all: check-frontend-prereqs
	@echo "Running frontend tests on all browsers..."
	@npx playwright test tests/frontend/
	@echo "Frontend tests on all browsers complete"

# Run tests with verbose output
.PHONY: test-verbose
test-verbose: check-all-prereqs
	@echo "Running all integration tests (verbose)..."
	@npx playwright test --reporter=list
	@echo "Verbose integration tests complete"

# Run frontend tests in headed mode (with browser UI)
.PHONY: test-frontend-headed
test-frontend-headed: check-frontend-prereqs
	@echo "Running frontend tests in headed mode..."
	@npx playwright test tests/frontend/ --headed
	@echo "Headed frontend tests complete"

# Run frontend tests in debug mode
.PHONY: test-frontend-debug
test-frontend-debug: check-frontend-prereqs
	@echo "Running frontend tests in debug mode..."
	@npx playwright test tests/frontend/ --debug

# Run frontend tests with UI mode
.PHONY: test-frontend-ui
test-frontend-ui: check-frontend-prereqs
	@echo "Running frontend tests with UI..."
	@npx playwright test tests/frontend/ --ui

# Run tests in headed mode (with browser UI) - legacy
.PHONY: test-headed
test-headed: check-all-prereqs
	@echo "Running integration tests in headed mode..."
	@npm run test:headed
	@echo "Headed integration tests complete"

# Run tests in debug mode - legacy
.PHONY: test-debug
test-debug: check-all-prereqs
	@echo "Running integration tests in debug mode..."
	@npm run test:debug

# Run tests with UI mode - legacy
.PHONY: test-ui
test-ui: check-all-prereqs
	@echo "Running integration tests with UI..."
	@npm run test:ui

# Run specific test file
.PHONY: test-file
test-file: check-prereqs
	@if [ -z "$(FILE)" ]; then \
		echo "Usage: make test-file FILE=<test-file-name>"; \
		echo "Example: make test-file FILE=create-customer.test.js"; \
		exit 1; \
	fi
	@echo "Running test file: $(FILE)"
	@npx playwright test $(FILE)

# Run tests matching a pattern
.PHONY: test-grep
test-grep: check-prereqs
	@if [ -z "$(PATTERN)" ]; then \
		echo "Usage: make test-grep PATTERN=<test-pattern>"; \
		echo "Example: make test-grep PATTERN='should create'"; \
		exit 1; \
	fi
	@echo "Running tests matching pattern: $(PATTERN)"
	@npx playwright test --grep "$(PATTERN)"

# Generate and show test report
.PHONY: report
report:
	@echo "Generating test report..."
	@npm run test:report
	@echo "Test report opened in browser"

# Show last test report (if exists)
.PHONY: show-report
show-report:
	@if [ -d "$(PLAYWRIGHT_REPORT)" ]; then \
		echo "Opening last test report..."; \
		npx playwright show-report; \
	else \
		echo "No test report found. Run 'make test' first."; \
	fi

# Clean test artifacts
.PHONY: clean
clean:
	@echo "Cleaning test artifacts..."
	@rm -rf $(TEST_RESULTS)
	@rm -rf $(PLAYWRIGHT_REPORT)
	@rm -rf blob-report
	@echo "Test artifacts cleaned"

# Clean everything including node_modules
.PHONY: clean-all
clean-all: clean
	@echo "Cleaning all artifacts including dependencies..."
	@rm -rf $(NODE_MODULES)
	@rm -f package-lock.json
	@echo "All artifacts cleaned"

# Lint test files (if eslint is configured)
.PHONY: lint
lint:
	@echo "Linting test files..."
	@if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ]; then \
		npx eslint tests/; \
	else \
		echo "No ESLint configuration found, skipping lint"; \
	fi
	@echo "Linting complete"

# Format test files (if prettier is configured)
.PHONY: format
format:
	@echo "Formatting test files..."
	@if command -v prettier >/dev/null 2>&1; then \
		npx prettier --write tests/; \
	else \
		echo "Prettier not found, skipping format"; \
	fi
	@echo "Formatting complete"

# Run tests with coverage (if configured)
.PHONY: test-coverage
test-coverage: check-prereqs
	@echo "Running tests with coverage..."
	@npx playwright test --reporter=html,json
	@echo "Coverage report generated"

# Run smoke tests (basic health checks)
.PHONY: smoke-test
smoke-test: check-prereqs
	@echo "Running smoke tests..."
	@npx playwright test --grep "API health"
	@echo "Smoke tests complete"

# Run performance tests
.PHONY: performance-test
performance-test: check-prereqs
	@echo "Running performance tests..."
	@npx playwright test --grep "performance|stress|concurrent"
	@echo "Performance tests complete"

# Watch mode (re-run tests on file changes)
.PHONY: watch
watch: check-prereqs
	@echo "Running tests in watch mode..."
	@echo "Note: This requires manual test re-run on file changes"
	@npx playwright test --ui

# Validate test environment
.PHONY: validate
validate:
	@echo "Validating test environment..."
	@node --version
	@npm --version
	@npx playwright --version
	@echo "Checking package.json..."
	@test -f package.json || (echo "❌ package.json not found" && exit 1)
	@echo "Checking test files..."
	@test -d tests || (echo "❌ tests directory not found" && exit 1)
	@echo "✅ Test environment validation complete"

# Show test statistics
.PHONY: stats
stats:
	@echo "Test Statistics:"
	@echo "==============="
	@echo "Test files: $$(find tests -name '*.test.js' | wc -l)"
	@echo "Total test cases: $$(grep -r 'test(' tests/ | wc -l)"
	@echo "Test suites: $$(grep -r 'test.describe' tests/ | wc -l)"
	@if [ -f "$(TEST_RESULTS)/results.json" ]; then \
		echo "Last run results available in $(TEST_RESULTS)/results.json"; \
	fi

# Print configuration information
.PHONY: info
info:
	@echo "Integration Test Configuration:"
	@echo "==============================="
	@echo "API URL: $(API_URL)"
	@echo "Frontend URL: $(FRONTEND_URL)"
	@echo "DynamoDB URL: $(DYNAMODB_URL)"
	@echo "Node modules: $(NODE_MODULES)"
	@echo "Test results: $(TEST_RESULTS)"
	@echo "Report directory: $(PLAYWRIGHT_REPORT)"
	@echo ""
	@echo "Available API test files:"
	@find tests/api -name '*.test.js' -exec basename {} \; 2>/dev/null | sort || echo "No API tests found"
	@echo ""
	@echo "Available Frontend test files:"
	@find tests/frontend -name '*.test.js' -exec basename {} \; 2>/dev/null | sort || echo "No frontend tests found"

# Help target
.PHONY: help
help:
	@echo "TCC-UFU Integration Tests Makefile"
	@echo "=================================="
	@echo ""
	@echo "Prerequisites:"
	@echo "  - Backend API running at $(API_URL) (for API tests)"
	@echo "  - Frontend app running at $(FRONTEND_URL) (for frontend tests)"
	@echo "  - DynamoDB Local at $(DYNAMODB_URL) (recommended for API tests)"
	@echo ""
	@echo "Setup Commands:"
	@echo "  setup              - Complete setup (install + browsers)"
	@echo "  install            - Install Node.js dependencies"
	@echo "  install-browsers   - Install Playwright browsers"
	@echo ""
	@echo "Test Commands (All):"
	@echo "  test               - Run all integration tests (API + Frontend)"
	@echo "  test-ci            - Run all tests without prereq checks (for CI)"
	@echo "  test-verbose       - Run all tests with verbose output"
	@echo "  test-headed        - Run all tests in headed mode"
	@echo "  test-debug         - Run all tests in debug mode"
	@echo "  test-ui            - Run all tests with Playwright UI"
	@echo ""
	@echo "Test Commands (API Only):"
	@echo "  test-api           - Run only API integration tests"
	@echo "  test-api-ci        - Run API tests without prereq checks (for CI)"
	@echo ""
	@echo "Test Commands (Frontend Only):"
	@echo "  test-frontend      - Run frontend tests (Chrome only)"
	@echo "  test-frontend-ci   - Run frontend tests without prereq checks (for CI)"
	@echo "  test-frontend-all  - Run frontend tests on all browsers"
	@echo "  test-frontend-headed - Run frontend tests in headed mode"
	@echo "  test-frontend-debug  - Run frontend tests in debug mode"
	@echo "  test-frontend-ui     - Run frontend tests with Playwright UI"
	@echo ""
	@echo "Utility Commands:"
	@echo "  test-file FILE=x   - Run specific test file"
	@echo "  test-grep PATTERN=x- Run tests matching pattern"
	@echo "  test-coverage      - Run tests with coverage"
	@echo "  smoke-test         - Run basic health check tests"
	@echo "  performance-test   - Run performance and stress tests"
	@echo ""
	@echo "Prerequisite Checks:"
	@echo "  check-all-prereqs  - Check all services (API + Frontend + DB)"
	@echo "  check-prereqs      - Check API services (API + DB)"
	@echo "  check-frontend-prereqs - Check frontend services"
	@echo "  check-backend      - Check if backend API is available"
	@echo "  check-frontend     - Check if frontend is available"
	@echo "  check-dynamodb     - Check if DynamoDB is available"
	@echo ""
	@echo "Other Commands:"
	@echo "  report             - Generate and show test report"
	@echo "  show-report        - Show last test report"
	@echo "  clean              - Clean test artifacts"
	@echo "  clean-all          - Clean all artifacts including dependencies"
	@echo "  validate           - Validate test environment"
	@echo "  stats              - Show test statistics"
	@echo "  info               - Show configuration information"
	@echo "  lint               - Lint test files (if configured)"
	@echo "  format             - Format test files (if configured)"
	@echo "  watch              - Run tests in watch mode"
	@echo ""
	@echo "Examples:"
	@echo "  make setup                                    # Initial setup"
	@echo "  make test                                     # Run all tests"
	@echo "  make test-api                                 # Run only API tests"
	@echo "  make test-frontend                            # Run only frontend tests"
	@echo "  make test-frontend-headed                     # Debug frontend with browser"
	@echo "  make test-file FILE=customer-form.test.js    # Run specific test"
	@echo "  make test-grep PATTERN='should create'       # Run matching tests"