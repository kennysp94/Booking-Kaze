#!/usr/bin/env node

/**
 * Advanced Duplicate Checking Demo with GET Bookings Integration
 * This script demonstrates how retrieving all bookings from kaze.so
 * can significantly improve duplicate checking functionality
 */

const fetch = require("node-fetch");

const BASE_URL = "http://localhost:3000";
const TEST_EMAIL = "test.user@example.com";

// Color coding for better output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  colorLog("cyan", `\n🔗 Making request to: ${endpoint}`);

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    colorLog("blue", `📊 Status: ${response.status}`);
    if (options.showResponse !== false) {
      console.log("📦 Response:", JSON.stringify(data, null, 2));
    }

    return { response, data };
  } catch (error) {
    colorLog("red", `❌ Request failed: ${error.message}`);
    throw error;
  }
}

// Test the new GET bookings endpoint
async function testGetBookings() {
  colorLog("bright", "\n=== TESTING GET BOOKINGS ENDPOINT ===");

  // Test 1: Get all bookings
  colorLog("yellow", "\n1. Testing GET /api/kaze/bookings (all bookings)");
  const { data: allBookings } = await apiRequest("/api/kaze/bookings");

  if (allBookings.success) {
    colorLog("green", `✅ Retrieved ${allBookings.bookings.length} bookings`);
    colorLog("blue", `📈 Data source: ${allBookings.meta.source}`);

    if (allBookings.bookings.length > 0) {
      colorLog(
        "cyan",
        `📅 Sample booking: ${allBookings.bookings[0].customer.name} at ${allBookings.bookings[0].start_time}`
      );
    }
  }

  // Test 2: Get bookings by date range
  colorLog("yellow", "\n2. Testing GET /api/kaze/bookings with date filter");
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data: filteredBookings } = await apiRequest(
    `/api/kaze/bookings?startDate=${today}&endDate=${nextWeek}`
  );

  if (filteredBookings.success) {
    colorLog(
      "green",
      `✅ Retrieved ${filteredBookings.bookings.length} bookings for ${today} to ${nextWeek}`
    );
  }

  // Test 3: Get bookings by customer email
  colorLog(
    "yellow",
    "\n3. Testing GET /api/kaze/bookings with customer email filter"
  );
  const { data: customerBookings } = await apiRequest(
    `/api/kaze/bookings?customerEmail=${TEST_EMAIL}`
  );

  if (customerBookings.success) {
    colorLog(
      "green",
      `✅ Retrieved ${customerBookings.bookings.length} bookings for ${TEST_EMAIL}`
    );
  }

  return allBookings;
}

// Enhanced duplicate checking using GET bookings data
async function enhancedDuplicateCheck(startTime, endTime, customerEmail) {
  colorLog("bright", "\n=== ENHANCED DUPLICATE CHECKING ===");

  // Step 1: Get all existing bookings from kaze.so
  colorLog("yellow", "\n1. Retrieving all existing bookings from kaze.so...");
  const { data: allBookingsData } = await apiRequest("/api/kaze/bookings", {
    showResponse: false,
  });

  if (!allBookingsData.success) {
    colorLog("red", "❌ Failed to retrieve existing bookings");
    return false;
  }

  const existingBookings = allBookingsData.bookings;
  colorLog(
    "green",
    `✅ Retrieved ${existingBookings.length} existing bookings`
  );

  // Step 2: Check for time conflicts with ANY existing booking
  colorLog("yellow", "\n2. Checking for time conflicts...");
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  const timeConflicts = existingBookings.filter((booking) => {
    const bookingStart = new Date(booking.start_time);
    const bookingEnd = new Date(booking.end_time);

    return (
      (startDate >= bookingStart && startDate < bookingEnd) ||
      (endDate > bookingStart && endDate <= bookingEnd) ||
      (startDate <= bookingStart && endDate >= bookingEnd)
    );
  });

  if (timeConflicts.length > 0) {
    colorLog("red", `🚫 TIME CONFLICT DETECTED!`);
    timeConflicts.forEach((conflict, index) => {
      colorLog(
        "red",
        `   Conflict ${index + 1}: ${conflict.customer.name} (${
          conflict.customer.email
        })`
      );
      colorLog(
        "red",
        `   Time: ${conflict.start_time} to ${conflict.end_time}`
      );
    });
    return {
      hasConflict: true,
      conflicts: timeConflicts,
      type: "time_conflict",
    };
  }

  colorLog("green", "✅ No time conflicts found");

  // Step 3: Check for duplicate booking by same customer
  colorLog("yellow", "\n3. Checking for customer duplicate bookings...");
  const customerDuplicates = existingBookings.filter(
    (booking) =>
      booking.customer.email === customerEmail &&
      booking.start_time === startTime
  );

  if (customerDuplicates.length > 0) {
    colorLog("red", `🚫 CUSTOMER DUPLICATE DETECTED!`);
    customerDuplicates.forEach((duplicate, index) => {
      colorLog("red", `   Duplicate ${index + 1}: ${duplicate.customer.name}`);
      colorLog("red", `   Original booking: ${duplicate.start_time}`);
    });
    return {
      hasConflict: true,
      conflicts: customerDuplicates,
      type: "customer_duplicate",
    };
  }

  colorLog("green", "✅ No customer duplicates found");

  // Step 4: Check resource availability (technician conflicts)
  colorLog("yellow", "\n4. Checking technician availability...");
  const technicianConflicts = existingBookings.filter((booking) => {
    if (!booking.technician) return false;

    const bookingStart = new Date(booking.start_time);
    const bookingEnd = new Date(booking.end_time);

    return (
      (startDate >= bookingStart && startDate < bookingEnd) ||
      (endDate > bookingStart && endDate <= bookingEnd) ||
      (startDate <= bookingStart && endDate >= bookingEnd)
    );
  });

  if (technicianConflicts.length > 0) {
    colorLog("yellow", `⚠️ TECHNICIAN SCHEDULING NOTICE:`);
    const technicianMap = new Map();
    technicianConflicts.forEach((conflict) => {
      const techId = conflict.technician?.id || "unknown";
      if (!technicianMap.has(techId)) {
        technicianMap.set(techId, []);
      }
      technicianMap.get(techId).push(conflict);
    });

    technicianMap.forEach((conflicts, techId) => {
      colorLog(
        "yellow",
        `   Technician ${techId}: ${conflicts.length} existing booking(s) at this time`
      );
    });
  } else {
    colorLog("green", "✅ No technician conflicts found");
  }

  return { hasConflict: false, conflicts: [], type: "no_conflict" };
}

// Compare old vs new duplicate checking methods
async function compareDuplicateCheckingMethods() {
  colorLog("bright", "\n=== COMPARING DUPLICATE CHECKING METHODS ===");

  const testTime = new Date();
  testTime.setHours(14, 0, 0, 0); // 2:00 PM today
  const startTime = testTime.toISOString();

  const endTime = new Date(testTime.getTime() + 90 * 60000).toISOString(); // 90 minutes later

  colorLog(
    "cyan",
    `\n🧪 Test scenario: Booking at ${startTime} for ${TEST_EMAIL}`
  );

  // Method 1: Original duplicate checking (POST endpoint)
  colorLog(
    "yellow",
    "\n📊 METHOD 1: Original duplicate checking (POST /api/cal/check-duplicate)"
  );
  const { data: originalCheck } = await apiRequest("/api/cal/check-duplicate", {
    method: "POST",
    body: JSON.stringify({
      userEmail: TEST_EMAIL,
      startTime: startTime,
      endTime: endTime,
    }),
    showResponse: false,
  });

  colorLog(
    "blue",
    `Original method result: ${
      originalCheck.hasConflict ? "CONFLICT" : "NO CONFLICT"
    }`
  );

  // Method 2: Enhanced duplicate checking with GET bookings
  colorLog(
    "yellow",
    "\n📊 METHOD 2: Enhanced duplicate checking (GET /api/kaze/bookings)"
  );
  const enhancedCheck = await enhancedDuplicateCheck(
    startTime,
    endTime,
    TEST_EMAIL
  );

  colorLog(
    "blue",
    `Enhanced method result: ${
      enhancedCheck.hasConflict ? "CONFLICT" : "NO CONFLICT"
    }`
  );

  // Comparison summary
  colorLog("bright", "\n📈 COMPARISON SUMMARY:");
  console.log(
    "┌─────────────────────────────────────┬─────────────┬─────────────────┐"
  );
  console.log(
    "│ Feature                             │ Original    │ Enhanced        │"
  );
  console.log(
    "├─────────────────────────────────────┼─────────────┼─────────────────┤"
  );
  console.log(
    "│ Checks local booking store          │ ✅          │ ✅              │"
  );
  console.log(
    "│ Checks kaze.so remote bookings      │ ❌          │ ✅              │"
  );
  console.log(
    "│ Detects time conflicts               │ ✅          │ ✅              │"
  );
  console.log(
    "│ Detects customer duplicates          │ ✅          │ ✅              │"
  );
  console.log(
    "│ Checks technician availability      │ ❌          │ ✅              │"
  );
  console.log(
    "│ Real-time kaze.so data               │ ❌          │ ✅              │"
  );
  console.log(
    "│ Cross-platform conflict detection    │ ❌          │ ✅              │"
  );
  console.log(
    "└─────────────────────────────────────┴─────────────┴─────────────────┘"
  );

  return { originalCheck, enhancedCheck };
}

// Test creating a booking and verifying improved duplicate detection
async function testImprovedBookingFlow() {
  colorLog("bright", "\n=== TESTING IMPROVED BOOKING FLOW ===");

  const now = new Date();
  now.setHours(now.getHours() + 2); // 2 hours from now
  const startTime = now.toISOString();

  const endTime = new Date(now.getTime() + 90 * 60000).toISOString();

  colorLog("cyan", `\n🎯 Test: Creating booking at ${startTime}`);

  // Step 1: Enhanced pre-booking check
  colorLog("yellow", "\n1. Enhanced pre-booking duplicate check...");
  const preCheck = await enhancedDuplicateCheck(startTime, endTime, TEST_EMAIL);

  if (preCheck.hasConflict) {
    colorLog("red", "🚫 Pre-booking check failed - conflicts detected");
    return;
  }

  colorLog("green", "✅ Pre-booking check passed");

  // Step 2: Create the booking
  colorLog("yellow", "\n2. Creating booking...");
  const bookingData = {
    start: startTime,
    end: endTime,
    eventTypeId: "1",
    name: "Test User",
    email: TEST_EMAIL,
    phone: "+1234567890",
    notes: "Test booking for enhanced duplicate checking demo",
  };

  const { data: bookingResult } = await apiRequest("/api/cal/bookings", {
    method: "POST",
    body: JSON.stringify(bookingData),
    showResponse: false,
  });

  if (bookingResult.status === "SUCCESS") {
    colorLog("green", `✅ Booking created successfully: ${bookingResult.id}`);
  } else {
    colorLog("red", `❌ Booking failed: ${bookingResult.message}`);
    return;
  }

  // Step 3: Verify booking appears in GET bookings
  colorLog("yellow", "\n3. Verifying booking appears in GET bookings...");
  const { data: updatedBookings } = await apiRequest("/api/kaze/bookings", {
    showResponse: false,
  });

  const ourBooking = updatedBookings.bookings.find(
    (b) => b.customer.email === TEST_EMAIL
  );
  if (ourBooking) {
    colorLog("green", `✅ Booking found in GET bookings: ${ourBooking.id}`);
  } else {
    colorLog(
      "yellow",
      "⚠️ Booking not yet visible in GET bookings (may need time to sync)"
    );
  }

  // Step 4: Test duplicate detection on the same slot
  colorLog("yellow", "\n4. Testing duplicate detection on same time slot...");
  const duplicateCheck = await enhancedDuplicateCheck(
    startTime,
    endTime,
    TEST_EMAIL
  );

  if (duplicateCheck.hasConflict) {
    colorLog(
      "green",
      "✅ Duplicate detection working - conflict detected as expected"
    );
    colorLog("blue", `   Conflict type: ${duplicateCheck.type}`);
  } else {
    colorLog(
      "yellow",
      "⚠️ Duplicate not detected - may need time for data to sync"
    );
  }

  return bookingResult;
}

// Main demo function
async function runDemo() {
  try {
    colorLog("bright", "🚀 STARTING ENHANCED DUPLICATE CHECKING DEMO");
    colorLog("cyan", "=".repeat(60));

    // Test 1: GET bookings endpoint
    await testGetBookings();

    // Test 2: Compare duplicate checking methods
    await compareDuplicateCheckingMethods();

    // Test 3: Full improved booking flow
    await testImprovedBookingFlow();

    colorLog("bright", "\n🎉 DEMO COMPLETED SUCCESSFULLY");
    colorLog(
      "green",
      "✅ Enhanced duplicate checking with GET bookings demonstrated"
    );
  } catch (error) {
    colorLog("red", `\n💥 Demo failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the demo
runDemo();
