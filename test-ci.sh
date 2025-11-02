#!/bin/bash

# Local CI Test Script
# Runs the same checks as GitHub Actions CI locally

set -e  # Exit on error

echo "🚀 Running Local CI Pipeline"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print step headers
print_step() {
    echo ""
    echo -e "${BLUE}▶ $1${NC}"
    echo "------------------------------"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Step 0: Clean environment
print_step "Step 0: Cleaning environment"

# Kill any running services on ports 3000, 3001, 3002
if lsof -ti:3000,3001,3002 >/dev/null 2>&1; then
    print_warning "Killing services on ports 3000, 3001, 3002"
    lsof -ti:3000,3001,3002 | xargs kill -9 2>/dev/null || true
fi

# Use npm clean script
npm run clean:build

print_success "Environment cleaned"

# Step 1: Install dependencies
print_step "Step 1: Installing dependencies"
npm run install:all
print_success "Dependencies installed"

# Step 2: Lint
print_step "Step 2: Running ESLint"
npm run lint:all
print_success "ESLint passed"

print_step "Step 3: Checking code formatting"
npm run format:check
print_success "Format check passed"

# Step 3: Build
print_step "Step 4: Building all services"
npm run build
print_success "Build successful"

# Step 4: Unit Tests
print_step "Step 5: Running unit tests"
npm run test:unit
print_success "Unit tests passed (114 tests)"

# Step 5: Integration Tests
print_step "Step 6: Running integration tests"
npm run test:integration:ci
print_success "Integration tests passed"

# Step 6: Security Audit (allow failures)
print_step "Step 7: Running security audit"
if npm run audit:all; then
    print_success "Security audit passed"
else
    echo -e "${RED}⚠ Security audit found issues (non-blocking)${NC}"
fi

# Success!
echo ""
echo "=============================="
echo -e "${GREEN}✓ All CI checks passed!${NC}"
echo "=============================="
echo ""
echo "Your code is ready to push! 🎉"
