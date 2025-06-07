#!/bin/bash

# Enhanced debug script for authentication issues
# This script will test the complete authentication flow with detailed logging

# Text colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Kaze Scheduling Authentication Debug =====${NC}"

# Base URL
BASE_URL=${BASE_URL:-"http://localhost:3000"}

echo "Testing against: $BASE_URL"

# STEP 1: Check debug endpoint for initial state
echo -e "\n${YELLOW}1. Checking initial auth state...${NC}"
curl -s "$BASE_URL/api/debug/auth" | jq .

# STEP 2: Login to get a fresh token
echo -e "\n${YELLOW}2. Getting fresh authentication token...${NC}"
AUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User", "phone": "+1234567890"}')

echo "$AUTH_RESPONSE" | jq .

# Extract token
TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.token // empty')

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Failed to get authentication token${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Got token:${NC} ${TOKEN:0:10}...${TOKEN: -10}"

# STEP 3: Check token validity via debug endpoint
echo -e "\n${YELLOW}3. Verifying token with debug endpoint...${NC}"
curl -s "$BASE_URL/api/debug/auth" \
  -H "Authorization: Bearer $TOKEN" | jq .

# STEP 4: Test token with availability endpoint
echo -e "\n${YELLOW}4. Testing token with availability endpoint...${NC}"
TODAY=$(date +"%Y-%m-%d")
AVAILABILITY_RESPONSE=$(curl -s -v "$BASE_URL/api/cal/availability?start=${TODAY}T00:00:00.000Z&end=${TODAY}T23:59:59.999Z&eventTypeId=1" \
  -H "Authorization: Bearer $TOKEN" 2>&1)

# Extract headers for debugging
echo "Request headers sent:"
echo "$AVAILABILITY_RESPONSE" | grep -i "> " 

echo "Response headers received:"
echo "$AVAILABILITY_RESPONSE" | grep -i "< " 

# Show response body
echo "Response body:"
echo "$AVAILABILITY_RESPONSE" | tail -n 20

# STEP 5: Create a test booking with verbose output
echo -e "\n${YELLOW}5. Creating test booking with verbose output...${NC}"
BOOKING_TIME=$(date -v+2H +"%Y-%m-%dT%H:00:00.000Z" 2>/dev/null || date -d "+2 hours" +"%Y-%m-%dT%H:00:00.000Z")
END_TIME=$(date -v+3H +"%Y-%m-%dT%H:00:00.000Z" 2>/dev/null || date -d "+3 hours" +"%Y-%m-%dT%H:00:00.000Z")

echo "Using booking time: $BOOKING_TIME"

BOOKING_RESPONSE=$(curl -v -X POST "$BASE_URL/api/cal/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "start": "'$BOOKING_TIME'",
    "end": "'$END_TIME'",
    "eventTypeId": 1,
    "eventTypeSlug": "general-service",
    "timeZone": "UTC",
    "language": "en",
    "user": "default",
    "responses": {
      "email": "test@example.com",
      "name": "Test User",
      "phone": "+1234567890",
      "location": {
        "optionValue": "in_person",
        "value": "Test Location"
      },
      "notes": "Test booking from debug script"
    }
  }' 2>&1)

# Extract headers for debugging
echo "Request headers sent:"
echo "$BOOKING_RESPONSE" | grep -i "> " 

echo "Response headers received:"
echo "$BOOKING_RESPONSE" | grep -i "< " 

# Show response body
echo "Response body:"
echo "$BOOKING_RESPONSE" | grep -v "^}" | grep -v "^{" | grep -v "^*" | grep -v "^>" | grep -v "^<" | tail -n 30

# STEP 6: Check Kaze API token directly
echo -e "\n${YELLOW}6. Checking Kaze API token configuration...${NC}"
curl -s "$BASE_URL/api/kaze/test-token" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n${BLUE}===== Debug Complete =====${NC}"
echo -e "If issues persist, please check the server console logs for more details."
