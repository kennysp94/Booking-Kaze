// Simple script to test authentication token handling in the browser

// Function to check if token is in localStorage
function checkLocalStorageToken() {
  const token = localStorage.getItem("kaze_token");
  const user = localStorage.getItem("kaze_user");

  console.log(
    "Token in localStorage:",
    token
      ? `${token.substring(0, 5)}...${token.substring(token.length - 5)}`
      : "None"
  );
  console.log("User in localStorage:", user ? JSON.parse(user).email : "None");

  return { token, user: user ? JSON.parse(user) : null };
}

// Function to make an authenticated API request
async function testAuthenticatedRequest() {
  try {
    const { token } = checkLocalStorageToken();

    if (!token) {
      console.error("No authentication token found. Please log in first.");
      return;
    }

    // Test headers being sent
    console.log("Testing authenticated request with authFetch...");
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${token}`);

    // First, test the debug endpoint
    const debugResponse = await fetch("/api/debug/auth", {
      headers,
      credentials: "include",
    });

    const debugData = await debugResponse.json();
    console.log("Auth Debug Response:", debugData);

    // Then, test the actual bookings endpoint with a mock request
    const mockBookingData = {
      start: new Date().toISOString(),
      end: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      eventTypeId: "1",
      eventTypeSlug: "test-service",
      responses: {
        name: "Test User",
        email: "test@example.com",
      },
    };

    const bookingResponse = await fetch("/api/cal/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify(mockBookingData),
    });

    const bookingResult = await bookingResponse.json();
    console.log("Booking Test Response:", bookingResult);

    return { debugData, bookingResult };
  } catch (error) {
    console.error("Authentication test failed:", error);
    return { error: error.message };
  }
}

// Run the test if this script is executed directly
if (typeof window !== "undefined") {
  console.log("Running authentication token test...");
  const tokenInfo = checkLocalStorageToken();

  if (tokenInfo.token) {
    testAuthenticatedRequest().then((results) => {
      console.log("Authentication test completed.");
    });
  } else {
    console.log("Please log in before running this test.");
  }
}

// Export functions for use elsewhere
export { checkLocalStorageToken, testAuthenticatedRequest };
