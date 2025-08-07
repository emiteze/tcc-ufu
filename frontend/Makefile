# Frontend Makefile for Customer Management System
.PHONY: help install start build test lint format clean dev prod audit security deps check all

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[34m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

## Development Commands

help: ## Show this help message
	@echo "$(BLUE)Customer Management Frontend - Available Commands:$(RESET)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(RESET) %s\n", $$1, $$2}'

install: ## Install dependencies
	@echo "$(BLUE)Installing dependencies...$(RESET)"
	npm install

deps: ## Install and update dependencies
	@echo "$(BLUE)Installing and updating dependencies...$(RESET)"
	npm install
	npm update

start: ## Start development server
	@echo "$(BLUE)Starting development server...$(RESET)"
	npm start

dev: start ## Alias for start command

build: ## Build for production
	@echo "$(BLUE)Building for production...$(RESET)"
	npm run build

test: ## Run tests
	@echo "$(BLUE)Running tests...$(RESET)"
	npm test -- --coverage --watchAll=false

test-watch: ## Run tests in watch mode
	@echo "$(BLUE)Running tests in watch mode...$(RESET)"
	npm test

test-coverage: ## Run tests with coverage report
	@echo "$(BLUE)Running tests with coverage...$(RESET)"
	npm test -- --coverage --watchAll=false
	@echo "$(GREEN)Coverage report generated in coverage/$(RESET)"

lint: ## Check code style and potential errors
	@echo "$(BLUE)Checking code style...$(RESET)"
	npm run lint || echo "$(YELLOW)Install eslint if not configured$(RESET)"

format: ## Format code
	@echo "$(BLUE)Formatting code...$(RESET)"
	npx prettier --write "src/**/*.{ts,tsx,js,jsx,css,json}"

type-check: ## Run TypeScript type checking
	@echo "$(BLUE)Running TypeScript type check...$(RESET)"
	npx tsc --noEmit

## Quality Assurance

audit: ## Check for security vulnerabilities
	@echo "$(BLUE)Auditing dependencies for security issues...$(RESET)"
	npm audit

security: audit ## Alias for audit

audit-fix: ## Fix security vulnerabilities automatically
	@echo "$(BLUE)Fixing security vulnerabilities...$(RESET)"
	npm audit fix

check: ## Run all quality checks
	@echo "$(BLUE)Running all quality checks...$(RESET)"
	@$(MAKE) type-check
	@$(MAKE) test
	@$(MAKE) audit

## Build and Production

prod: build ## Build and prepare for production
	@echo "$(GREEN)Production build completed!$(RESET)"
	@echo "$(YELLOW)Build artifacts are in the 'build/' directory$(RESET)"

serve: build ## Serve production build locally
	@echo "$(BLUE)Serving production build...$(RESET)"
	npx serve -s build -l 3000

preview: serve ## Alias for serve

## Maintenance

clean: ## Clean build artifacts and node_modules
	@echo "$(BLUE)Cleaning build artifacts...$(RESET)"
	rm -rf build/
	rm -rf coverage/
	rm -rf node_modules/
	rm -f package-lock.json

clean-build: ## Clean only build artifacts
	@echo "$(BLUE)Cleaning build artifacts...$(RESET)"
	rm -rf build/
	rm -rf coverage/

reset: clean install ## Clean and reinstall everything
	@echo "$(GREEN)Project reset completed!$(RESET)"

## Docker Commands

docker-build: ## Build Docker image for frontend
	@echo "$(BLUE)Building Docker image...$(RESET)"
	docker build -t customer-frontend .

docker-run: ## Run frontend in Docker container
	@echo "$(BLUE)Running frontend in Docker...$(RESET)"
	docker run -p 3000:3000 customer-frontend

## Backend Integration

backend-check: ## Check if backend is running
	@echo "$(BLUE)Checking backend connection...$(RESET)"
	@curl -s http://localhost:8080/customers > /dev/null && \
		echo "$(GREEN)✓ Backend is running on port 8080$(RESET)" || \
		echo "$(RED)✗ Backend is not running on port 8080$(RESET)"

full-dev: ## Start both backend and frontend (requires backend in ../backend)
	@echo "$(BLUE)Starting full development environment...$(RESET)"
	@if [ -d "../backend" ]; then \
		echo "$(BLUE)Starting backend...$(RESET)"; \
		cd ../backend && make run-docker & \
		sleep 5; \
		echo "$(BLUE)Starting frontend...$(RESET)"; \
		npm start; \
	else \
		echo "$(RED)Backend directory not found at ../backend$(RESET)"; \
	fi

## Comprehensive Commands

all: deps type-check test build ## Run complete workflow: install, type-check, test, build
	@echo "$(GREEN)All tasks completed successfully!$(RESET)"

ci: ## Run CI pipeline (type-check, test, build)
	@echo "$(BLUE)Running CI pipeline...$(RESET)"
	@$(MAKE) type-check
	@$(MAKE) test
	@$(MAKE) build
	@echo "$(GREEN)CI pipeline completed successfully!$(RESET)"

## Information

info: ## Show project information
	@echo "$(BLUE)Project Information:$(RESET)"
	@echo "Node.js version: $$(node --version)"
	@echo "npm version: $$(npm --version)"
	@echo "Project: $$(jq -r '.name' package.json 2>/dev/null || echo 'Unknown')"
	@echo "Version: $$(jq -r '.version' package.json 2>/dev/null || echo 'Unknown')"
	@echo "Dependencies: $$(ls node_modules | wc -l | xargs) packages"

status: backend-check ## Check project status
	@echo "$(BLUE)Frontend Status:$(RESET)"
	@if [ -d "build" ]; then echo "$(GREEN)✓ Build exists$(RESET)"; else echo "$(YELLOW)○ No build found$(RESET)"; fi
	@if [ -d "node_modules" ]; then echo "$(GREEN)✓ Dependencies installed$(RESET)"; else echo "$(RED)✗ Dependencies not installed$(RESET)"; fi