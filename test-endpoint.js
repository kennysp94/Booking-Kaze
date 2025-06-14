/**
 * Simple test to verify the Kaze availability API endpoint
 */

const path = require("path");

// Test the availability endpoint logic
async function testAvailabilityEndpoint() {
  console.log("🧪 Testing Kaze availability endpoint logic...");

  try {
    // Import the availability service (adjust path as needed)
    const { kazeRealAvailabilityService } = await import(
      "./lib/kaze-real-availability.js"
    );

    const testDate = "2025-06-13";
    console.log(`📅 Testing for date: ${testDate}`);

    // Test the service directly
    const result = await kazeRealAvailabilityService.getRealAvailabilityForDate(
      testDate
    );

    console.log("✅ Service Test Results:");
    console.log(`- Total slots generated: ${result.total}`);
    console.log(`- Available slots: ${result.available}`);
    console.log(`- Kaze jobs found: ${result.kazeJobs?.length || 0}`);
    console.log(
      `- Business hours: ${result.businessHours.start} - ${result.businessHours.end}`
    );

    if (result.slots.length > 0) {
      console.log("\n📋 First 3 time slots:");
      result.slots.slice(0, 3).forEach((slot, index) => {
        const start = new Date(slot.start).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const end = new Date(slot.end).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        console.log(
          `  ${index + 1}. ${start} - ${end} (${
            slot.available ? "✅ Available" : "❌ Booked"
          })`
        );
      });
    }

    return true;
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    return false;
  }
}

// Run the test
testAvailabilityEndpoint().then((success) => {
  if (success) {
    console.log("\n🎉 Kaze API endpoint logic is working!");
  } else {
    console.log("\n💥 Kaze API endpoint has issues that need fixing.");
  }
});
