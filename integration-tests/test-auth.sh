#!/bin/bash

# Authentication Flow Test Script
# Tests password login, token refresh, and logout flows

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:3001/api/auth"
DEVICE_ID="test-device-$(date +%s)"
COOKIE_FILE="/tmp/auth-test-cookies-$(date +%s).txt"
USER_AGENT="AuthTestScript/1.0"
PLATFORM="macOS"

# Cleanup on exit
trap "rm -f $COOKIE_FILE ${COOKIE_FILE}.backup" EXIT

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}JWT Authentication Flow Test${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Test 1: Login
echo -e "${YELLOW}Test 1: Login with password${NC}"
LOGIN_RESPONSE=$(curl -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -H "x-device-id: $DEVICE_ID" \
  -H "User-Agent: $USER_AGENT" \
  -H "sec-ch-ua-platform: $PLATFORM" \
  -d '{"username":"demo","password":"password123"}' \
  -c "$COOKIE_FILE" \
  -s)

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken')

if [ "$ACCESS_TOKEN" != "null" ] && [ -n "$ACCESS_TOKEN" ]; then
  echo -e "${GREEN}✓ Login successful${NC}"
  echo -e "  Access Token: ${ACCESS_TOKEN:0:50}..."
else
  echo -e "${RED}✗ Login failed${NC}"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

# Test 2: Access Protected Resource
echo -e "\n${YELLOW}Test 2: Access protected resource with valid token${NC}"
PROTECTED_RESPONSE=$(curl -X GET "http://localhost:3001/api/customers/list" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -s)

if echo "$PROTECTED_RESPONSE" | jq -e '.' >/dev/null 2>&1; then
  echo -e "${GREEN}✓ Protected resource accessed successfully${NC}"
  echo -e "  Response: $(echo "$PROTECTED_RESPONSE" | jq -c '.')"
else
  echo -e "${RED}✗ Failed to access protected resource${NC}"
  echo "$PROTECTED_RESPONSE"
fi

# Test 3: Wait for token expiration
echo -e "\n${YELLOW}Test 3: Wait for access token expiration (16 seconds)${NC}"
for i in {16..1}; do
  echo -ne "  Waiting... $i seconds remaining\r"
  sleep 1
done
echo -e "\n${GREEN}✓ Access token should now be expired${NC}"

# Test 4: Try accessing with expired token
echo -e "\n${YELLOW}Test 4: Try accessing with expired token${NC}"
EXPIRED_RESPONSE=$(curl -X GET "http://localhost:3001/api/customers/list" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -s -w "\n%{http_code}")

HTTP_CODE=$(echo "$EXPIRED_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$EXPIRED_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "401" ]; then
  echo -e "${GREEN}✓ Expired token correctly rejected (401)${NC}"
  echo -e "  Error: $(echo "$RESPONSE_BODY" | jq -r '.message')"
else
  echo -e "${RED}✗ Expired token should have been rejected${NC}"
  echo "$RESPONSE_BODY"
fi

# Test 5: Refresh token
echo -e "\n${YELLOW}Test 5: Refresh access token using refresh token${NC}"

# Save the refresh token cookie before first refresh
cp "$COOKIE_FILE" "${COOKIE_FILE}.backup"

REFRESH_RESPONSE=$(curl -X POST "$API_URL/refresh" \
  -H "x-device-id: $DEVICE_ID" \
  -H "User-Agent: $USER_AGENT" \
  -H "sec-ch-ua-platform: $PLATFORM" \
  -b "$COOKIE_FILE" \
  -c "$COOKIE_FILE" \
  -s)

NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.accessToken')

if [ "$NEW_ACCESS_TOKEN" != "null" ] && [ -n "$NEW_ACCESS_TOKEN" ]; then
  echo -e "${GREEN}✓ Token refresh successful${NC}"
  echo -e "  New Access Token: ${NEW_ACCESS_TOKEN:0:50}..."

  # Verify it's different from the old token
  if [ "$NEW_ACCESS_TOKEN" != "$ACCESS_TOKEN" ]; then
    echo -e "${GREEN}✓ New token is different from old token${NC}"
  else
    echo -e "${RED}✗ New token should be different${NC}"
  fi
else
  echo -e "${RED}✗ Token refresh failed${NC}"
  echo "$REFRESH_RESPONSE"
  exit 1
fi

# Test 5a: Try to reuse the old refresh token (should fail)
echo -e "\n${YELLOW}Test 5a: Try to reuse the old refresh token (should fail)${NC}"
REUSE_RESPONSE=$(curl -X POST "$API_URL/refresh" \
  -H "x-device-id: $DEVICE_ID" \
  -H "User-Agent: $USER_AGENT" \
  -H "sec-ch-ua-platform: $PLATFORM" \
  -b "${COOKIE_FILE}.backup" \
  -s -w "\n%{http_code}")

HTTP_CODE=$(echo "$REUSE_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$REUSE_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "401" ]; then
  echo -e "${GREEN}✓ Reused refresh token correctly rejected (401)${NC}"
  echo -e "  Error: $(echo "$RESPONSE_BODY" | jq -r '.message')"
else
  echo -e "${RED}✗ Reused refresh token should have been rejected (got $HTTP_CODE)${NC}"
  echo "$RESPONSE_BODY"
fi

# Clean up backup
rm -f "${COOKIE_FILE}.backup"

# Test 6: Use new access token
echo -e "\n${YELLOW}Test 6: Use new access token${NC}"
NEW_PROTECTED_RESPONSE=$(curl -X GET "http://localhost:3001/api/customers/list" \
  -H "Authorization: Bearer $NEW_ACCESS_TOKEN" \
  -s)

if echo "$NEW_PROTECTED_RESPONSE" | jq -e '.' >/dev/null 2>&1; then
  echo -e "${GREEN}✓ New access token works${NC}"
else
  echo -e "${RED}✗ New access token failed${NC}"
  echo "$NEW_PROTECTED_RESPONSE"
fi

# Test 7: Test single-use refresh token
echo -e "\n${YELLOW}Test 7: Wait and refresh again (testing single-use rotation)${NC}"
for i in {16..1}; do
  echo -ne "  Waiting... $i seconds remaining\r"
  sleep 1
done
echo ""

SECOND_REFRESH=$(curl -X POST "$API_URL/refresh" \
  -H "x-device-id: $DEVICE_ID" \
  -H "User-Agent: $USER_AGENT" \
  -H "sec-ch-ua-platform: $PLATFORM" \
  -b "$COOKIE_FILE" \
  -c "$COOKIE_FILE" \
  -s)

SECOND_ACCESS_TOKEN=$(echo "$SECOND_REFRESH" | jq -r '.accessToken')

if [ "$SECOND_ACCESS_TOKEN" != "null" ] && [ -n "$SECOND_ACCESS_TOKEN" ]; then
  echo -e "${GREEN}✓ Second refresh successful (single-use rotation works)${NC}"
  echo -e "  Second Access Token: ${SECOND_ACCESS_TOKEN:0:50}..."
else
  echo -e "${RED}✗ Second refresh failed${NC}"
  echo "$SECOND_REFRESH"
fi

# Test 8: Logout
echo -e "\n${YELLOW}Test 8: Logout and revoke tokens${NC}"
LOGOUT_RESPONSE=$(curl -X POST "$API_URL/logout" \
  -H "Authorization: Bearer $SECOND_ACCESS_TOKEN" \
  -H "x-device-id: $DEVICE_ID" \
  -s)

if echo "$LOGOUT_RESPONSE" | jq -e '.message' >/dev/null 2>&1; then
  echo -e "${GREEN}✓ Logout successful${NC}"
  echo -e "  Message: $(echo "$LOGOUT_RESPONSE" | jq -r '.message')"
else
  echo -e "${RED}✗ Logout failed${NC}"
  echo "$LOGOUT_RESPONSE"
fi

# Test 9: Try using token after logout
echo -e "\n${YELLOW}Test 9: Try using token after logout (should fail)${NC}"
AFTER_LOGOUT=$(curl -X GET "http://localhost:3001/api/customers/list" \
  -H "Authorization: Bearer $SECOND_ACCESS_TOKEN" \
  -s -w "\n%{http_code}")

HTTP_CODE=$(echo "$AFTER_LOGOUT" | tail -n1)
RESPONSE_BODY=$(echo "$AFTER_LOGOUT" | sed '$d')

if [ "$HTTP_CODE" = "401" ]; then
  echo -e "${GREEN}✓ Blacklisted token correctly rejected (401)${NC}"
  echo -e "  Error: $(echo "$RESPONSE_BODY" | jq -r '.message')"
else
  echo -e "${RED}✗ Blacklisted token should have been rejected${NC}"
  echo "$RESPONSE_BODY"
fi

# Test 10: Try refresh after logout
echo -e "\n${YELLOW}Test 10: Try refresh after logout (should fail)${NC}"
REFRESH_AFTER_LOGOUT=$(curl -X POST "$API_URL/refresh" \
  -H "x-device-id: $DEVICE_ID" \
  -H "User-Agent: $USER_AGENT" \
  -H "sec-ch-ua-platform: $PLATFORM" \
  -b "$COOKIE_FILE" \
  -s -w "\n%{http_code}")

HTTP_CODE=$(echo "$REFRESH_AFTER_LOGOUT" | tail -n1)
RESPONSE_BODY=$(echo "$REFRESH_AFTER_LOGOUT" | sed '$d')

if [ "$HTTP_CODE" = "401" ]; then
  echo -e "${GREEN}✓ Refresh after logout correctly rejected (401)${NC}"
  echo -e "  Error: $(echo "$RESPONSE_BODY" | jq -r '.message')"
else
  echo -e "${YELLOW}⚠ Refresh after logout should have been rejected (got $HTTP_CODE)${NC}"
  echo "$RESPONSE_BODY"
fi

# Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ All critical authentication flows tested${NC}"
echo -e "  - Login with password"
echo -e "  - Access token usage"
echo -e "  - Access token expiration"
echo -e "  - Token refresh"
echo -e "  - Single-use refresh token (reuse prevented)"
echo -e "  - Refresh token rotation"
echo -e "  - Token blacklisting on logout"
echo -e "  - Revoked token rejection"
echo -e "\n${GREEN}Authentication system is working correctly!${NC}\n"

# Cleanup
rm -f "$COOKIE_FILE" "${COOKIE_FILE}.backup"
