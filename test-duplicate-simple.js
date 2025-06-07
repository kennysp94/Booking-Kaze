const fetch = require("node-fetch");

const BASE_URL = "http://localhost:3000";

async function testDuplicateChecking() {
  console.log("🧪 DUPLICATE BOOKING DETECTION TEST");
  console.log("=====================================\n");

  try {
    // Step 1: Register a test user
    console.log("🔐 STEP 1: Registering test user...");
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "testdupe@example.com",
        password: "testpass123",
        name: "Test Duplicate User",
      }),
    });

    let authToken;
    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      authToken = registerData.token;
      console.log("✅ User registered successfully");
    } else {
      // Try login if user exists
      console.log("👤 User exists, trying login...");
      const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "testdupe@example.com",
          password: "testpass123",
        }),
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        authToken = loginData.token;
        console.log("✅ User logged in successfully");
      } else {
        throw new Error("Authentication failed");
      }
    }

    console.log(`🎫 Auth token: ${authToken.substring(0, 20)}...\n`);

    // Step 2: Test duplicate check (should find no duplicates)
    console.log("🔄 STEP 2: Testing duplicate check (no existing booking)...");

    const testDate = new Date("2025-06-10T14:30:00.000Z"); // Future date
    const endTime = new Date(testDate.getTime() + 90 * 60 * 1000); // 90 minutes later

    const duplicateCheckPayload = {
      userEmail: "testdupe@example.com",
      startTime: testDate.toISOString(),
      endTime: endTime.toISOString(),
    };

    console.log("📤 Sending duplicate check request:");
    console.log(`   Start: ${testDate.toISOString()}`);
    console.log(`   End: ${endTime.toISOString()}`);
    console.log(`   User: testdupe@example.com`);

    const duplicateResponse1 = await fetch(
      `${BASE_URL}/api/cal/check-duplicate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(duplicateCheckPayload),
      }
    );

    const duplicateResult1 = await duplicateResponse1.json();

    if (duplicateResponse1.status === 409) {
      console.log("🚫 Duplicate found (unexpected at this stage)");
      console.log("Response:", duplicateResult1);
    } else if (duplicateResponse1.ok) {
      console.log("✅ No duplicate found (expected)");
      console.log("Response:", duplicateResult1);
    } else {
      console.log("❌ Duplicate check failed");
      console.log("Response:", duplicateResult1);
    }

    // Step 3: Create a booking
    console.log("\n📝 STEP 3: Creating a booking...");

    const bookingPayload = {
      start: testDate.toISOString(),
      end: endTime.toISOString(),
      eventTypeId: 1,
      eventTypeSlug: "standard-plumbing-inspection",
      timeZone: "UTC",
      language: "en",
      user: "testdupe@example.com",
      responses: {
        email: "testdupe@example.com",
        name: "Test Duplicate User",
        phone: "1234567890",
        notes: "Test booking for duplicate demo",
        location: {
          optionValue: "in_person",
          value: "Test Location",
        },
      },
    };

    console.log("📤 Creating booking...");

    const bookingResponse = await fetch(`${BASE_URL}/api/cal/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(bookingPayload),
    });

    const bookingResult = await bookingResponse.json();

    if (bookingResponse.ok) {
      console.log("✅ BOOKING CREATED SUCCESSFULLY!");
      console.log(`📋 Booking ID: ${bookingResult.booking?.id}`);
    } else {
      console.log("❌ BOOKING CREATION FAILED");
      console.log("Response:", bookingResult);
      return;
    }

    // Step 4: Test duplicate check again (should now find duplicate)
    console.log(
      "\n🔄 STEP 4: Testing duplicate check (with existing booking)..."
    );

    const duplicateResponse2 = await fetch(
      `${BASE_URL}/api/cal/check-duplicate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(duplicateCheckPayload),
      }
    );

    const duplicateResult2 = await duplicateResponse2.json();

    if (duplicateResponse2.status === 409) {
      console.log("🎯 SUCCESS! Duplicate detected (as expected)");
      console.log("Response:", duplicateResult2);
    } else if (duplicateResponse2.ok) {
      console.log(
        "⚠️  WARNING! No duplicate found (this should have detected the existing booking)"
      );
      console.log("Response:", duplicateResult2);
    } else {
      console.log("❌ Duplicate check failed");
      console.log("Response:", duplicateResult2);
    }

    // Step 5: Try to create the same booking again (should fail)
    console.log("\n🚫 STEP 5: Attempting to create duplicate booking...");

    const duplicateBookingResponse = await fetch(
      `${BASE_URL}/api/cal/bookings`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(bookingPayload),
      }
    );

    const duplicateBookingResult = await duplicateBookingResponse.json();

    if (duplicateBookingResponse.status === 409) {
      console.log("✅ SUCCESS! Duplicate booking correctly prevented");
      console.log("Response:", duplicateBookingResult);
    } else if (duplicateBookingResponse.ok) {
      console.log(
        "⚠️  WARNING! Duplicate booking was allowed (this should not happen)"
      );
      console.log("Response:", duplicateBookingResult);
    } else {
      console.log("❌ Booking request failed for other reasons");
      console.log("Response:", duplicateBookingResult);
    }

    console.log("\n🎉 DUPLICATE CHECKING TEST COMPLETED!");
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

testDuplicateChecking();
