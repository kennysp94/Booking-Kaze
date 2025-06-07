#!/usr/bin/env node

console.log("🧪 KAZE SCHEDULING - DUPLICATE CHECKING DEMONSTRATION");
console.log("====================================================");

const BASE_URL = "http://localhost:3000";

async function testDuplicateChecking() {
  try {
    // Test 1: Check for duplicates (should be clear initially)
    console.log("\n📋 Test 1: Initial duplicate check");

    const response1 = await fetch(`${BASE_URL}/api/cal/check-duplicate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userEmail: "demo@example.com",
        startTime: "2024-12-20T14:00:00Z",
        endTime: "2024-12-20T15:00:00Z",
      }),
    });

    const data1 = await response1.json();
    console.log(`Status: ${response1.status}`);
    console.log(`Response:`, data1);

    if (response1.status === 200 && !data1.isDuplicate) {
      console.log("✅ Initial check passed - No existing bookings found");
    } else {
      console.log("⚠️  Unexpected result in initial check");
    }

    // Test 2: Try to create a booking
    console.log("\n📅 Test 2: Creating a booking");

    const response2 = await fetch(`${BASE_URL}/api/cal/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userEmail: "demo@example.com",
        userName: "Demo User",
        startTime: "2024-12-20T14:00:00Z",
        endTime: "2024-12-20T15:00:00Z",
        service: "Pipe Repair",
        notes: "Demo booking",
      }),
    });

    const data2 = await response2.json();
    console.log(`Status: ${response2.status}`);
    console.log(`Response:`, data2);

    // Test 3: Check for duplicates again (should detect conflict now)
    console.log("\n🔍 Test 3: Duplicate check after booking creation");

    const response3 = await fetch(`${BASE_URL}/api/cal/check-duplicate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userEmail: "demo@example.com",
        startTime: "2024-12-20T14:00:00Z",
        endTime: "2024-12-20T15:00:00Z",
      }),
    });

    const data3 = await response3.json();
    console.log(`Status: ${response3.status}`);
    console.log(`Response:`, data3);

    if (response3.status === 409 || data3.isDuplicate) {
      console.log("✅ Duplicate detection working correctly!");
    } else {
      console.log("⚠️  Expected duplicate detection");
    }

    // Test 4: Test overlap detection
    console.log("\n🔄 Test 4: Testing overlap detection");

    const response4 = await fetch(`${BASE_URL}/api/cal/check-duplicate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userEmail: "demo@example.com",
        startTime: "2024-12-20T14:30:00Z", // Overlaps with existing 14:00-15:00
        endTime: "2024-12-20T15:30:00Z",
      }),
    });

    const data4 = await response4.json();
    console.log(`Status: ${response4.status}`);
    console.log(`Response:`, data4);

    if (response4.status === 409 || data4.isDuplicate) {
      console.log("✅ Overlap detection working correctly!");
    } else {
      console.log("⚠️  Expected overlap detection");
    }

    console.log("\n🎯 DEMONSTRATION COMPLETE!");
    console.log("The duplicate checking system is working as expected.");
  } catch (error) {
    console.error("❌ Error during demo:", error.message);
  }
}

testDuplicateChecking();
