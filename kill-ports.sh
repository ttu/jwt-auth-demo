#!/bin/bash

# Kill Ports Script for JWT Auth Demo
# ===================================
# This script kills processes using ports for all services in the JWT authentication demo project.
# 
# Project Services:
# - Frontend (React): Port 3000
# - Backend (Node.js API): Port 3001  
# - OAuth Server: Port 3002
# - Frontend Standalone (React SPA): Port 3003

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project ports
PORTS=(3000 3001 3002 3003)
PORT_NAMES=("Frontend" "Backend API" "OAuth Server" "Frontend Standalone")

echo -e "${BLUE}🔪 JWT Auth Demo - Kill Ports Script${NC}"
echo -e "${BLUE}====================================${NC}"
echo

# Function to kill process on a specific port
kill_port() {
    local port=$1
    local name=$2
    
    echo -e "${YELLOW}Checking port ${port} (${name})...${NC}"
    
    # Find process ID using the port
    local pid=$(lsof -ti :$port 2>/dev/null || true)
    
    if [ -z "$pid" ]; then
        echo -e "${GREEN}✓ Port ${port} is already free${NC}"
        return 0
    fi
    
    # Get process details for logging
    local process_info=$(lsof -i :$port 2>/dev/null | tail -n +2 | head -1 || echo "Unknown process")
    echo -e "${RED}Found process on port ${port}:${NC}"
    echo "  $process_info"
    
    # Kill the process
    if kill -9 $pid 2>/dev/null; then
        echo -e "${GREEN}✓ Killed process ${pid} on port ${port}${NC}"
    else
        echo -e "${RED}✗ Failed to kill process ${pid} on port ${port}${NC}"
        return 1
    fi
    
    # Verify the port is now free
    sleep 0.5
    local check_pid=$(lsof -ti :$port 2>/dev/null || true)
    if [ -z "$check_pid" ]; then
        echo -e "${GREEN}✓ Port ${port} is now free${NC}"
    else
        echo -e "${RED}⚠ Port ${port} may still be in use${NC}"
    fi
}

# Function to show current port usage
show_port_status() {
    echo -e "${BLUE}Current Port Status:${NC}"
    echo -e "${BLUE}===================${NC}"
    
    for i in "${!PORTS[@]}"; do
        local port=${PORTS[$i]}
        local name=${PORT_NAMES[$i]}
        local pid=$(lsof -ti :$port 2>/dev/null || true)
        
        if [ -z "$pid" ]; then
            echo -e "${GREEN}Port ${port} (${name}): FREE${NC}"
        else
            local process_name=$(lsof -i :$port 2>/dev/null | tail -n +2 | head -1 | awk '{print $1}' || echo "Unknown")
            echo -e "${RED}Port ${port} (${name}): IN USE (PID: ${pid}, Process: ${process_name})${NC}"
        fi
    done
    echo
}

# Function to kill all project ports
kill_all_ports() {
    echo -e "${YELLOW}Killing processes on all project ports...${NC}"
    echo
    
    local failed_ports=()
    
    for i in "${!PORTS[@]}"; do
        local port=${PORTS[$i]}
        local name=${PORT_NAMES[$i]}
        
        if ! kill_port $port "$name"; then
            failed_ports+=($port)
        fi
        echo
    done
    
    # Summary
    echo -e "${BLUE}Summary:${NC}"
    echo -e "${BLUE}========${NC}"
    
    if [ ${#failed_ports[@]} -eq 0 ]; then
        echo -e "${GREEN}✅ All ports cleared successfully!${NC}"
    else
        echo -e "${RED}❌ Failed to clear ports: ${failed_ports[*]}${NC}"
        echo -e "${YELLOW}You may need to run with sudo or check for system processes.${NC}"
    fi
}

# Function to kill a specific port
kill_specific_port() {
    local target_port=$1
    local port_found=false
    
    for i in "${!PORTS[@]}"; do
        if [ "${PORTS[$i]}" = "$target_port" ]; then
            kill_port $target_port "${PORT_NAMES[$i]}"
            port_found=true
            break
        fi
    done
    
    if [ "$port_found" = false ]; then
        echo -e "${YELLOW}Port ${target_port} is not a standard project port, but attempting to kill anyway...${NC}"
        kill_port $target_port "Custom"
    fi
}

# Function to show help
show_help() {
    echo -e "${BLUE}Usage:${NC}"
    echo "  $0                    # Kill all project ports (3000, 3001, 3002, 3003)"
    echo "  $0 status             # Show current port status"
    echo "  $0 <port>             # Kill specific port (e.g., $0 3000)"
    echo "  $0 help               # Show this help message"
    echo
    echo -e "${BLUE}Project Ports:${NC}"
    for i in "${!PORTS[@]}"; do
        echo "  ${PORTS[$i]} - ${PORT_NAMES[$i]}"
    done
    echo
    echo -e "${BLUE}Examples:${NC}"
    echo "  $0                    # Kill all project services"
    echo "  $0 3000               # Kill only frontend"
    echo "  $0 status             # Check what's running"
}

# Main script logic
case "${1:-}" in
    "status")
        show_port_status
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    "")
        show_port_status
        kill_all_ports
        echo
        show_port_status
        ;;
    [0-9]*)
        if [[ $1 =~ ^[0-9]+$ ]] && [ $1 -ge 1 ] && [ $1 -le 65535 ]; then
            echo -e "${YELLOW}Killing process on port $1...${NC}"
            echo
            kill_specific_port $1
        else
            echo -e "${RED}Error: Invalid port number '$1'${NC}"
            echo "Port must be a number between 1 and 65535"
            exit 1
        fi
        ;;
    *)
        echo -e "${RED}Error: Unknown command '$1'${NC}"
        echo
        show_help
        exit 1
        ;;
esac



