#!/bin/bash

# Frontend Standalone PKCE Integration Tests
# This script runs Playwright tests specifically for the frontend-standalone application

set -e

echo "🧪 Frontend Standalone PKCE Integration Tests"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "playwright.config.ts" ]; then
    print_error "Please run this script from the integration-tests directory"
    exit 1
fi

# Check if dependencies are installed
print_status "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Check if Playwright browsers are installed
if [ ! -d "node_modules/@playwright/test" ]; then
    print_error "Playwright not found. Please run 'npm install' first."
    exit 1
fi

# Install Playwright browsers if needed
print_status "Ensuring Playwright browsers are installed..."
npx playwright install chromium

# Function to check if a service is running
check_service() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1

    print_status "Checking if $service_name is running on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "http://localhost:$port" > /dev/null 2>&1; then
            print_success "$service_name is running on port $port"
            return 0
        fi
        
        if [ $attempt -eq 1 ]; then
            print_status "Waiting for $service_name to start..."
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start on port $port after $((max_attempts * 2)) seconds"
    return 1
}

# Function to start services if not running
start_services() {
    print_status "Starting required services..."
    
    # Check OAuth server (required)
    if ! curl -s "http://localhost:3002/health" > /dev/null 2>&1; then
        print_status "Starting OAuth server..."
        cd ../oauth-server
        npm run dev &
        OAUTH_PID=$!
        cd ../integration-tests
        
        if ! check_service "OAuth Server" 3002; then
            print_error "Failed to start OAuth server"
            kill $OAUTH_PID 2>/dev/null || true
            exit 1
        fi
    else
        print_success "OAuth server already running"
    fi
    
    # Check frontend-standalone (required)
    if ! curl -s "http://localhost:3003" > /dev/null 2>&1; then
        print_status "Starting frontend-standalone..."
        cd ../frontend-standalone
        npm run dev &
        FRONTEND_PID=$!
        cd ../integration-tests
        
        if ! check_service "Frontend Standalone" 3003; then
            print_error "Failed to start frontend-standalone"
            kill $FRONTEND_PID 2>/dev/null || true
            kill $OAUTH_PID 2>/dev/null || true
            exit 1
        fi
    else
        print_success "Frontend-standalone already running"
    fi
}

# Function to run tests
run_tests() {
    print_status "Running frontend-standalone PKCE tests..."
    
    # Run only the frontend-standalone project tests
    if npx playwright test --project=frontend-standalone --reporter=html; then
        print_success "All frontend-standalone tests passed!"
        return 0
    else
        print_error "Some frontend-standalone tests failed"
        return 1
    fi
}

# Function to cleanup
cleanup() {
    print_status "Cleaning up..."
    if [ ! -z "$OAUTH_PID" ]; then
        kill $OAUTH_PID 2>/dev/null || true
        print_status "Stopped OAuth server"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        print_status "Stopped frontend-standalone"
    fi
}

# Set up cleanup on exit
trap cleanup EXIT

# Main execution
main() {
    print_status "Starting frontend-standalone PKCE integration tests..."
    
    # Start services
    start_services
    
    # Wait a bit for services to fully initialize
    print_status "Waiting for services to fully initialize..."
    sleep 5
    
    # Run tests
    if run_tests; then
        print_success "🎉 All frontend-standalone PKCE tests completed successfully!"
        
        # Show test report location
        if [ -f "playwright-report/index.html" ]; then
            print_status "Test report available at: $(pwd)/playwright-report/index.html"
            print_status "Open with: npx playwright show-report"
        fi
        
        exit 0
    else
        print_error "❌ Some tests failed. Check the test report for details."
        exit 1
    fi
}

# Parse command line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --debug        Run tests with debug output"
        echo "  --headed       Run tests in headed mode (visible browser)"
        echo "  --ui           Run tests with Playwright UI"
        echo ""
        echo "Examples:"
        echo "  $0                    # Run tests normally"
        echo "  $0 --debug           # Run with debug output"
        echo "  $0 --headed          # Run with visible browser"
        echo "  $0 --ui              # Run with Playwright UI"
        exit 0
        ;;
    --debug)
        export DEBUG=pw:*
        print_status "Debug mode enabled"
        ;;
    --headed)
        export PLAYWRIGHT_HEADED=1
        print_status "Headed mode enabled (browser will be visible)"
        ;;
    --ui)
        print_status "Running tests with Playwright UI..."
        npx playwright test --project=frontend-standalone --ui
        exit $?
        ;;
esac

# Run main function
main
