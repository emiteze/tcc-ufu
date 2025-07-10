# Makefile for TCC-UFU Customer Backend

# Variables
BINARY_NAME=customer-api
BUILD_DIR=bin
MAIN_PACKAGE=./cmd/api
GO_FILES=$(shell find . -name "*.go" -type f)

# Default target
.PHONY: all
all: fmt lint test build

# Format Go code
.PHONY: fmt
fmt:
	@echo "Running go fmt..."
	@go fmt ./...
	@echo "Code formatting complete"

# Lint Go code
.PHONY: lint
lint:
	@echo "Running go vet..."
	@go vet ./...
	@echo "Running golint (if available)..."
	@command -v golint >/dev/null 2>&1 && golint ./... || echo "golint not found, skipping"
	@echo "Linting complete"

# Run tests
.PHONY: test
test:
	@echo "Running tests..."
	@go test -v ./...
	@echo "Tests complete"

# Run tests with coverage
.PHONY: test-coverage
test-coverage:
	@echo "Running tests with coverage..."
	@go test -v -race -coverprofile=coverage.out ./...
	@go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated at coverage.html"

# Build the application
.PHONY: build
build:
	@echo "Building $(BINARY_NAME)..."
	@mkdir -p $(BUILD_DIR)
	@go build -o $(BUILD_DIR)/$(BINARY_NAME) $(MAIN_PACKAGE)
	@echo "Build complete: $(BUILD_DIR)/$(BINARY_NAME)"

# Build for Linux (useful for Docker)
.PHONY: build-linux
build-linux:
	@echo "Building $(BINARY_NAME) for Linux..."
	@mkdir -p $(BUILD_DIR)
	@GOOS=linux GOARCH=amd64 go build -o $(BUILD_DIR)/$(BINARY_NAME)-linux $(MAIN_PACKAGE)
	@echo "Linux build complete: $(BUILD_DIR)/$(BINARY_NAME)-linux"

# Clean build artifacts
.PHONY: clean
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf $(BUILD_DIR)
	@rm -f coverage.out coverage.html
	@echo "Clean complete"

# Run the application
.PHONY: run
run:
	@echo "Running $(BINARY_NAME)..."
	@go run $(MAIN_PACKAGE)

# Run with Docker Compose (starts DynamoDB)
.PHONY: run-docker
run-docker:
	@echo "Starting services with Docker Compose..."
	@docker-compose up
	@echo "Services started. DynamoDB available at localhost:8000"

# Stop Docker Compose services
.PHONY: stop-docker
stop-docker:
	@echo "Stopping Docker Compose services..."
	@docker-compose down
	@echo "Services stopped"

# Install dependencies
.PHONY: deps
deps:
	@echo "Installing dependencies..."
	@go mod download
	@go mod tidy
	@echo "Dependencies installed"

# Check for security vulnerabilities
.PHONY: security
security:
	@echo "Checking for security vulnerabilities..."
	@command -v gosec >/dev/null 2>&1 && gosec ./... || echo "gosec not found, install with: go install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest"
	@echo "Security check complete"

# Run all quality checks
.PHONY: check
check: fmt lint test security
	@echo "All quality checks complete"

# Help target
.PHONY: help
help:
	@echo "TCC-UFU Customer Backend Makefile"
	@echo "================================="
	@echo ""
	@echo "Development Commands:"
	@echo "  all           - Run fmt, lint, test, and build"
	@echo "  fmt           - Format Go code"
	@echo "  lint          - Run linters (go vet, golint)"
	@echo "  test          - Run unit tests"
	@echo "  test-coverage - Run tests with coverage report"
	@echo "  build         - Build the application"
	@echo "  build-linux   - Build for Linux (useful for Docker)"
	@echo "  clean         - Clean build artifacts"
	@echo ""
	@echo "Runtime Commands:"
	@echo "  run           - Run the application"
	@echo "  run-docker    - Start services with Docker Compose"
	@echo "  stop-docker   - Stop Docker Compose services"
	@echo ""
	@echo "Utility Commands:"
	@echo "  deps          - Install dependencies"
	@echo "  security      - Check for security vulnerabilities"
	@echo "  check         - Run all quality checks"
	@echo "  help          - Show this help message"
	@echo ""
	@echo "Integration Tests:"
	@echo "  Integration tests are now managed separately."
	@echo "  See ../integration_test/Makefile for integration test commands."
	@echo ""
	@echo "Quick Start:"
	@echo "  make all              # Build and test everything"
	@echo "  make run-docker       # Start DynamoDB Local"
	@echo "  make run              # Start the API server"