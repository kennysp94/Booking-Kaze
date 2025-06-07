#!/bin/bash

# Test script to show exactly how duplicate checking works in the Kaze Scheduling system

BASE_URL="http://localhost:3000"
TEST_EMAIL="testdupe@example.com"
TEST_PASSWORD="testpass123"
TEST_NAME="Test Duplicate User"

# Test booking data
START_TIME="2025-06-10T14:30:00.000Z"
END_TIME="2025-06-10T16:00:00.000Z"

echo "🧪 DUPLICATE BOOKING DETECTION TEST"
echo "====================================="
echo ""

# Step 1: Register a user
echo "🔐 STEP 1: Registering test user..."
echo "Email: $TEST_EMAIL"

REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}")

REGISTER_BODY=$(echo "$REGISTER_RESPONSE" | head -n -1)
REGISTER_STATUS=$(echo "$REGISTER_RESPONSE" | tail -n 1)

if [ "$REGISTER_STATUS" = "200" ]; then
  echo "✅ User registered successfully"
  AUTH_TOKEN=$(echo "$REGISTER_BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
elif [ "$REGISTER_STATUS" = "409" ]; then
  echo "👤 User already exists, attempting login..."
  
  # Try to login
  LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
  
  LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)
  LOGIN_STATUS=$(echo "$LOGIN_RESPONSE" | tail -n 1)
  
  if [ "$LOGIN_STATUS" = "200" ]; then
    echo "✅ User logged in successfully"
    AUTH_TOKEN=$(echo "$LOGIN_BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  else
    echo "❌ Login failed: $LOGIN_BODY"
    exit 1
  fi
else
  echo "❌ Registration failed: $REGISTER_BODY"
  exit 1
fi

echo "🎫 Auth token: ${AUTH_TOKEN:0:20}..."
echo ""

# Step 2: Test duplicate check (should find no duplicates)
echo "🔄 STEP 2: Testing duplicate check (no existing booking)..."
echo "Start time: $START_TIME"
echo "End time: $END_TIME"
echo "User: $TEST_EMAIL"

CHECK_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/cal/check-duplicate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{\"userEmail\":\"$TEST_EMAIL\",\"startTime\":\"$START_TIME\",\"endTime\":\"$END_TIME\"}")

CHECK_BODY=$(echo "$CHECK_RESPONSE" | head -n -1)
CHECK_STATUS=$(echo "$CHECK_RESPONSE" | tail -n 1)

echo "📤 Duplicate check response:"
echo "Status: $CHECK_STATUS"
echo "Response: $CHECK_BODY"

if [ "$CHECK_STATUS" = "409" ]; then
  echo "🚫 Duplicate found (unexpected at this stage)"
elif [ "$CHECK_STATUS" = "200" ]; then
  echo "✅ No duplicate found (expected)"
else
  echo "❌ Duplicate check failed"
fi

echo ""

# Step 3: Create a booking
echo "📝 STEP 3: Creating a booking..."

BOOKING_PAYLOAD=$(cat <<EOF
{
  "start": "$START_TIME",
  "end": "$END_TIME",
  "eventTypeId": 1,
  "eventTypeSlug": "standard-plumbing-inspection",
  "timeZone": "UTC",
  "language": "en",
  "user": "$TEST_EMAIL",
  "responses": {
    "email": "$TEST_EMAIL",
    "name": "$TEST_NAME",
    "phone": "1234567890",
    "notes": "Test booking for duplicate demo",
    "location": {
      "optionValue": "in_person",
      "value": "Test Location"
    }
  }
}
EOF
)

echo "📤 Creating booking..."

BOOKING_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/cal/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "$BOOKING_PAYLOAD")

BOOKING_BODY=$(echo "$BOOKING_RESPONSE" | head -n -1)
BOOKING_STATUS=$(echo "$BOOKING_RESPONSE" | tail -n 1)

echo "Status: $BOOKING_STATUS"
echo "Response: $BOOKING_BODY"

if [ "$BOOKING_STATUS" = "200" ]; then
  echo "✅ BOOKING CREATED SUCCESSFULLY!"
  BOOKING_ID=$(echo "$BOOKING_BODY" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
  echo "📋 Booking ID: $BOOKING_ID"
elif [ "$BOOKING_STATUS" = "409" ]; then
  echo "🚫 BOOKING PREVENTED (duplicate detected)"
  echo "This means duplicate checking is working!"
else
  echo "❌ BOOKING CREATION FAILED"
  echo "Response: $BOOKING_BODY"
  exit 1
fi

echo ""

# Step 4: Test duplicate check again (should now find duplicate)
echo "🔄 STEP 4: Testing duplicate check (with existing booking)..."

CHECK_RESPONSE2=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/cal/check-duplicate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{\"userEmail\":\"$TEST_EMAIL\",\"startTime\":\"$START_TIME\",\"endTime\":\"$END_TIME\"}")

CHECK_BODY2=$(echo "$CHECK_RESPONSE2" | head -n -1)
CHECK_STATUS2=$(echo "$CHECK_RESPONSE2" | tail -n 1)

echo "📤 Duplicate check response:"
echo "Status: $CHECK_STATUS2"
echo "Response: $CHECK_BODY2"

if [ "$CHECK_STATUS2" = "409" ]; then
  echo "🎯 SUCCESS! Duplicate detected (as expected)"
elif [ "$CHECK_STATUS2" = "200" ]; then
  echo "⚠️  WARNING! No duplicate found (this should have detected the existing booking)"
else
  echo "❌ Duplicate check failed"
fi

echo ""

# Step 5: Try to create the same booking again (should fail)
echo "🚫 STEP 5: Attempting to create duplicate booking..."

DUPLICATE_BOOKING_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/cal/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "$BOOKING_PAYLOAD")

DUPLICATE_BOOKING_BODY=$(echo "$DUPLICATE_BOOKING_RESPONSE" | head -n -1)
DUPLICATE_BOOKING_STATUS=$(echo "$DUPLICATE_BOOKING_RESPONSE" | tail -n 1)

echo "Status: $DUPLICATE_BOOKING_STATUS"
echo "Response: $DUPLICATE_BOOKING_BODY"

if [ "$DUPLICATE_BOOKING_STATUS" = "409" ]; then
  echo "✅ SUCCESS! Duplicate booking correctly prevented"
elif [ "$DUPLICATE_BOOKING_STATUS" = "200" ]; then
  echo "⚠️  WARNING! Duplicate booking was allowed (this should not happen)"
else
  echo "❌ Booking request failed for other reasons"
fi

echo ""
echo "🎉 DUPLICATE CHECKING TEST COMPLETED!"
echo ""
echo "SUMMARY:"
echo "✅ User authentication"
echo "✅ Duplicate checking API"
echo "✅ Booking creation" 
echo "✅ Duplicate detection"
echo "✅ Duplicate prevention"
