#!/bin/bash

# Text colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Testing Complete Booking Flow with Authentication${NC}"
echo -e "${BLUE}==================================================${NC}"

# Base URL: Default to localhost:3000 if the port isn't specified
BASE_URL=${BASE_URL:-"http://localhost:3000"}
echo "Using API URL: $BASE_URL"

# Clean up any existing test cookies
rm -f cookies.txt
rm -f debug-cookies.txt

# Test 1: User Authentication
echo -e "\n${YELLOW}1. Testing User Authentication...${NC}"
AUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "john.doe@example.com", "name": "John Doe", "phone": "+1234567890"}' \
  -c cookies.txt)

# Extract token for direct API calls
AUTH_TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Auth Response:"
echo "$AUTH_RESPONSE" | jq . 2>/dev/null || echo "$AUTH_RESPONSE"
echo -e "Token: ${AUTH_TOKEN:0:5}...${AUTH_TOKEN: -5}"

# Save token for later use in other scripts or debugging
echo "$AUTH_TOKEN" > fresh-session.txt

# Check if login was successful
if echo "$AUTH_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ Authentication successful${NC}"
else
  echo -e "${RED}❌ Authentication failed${NC}"
  exit 1
fi

# Debug: Check cookies that were set
echo -e "\n${YELLOW}Cookies received from login:${NC}"
cat cookies.txt

# Debug: Check auth debug endpoint
echo -e "\n${YELLOW}Checking auth debug info (after login)...${NC}"
AUTH_DEBUG=$(curl -s "$BASE_URL/api/debug/auth" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -b cookies.txt -c debug-cookies.txt)
echo "$AUTH_DEBUG" | jq . 2>/dev/null || echo "$AUTH_DEBUG"

# Test 2: Check Current User with both cookie and token
echo -e "\n${YELLOW}2. Testing Current User Check...${NC}"
echo -e "2a. Using cookies:"
USER_CHECK_COOKIE=$(curl -s -X GET "$BASE_URL/api/auth/me" -b cookies.txt)
echo "$USER_CHECK_COOKIE" | jq . 2>/dev/null || echo "$USER_CHECK_COOKIE"

echo -e "\n2b. Using token in Authorization header:"
USER_CHECK_TOKEN=$(curl -s -X GET "$BASE_URL/api/auth/me" -H "Authorization: Bearer $AUTH_TOKEN")
echo "$USER_CHECK_TOKEN" | jq . 2>/dev/null || echo "$USER_CHECK_TOKEN"

# Test 3: Check Slot Availability
echo -e "\n${YELLOW}3. Testing Slot Availability Check...${NC}"
SLOT_CHECK=$(curl -s -X POST "$BASE_URL/api/cal/bookings/check" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -b cookies.txt \
  -d '{"date": "2025-06-10", "time": "10:00 AM", "eventTypeId": 1}')

echo "$SLOT_CHECK" | jq . 2>/dev/null || echo "$SLOT_CHECK"

# Use today's date for the booking to ensure it works with current date validation
TODAY=$(date +"%Y-%m-%d")
BOOKING_DATE="${TODAY}T10:00:00.000Z"
BOOKING_END="${TODAY}T11:00:00.000Z"

# Test 4: Create Booking
echo -e "\n${YELLOW}4. Testing Booking Creation...${NC}"
echo -e "Using start time: ${BOOKING_DATE}"
echo -e "Using end time: ${BOOKING_END}"

# Create booking with token in header
echo -e "\n4a. Using token in Authorization header:"
BOOKING_RESPONSE_TOKEN=$(curl -v -X POST "$BASE_URL/api/cal/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "start": "'$BOOKING_DATE'",
    "end": "'$BOOKING_END'",
    "eventTypeId": 1,
    "eventTypeSlug": "general-service",
    "timeZone": "UTC",
    "language": "en",
    "user": "john.doe@example.com",
    "responses": {
      "email": "john.doe@example.com",
      "name": "John Doe",
      "phone": "+1234567890",
      "location": {
        "value": "123 Main St, City, State"
      },
      "notes": "Test booking with token auth"
    }
  }' 2>&1 | grep -v "^*" | grep -v "^}" | grep -v "^<"  # Filter out curl verbose output)

echo -e "\nToken Booking Response:"
echo "$BOOKING_RESPONSE_TOKEN" | grep -v "^{" | grep -v "^}" | jq . 2>/dev/null || echo "$BOOKING_RESPONSE_TOKEN"

# Create booking with cookie auth as fallback
echo -e "\n4b. Using cookies for authentication:"
BOOKING_RESPONSE_COOKIE=$(curl -s -X POST "$BASE_URL/api/cal/bookings" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "start": "'$BOOKING_DATE'",
    "end": "'$BOOKING_END'",
    "eventTypeId": 2,
    "eventTypeSlug": "consultation",
    "timeZone": "UTC",
    "language": "en",
    "user": "john.doe@example.com",
    "responses": {
      "email": "john.doe@example.com",
      "name": "John Doe",
      "phone": "+1234567890",
      "location": {
        "value": "123 Main St, City, State"
      },
      "notes": "Test booking with cookie auth"
    }
  }')

echo -e "\nCookie Booking Response:"
echo "$BOOKING_RESPONSE_COOKIE" | jq . 2>/dev/null || echo "$BOOKING_RESPONSE_COOKIE"

# Check if either booking was successful
TOKEN_SUCCESS=$(echo "$BOOKING_RESPONSE_TOKEN" | grep -q '"status":"SUCCESS"' && echo "true" || echo "false")
COOKIE_SUCCESS=$(echo "$BOOKING_RESPONSE_COOKIE" | grep -q '"status":"SUCCESS"' && echo "true" || echo "false")

if [ "$TOKEN_SUCCESS" == "true" ]; then
  echo -e "${GREEN}✅ Booking with token authentication successful${NC}"
  BOOKING_METHOD="TOKEN"
elif [ "$COOKIE_SUCCESS" == "true" ]; then
  echo -e "${GREEN}✅ Booking with cookie authentication successful${NC}"
  BOOKING_METHOD="COOKIE"
else
  echo -e "${RED}❌ Both booking methods failed${NC}"
  echo -e "${YELLOW}Let's check authentication status again to identify the issue:${NC}"
  
  AUTH_DEBUG2=$(curl -s "$BASE_URL/api/debug/auth" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -b cookies.txt)
  echo "$AUTH_DEBUG2" | jq . 2>/dev/null || echo "$AUTH_DEBUG2"
  
  exit 1
fi

# Test 5: Check if slot is now unavailable
echo -e "\n${YELLOW}5. Testing Duplicate Booking Prevention...${NC}"
DUPLICATE_CHECK=$(curl -s -X POST "$BASE_URL/api/cal/bookings/check" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"date": "'$TODAY'", "time": "10:00 AM", "eventTypeId": 1}')

echo "Duplicate Check: $DUPLICATE_CHECK"

if echo "$DUPLICATE_CHECK" | grep -q '"isAvailable":false'; then
  echo -e "${GREEN}✅ Duplicate booking prevention working${NC}"
else
  echo -e "${YELLOW}⚠️  Duplicate booking prevention may not be working${NC}"
fi

# Test 6: Try duplicate booking by same user
echo -e "\n${YELLOW}6. Testing Same User Duplicate Booking Prevention...${NC}"
DUPLICATE_BOOKING=$(curl -s -X POST "$BASE_URL/api/cal/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "start": "'$BOOKING_DATE'",
    "end": "'$BOOKING_END'",
    "eventTypeId": 1,
    "eventTypeSlug": "general-service",
    "timeZone": "UTC",
    "language": "en",
    "user": "john.doe@example.com",
    "responses": {
      "email": "john.doe@example.com",
      "name": "John Doe",
      "phone": "+1234567890",
      "location": {
        "value": "123 Main St, City, State"
      },
      "notes": "Duplicate test booking"
    }
  }')

echo -e "Duplicate Booking Response:"
echo "$DUPLICATE_BOOKING" | jq . 2>/dev/null || echo "$DUPLICATE_BOOKING"

if echo "$DUPLICATE_BOOKING" | grep -q '"code":"DUPLICATE_BOOKING"'; then
  echo -e "${GREEN}✅ Same user duplicate booking prevention working${NC}"
else
  echo -e "${YELLOW}⚠️  Same user duplicate booking prevention may not be working${NC}"
fi

# Test 7: Logout
echo -e "\n${YELLOW}7. Testing Logout...${NC}"
LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/logout" -b cookies.txt)
echo "Logout Response:" 
echo "$LOGOUT_RESPONSE" | jq . 2>/dev/null || echo "$LOGOUT_RESPONSE"

if echo "$LOGOUT_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ Logout successful${NC}"
else
  echo -e "${RED}❌ Logout failed${NC}"
fi

# Test 8: Try booking without authentication
echo -e "\n${YELLOW}8. Testing Booking Without Authentication...${NC}"
NEW_DATE="${TODAY}T14:00:00.000Z" # Use a different time to avoid conflict
NEW_END="${TODAY}T15:00:00.000Z"

UNAUTH_BOOKING=$(curl -s -X POST "$BASE_URL/api/cal/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "start": "'$NEW_DATE'",
    "end": "'$NEW_END'",
    "eventTypeId": 1,
    "eventTypeSlug": "general-service",
    "timeZone": "UTC",
    "language": "en",
    "user": "test@example.com",
    "responses": {
      "email": "test@example.com",
      "name": "Test User",
      "phone": "+1234567890",
      "location": {
        "value": "456 Oak St, City, State"
      }
    }
  }')

echo "Unauthenticated Booking Response:"
echo "$UNAUTH_BOOKING" | jq . 2>/dev/null || echo "$UNAUTH_BOOKING"

if echo "$UNAUTH_BOOKING" | grep -q '"code":"AUTHENTICATION_REQUIRED"'; then
  echo -e "${GREEN}✅ Authentication requirement working${NC}"
else
  echo -e "${RED}⚠️  Authentication requirement NOT working - should require login${NC}"
fi

# Test 9: Authentication Summary
echo -e "\n${YELLOW}9. Authentication Summary${NC}"
echo "✓ Authentication Method Used: $BOOKING_METHOD"
echo "✓ Token Authentication: $([ "$TOKEN_SUCCESS" == "true" ] && echo "${GREEN}Working${NC}" || echo "${RED}Not Working${NC}")"
echo "✓ Cookie Authentication: $([ "$COOKIE_SUCCESS" == "true" ] && echo "${GREEN}Working${NC}" || echo "${RED}Not Working${NC}")"

# Keep test results
mv cookies.txt cookies-test-results.txt
mv debug-cookies.txt debug-cookies-test-results.txt

echo -e "\n${BLUE}🎉 End-to-End Testing Complete!${NC}"
echo -e "${BLUE}==================================================${NC}"

# Final recommendation based on test results
echo -e "\n${YELLOW}TEST CONCLUSION:${NC}"
if [ "$TOKEN_SUCCESS" == "true" ] || [ "$COOKIE_SUCCESS" == "true" ]; then
  echo -e "${GREEN}Authentication system is working via $([ "$TOKEN_SUCCESS" == "true" ] && echo "token" || echo "cookie") method.${NC}"
else
  echo -e "${RED}Authentication system is NOT working. Please check server logs and session handling.${NC}"
fi
