#!/bin/bash

# Script to test both authentication systems (Web User Auth and Kaze API Auth)
# This script helps verify that the two authentication systems are working properly and separately

# Text colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Testing Both Authentication Systems =====${NC}"
echo -e "${BLUE}Web User Auth and Kaze API Auth${NC}"

# Base URL
BASE_URL=${BASE_URL:-"http://localhost:3000"}
echo "Using API URL: $BASE_URL"

# Test 1: Web User Authentication
echo -e "\n${YELLOW}1. Testing Web User Authentication...${NC}"
AUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User", "phone": "+1234567890"}' \
  -c cookies.txt)

# Extract token for direct API calls
AUTH_TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4 || echo "")

if [ -z "$AUTH_TOKEN" ]; then
  echo -e "${RED}❌ Web authentication failed${NC}"
  echo "$AUTH_RESPONSE" | jq . 2>/dev/null || echo "$AUTH_RESPONSE"
  echo -e "\nContinuing with tests but some may fail..."
else
  echo -e "${GREEN}✅ Web authentication successful${NC}"
  echo -e "Token: ${AUTH_TOKEN:0:5}...${AUTH_TOKEN: -5}"
fi

# Test 2: Kaze API Authentication (via debug endpoint)
echo -e "\n${YELLOW}2. Testing Kaze API Authentication...${NC}"
KAZE_API_TEST=$(curl -s "$BASE_URL/api/kaze/test-token")

echo "Response from Kaze API test endpoint:"
echo "$KAZE_API_TEST" | jq . 2>/dev/null || echo "$KAZE_API_TEST"

if echo "$KAZE_API_TEST" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ Kaze API authentication successful${NC}"
else
  echo -e "${RED}❌ Kaze API authentication failed${NC}"
  echo -e "Check your .env file for KAZE_API_TOKEN"
fi

# Test 3: Make a booking request (using Web Auth but triggering Kaze API Auth on the server)
echo -e "\n${YELLOW}3. Testing complete booking flow (Web Auth -> Server -> Kaze API)...${NC}"

# Create fake test booking data
TODAY=$(date +"%Y-%m-%d")
BOOKING_DATE="${TODAY}T10:00:00.000Z"
BOOKING_END="${TODAY}T11:00:00.000Z"

BOOKING_RESPONSE=$(curl -s -X POST "$BASE_URL/api/cal/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "start": "'$BOOKING_DATE'",
    "end": "'$BOOKING_END'",
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
        "value": "123 Main St, City, State"
      },
      "notes": "Testing combined authentication"
    }
  }')

echo -e "\nBooking Response:"
echo "$BOOKING_RESPONSE" | jq . 2>/dev/null || echo "$BOOKING_RESPONSE"

# Check if we can see Kaze API authentication logs in the response
if echo "$BOOKING_RESPONSE" | grep -q "KAZE_API"; then
  echo -e "${GREEN}✅ Server is using Kaze API authentication for backend communication${NC}"
else
  # If we can't find direct evidence, check for success or at least that it attempted to process
  if echo "$BOOKING_RESPONSE" | grep -q '"status":"SUCCESS"'; then
    echo -e "${GREEN}✅ Booking process successfully used both authentication systems${NC}"
  elif echo "$BOOKING_RESPONSE" | grep -q "Kaze"; then
    echo -e "${YELLOW}⚠️ Booking process attempted to use Kaze API but may have encountered an issue${NC}"
  else
    echo -e "${RED}❌ No evidence of Kaze API authentication in the booking process${NC}"
  fi
fi

echo -e "\n${BLUE}===== Test Summary =====${NC}"
echo -e "Web User Authentication: $([ ! -z "$AUTH_TOKEN" ] && echo "${GREEN}Working${NC}" || echo "${RED}Not Working${NC}")"
echo -e "Kaze API Authentication: $(echo "$KAZE_API_TEST" | grep -q '"success":true' && echo "${GREEN}Working${NC}" || echo "${RED}Not Working${NC}")"

echo -e "\n${BLUE}===== Recommendations =====${NC}"

if [ -z "$AUTH_TOKEN" ] || ! echo "$KAZE_API_TEST" | grep -q '"success":true'; then
  echo -e "${RED}Some authentication issues detected:${NC}"
  
  [ -z "$AUTH_TOKEN" ] && echo -e "- Check web authentication implementation in /lib/auth.ts"
  ! echo "$KAZE_API_TEST" | grep -q '"success":true' && echo -e "- Verify KAZE_API_TOKEN in .env file"
  
  echo -e "\nRun the following to check authentication debug info:"
  echo -e "curl $BASE_URL/api/debug/auth | jq ."
else
  echo -e "${GREEN}Both authentication systems appear to be working correctly!${NC}"
fi

# Cleanup
echo -e "\nCleaning up test files..."
rm -f cookies.txt
