#!/bin/bash

# Script to test the booking flow authentication
# This script will:
# 1. Perform a login
# 2. Verify the token is received and stored
# 3. Make a test booking request with the token
# 4. Display the results

# Text colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Kaze Scheduling Authentication Test =====${NC}"

# First, check the debug endpoint
echo -e "\n${YELLOW}Checking auth debug info (before login)...${NC}"
curl -s http://localhost:3000/api/debug/auth | jq .

# Then let's create a login and use the token
echo -e "\n${YELLOW}Logging in a test user...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","phone":"555-1234"}')

# Extract token from response
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r .token)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo -e "${RED}Login failed or no token received${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
else
  echo -e "${GREEN}Login successful!${NC}"
  echo -e "Token: ${TOKEN:0:5}...${TOKEN: -5}"
  echo "$LOGIN_RESPONSE" | jq .
fi

# Check user profile with token
echo -e "\n${YELLOW}Checking user profile with token...${NC}"
curl -s http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq .

# Check the auth debug endpoint again (after login)
echo -e "\n${YELLOW}Checking auth debug info (after login)...${NC}"
curl -s http://localhost:3000/api/debug/auth \
  -H "Authorization: Bearer $TOKEN" | jq .

# Create test booking data
CURRENT_TIME=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
END_TIME=$(date -u -v+30M +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -d "+30 minutes" +"%Y-%m-%dT%H:%M:%S.000Z")

TEST_BOOKING='{
  "start": "'$CURRENT_TIME'",
  "end": "'$END_TIME'",
  "eventTypeId": 1,
  "eventTypeSlug": "test-service",
  "timeZone": "UTC",
  "language": "en",
  "user": "default",
  "responses": {
    "email": "test@example.com",
    "name": "Test User",
    "phone": "555-1234",
    "location": {
      "optionValue": "in_person",
      "value": "Test Location"
    }
  }
}'

# Test booking creation
echo -e "\n${YELLOW}Testing booking creation...${NC}"
echo "Using token: ${TOKEN:0:5}...${TOKEN: -5}"
echo "Request body: $TEST_BOOKING"

BOOKING_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$TEST_BOOKING" \
  http://localhost:3000/api/cal/bookings)

echo -e "\n${BLUE}Booking Response:${NC}"
echo "$BOOKING_RESPONSE" | jq . 2>/dev/null || echo "$BOOKING_RESPONSE"

# Check if response indicates success
if echo "$BOOKING_RESPONSE" | grep -q '"status":"SUCCESS"'; then
  echo -e "\n${GREEN}Booking test successful!${NC}"
else
  echo -e "\n${RED}Booking test failed${NC}"
fi

echo -e "\n${BLUE}===== Test Complete =====${NC}"
