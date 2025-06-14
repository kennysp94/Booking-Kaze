#!/usr/bin/env node

/**
 * Simple test script for Kaze API availability endpoint
 */

const {
  kazeRealAvailabilityService,
} = require("./lib/kaze-real-availability.ts");

async function testKazeAPI() {
  console.log("🧪 Testing Kaze API availability service...");

  // Test date: June 13, 2025 (as mentioned in the conversation)
  const testDate = "2025-06-13";

  try {
    console.log(`📅 Testing availability for date: ${testDate}`);

    const result = await kazeRealAvailabilityService.getRealAvailabilityForDate(
      testDate
    );

    console.log("✅ Kaze API Test Results:");
    console.log(`- Date: ${result.date}`);
    console.log(`- Total slots: ${result.total}`);
    console.log(`- Available slots: ${result.available}`);
    console.log(`- Kaze jobs found: ${result.kazeJobs.length}`);
    console.log(
      `- Business hours: ${result.businessHours.start} - ${result.businessHours.end} (${result.businessHours.timezone})`
    );

    if (result.slots.length > 0) {
      console.log("\n📋 Sample slots:");
      result.slots.slice(0, 5).forEach((slot, index) => {
        const startTime = new Date(slot.start).toLocaleString("fr-FR");
        const endTime = new Date(slot.end).toLocaleString("fr-FR");
        console.log(
          `  ${index + 1}. ${startTime} - ${endTime} (${
            slot.available ? "Available" : "Booked"
          })`
        );
      });
    }

    if (result.kazeJobs.length > 0) {
      console.log("\n🔧 Kaze jobs found:");
      result.kazeJobs.forEach((job, index) => {
        console.log(
          `  ${index + 1}. Job ID: ${job.id}, Status: ${job.status}, Due: ${
            job.due_date
          } ${job.due_time || ""}`
        );
      });
    }
  } catch (error) {
    console.error("❌ Kaze API Test Failed:", error.message);
    console.error("Error details:", error);
  }
}

// Run the test
testKazeAPI();
