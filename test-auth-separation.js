/**
 * Authentication Separation Test Script
 *
 * This script tests the separation of Web User Authentication and Kaze API Authentication.
 * It demonstrates:
 * 1. How web users authenticate to get access to booking functionality
 * 2. How the server uses Kaze API tokens to communicate with Kaze backend
 * 3. Why these two systems are separate and how they work together
 */

// Step 1: Get query param for testing mode
const urlParams = new URLSearchParams(window.location.search);
const testMode = urlParams.get("test-mode") || "report";

// Track the test results
const results = {
  webAuth: {
    success: false,
    token: null,
    user: null,
    error: null,
  },
  kazeApiTest: {
    success: false,
    message: null,
    error: null,
  },
};

/**
 * Test the web user authentication
 */
async function testWebUserAuth() {
  console.log("=== TESTING WEB USER AUTHENTICATION ===");

  try {
    // Get authentication token from localStorage
    const token = localStorage.getItem("kaze_token");
    results.webAuth.token = token
      ? token.substring(0, 5) + "..." + token.substring(token.length - 5)
      : null;

    // Try to get user info using the token
    if (!token) {
      throw new Error("No authentication token found in localStorage");
    }

    // Validate token by fetching user info
    const response = await fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Auth validation failed: ${response.status} ${response.statusText}`
      );
    }

    const userData = await response.json();

    if (!userData.user) {
      throw new Error("Auth response missing user data");
    }

    results.webAuth.user = {
      id: userData.user.id,
      email: userData.user.email,
      name: userData.user.name,
    };
    results.webAuth.success = true;

    console.log("✅ Web user authentication successful");
    console.log("User:", results.webAuth.user);
  } catch (error) {
    console.error("❌ Web user authentication failed:", error);
    results.webAuth.error = error.message;
    results.webAuth.success = false;
  }
}

/**
 * Test the Kaze API authentication (server-side only)
 */
async function testKazeApiAuth() {
  console.log("=== TESTING KAZE API AUTHENTICATION ===");
  console.log("Note: Only the server can access the KAZE_API_TOKEN");

  try {
    // This endpoint tests the server's ability to authenticate with Kaze
    // It doesn't use or need the web user authentication token
    const response = await fetch("/api/kaze/test-token");

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      results.kazeApiTest.success = true;
      results.kazeApiTest.message = data.message;
      console.log("✅ Kaze API token test successful");
      console.log("Message:", data.message);
    } else {
      throw new Error(data.error || "Unknown error testing Kaze API token");
    }
  } catch (error) {
    console.error("❌ Kaze API token test failed:", error);
    results.kazeApiTest.error = error.message;
    results.kazeApiTest.success = false;
  }
}

/**
 * Display the test results in the DOM
 */
function displayResults() {
  // Create results container
  const container = document.createElement("div");
  container.style.padding = "20px";
  container.style.maxWidth = "800px";
  container.style.margin = "0 auto";
  container.style.fontFamily = "system-ui, sans-serif";

  // Add title
  const title = document.createElement("h1");
  title.textContent = "Authentication Systems Test Results";
  container.appendChild(title);

  // Add description
  const description = document.createElement("p");
  description.innerHTML = `
    This test verifies that both authentication systems are working properly:<br>
    1. <strong>Web User Authentication</strong>: Identifies users in the web app<br>
    2. <strong>Kaze API Authentication</strong>: Server-to-server communication with Kaze backend
  `;
  container.appendChild(description);

  // Add separator
  const separator = document.createElement("hr");
  container.appendChild(separator);

  // Web Auth Results
  const webAuthTitle = document.createElement("h2");
  webAuthTitle.textContent = "Web User Authentication";
  container.appendChild(webAuthTitle);

  const webAuthStatus = document.createElement("div");
  webAuthStatus.style.padding = "10px";
  webAuthStatus.style.marginBottom = "20px";
  webAuthStatus.style.borderRadius = "4px";

  if (results.webAuth.success) {
    webAuthStatus.style.backgroundColor = "#d4edda";
    webAuthStatus.style.color = "#155724";
    webAuthStatus.innerHTML = `
      <strong>SUCCESS</strong><br>
      User: ${results.webAuth.user.name} (${results.webAuth.user.email})<br>
      Token: ${results.webAuth.token}
    `;
  } else {
    webAuthStatus.style.backgroundColor = "#f8d7da";
    webAuthStatus.style.color = "#721c24";
    webAuthStatus.innerHTML = `
      <strong>FAILED</strong><br>
      Error: ${results.webAuth.error}<br>
      Token: ${results.webAuth.token || "Not found"}
    `;
  }
  container.appendChild(webAuthStatus);

  // Kaze API Auth Results
  const kazeApiTitle = document.createElement("h2");
  kazeApiTitle.textContent = "Kaze API Authentication";
  container.appendChild(kazeApiTitle);

  const kazeApiStatus = document.createElement("div");
  kazeApiStatus.style.padding = "10px";
  kazeApiStatus.style.marginBottom = "20px";
  kazeApiStatus.style.borderRadius = "4px";

  if (results.kazeApiTest.success) {
    kazeApiStatus.style.backgroundColor = "#d4edda";
    kazeApiStatus.style.color = "#155724";
    kazeApiStatus.innerHTML = `
      <strong>SUCCESS</strong><br>
      Message: ${results.kazeApiTest.message}
    `;
  } else {
    kazeApiStatus.style.backgroundColor = "#f8d7da";
    kazeApiStatus.style.color = "#721c24";
    kazeApiStatus.innerHTML = `
      <strong>FAILED</strong><br>
      Error: ${results.kazeApiTest.error}
    `;
  }
  container.appendChild(kazeApiStatus);

  // System explanation
  const explanation = document.createElement("div");
  explanation.style.backgroundColor = "#e2e3e5";
  explanation.style.padding = "15px";
  explanation.style.borderRadius = "4px";
  explanation.style.marginTop = "20px";
  explanation.innerHTML = `
    <h3>How the Authentication Systems Work Together</h3>
    <p>
      The booking process uses both authentication systems:
    </p>
    <ol>
      <li><strong>Web User Authentication</strong> - When a user clicks "Book", their web authentication token is sent to verify their identity.</li>
      <li><strong>Server Processing</strong> - The server validates the user and processes booking details.</li>
      <li><strong>Kaze API Communication</strong> - The server then uses the KAZE_API_TOKEN (separate from user auth) to send the booking to Kaze.</li>
    </ol>
    <p>
      <strong>Important:</strong> The user's web authentication token is NEVER used to communicate with the Kaze API.
      Only the server-side KAZE_API_TOKEN (stored in environment variables) is used for Kaze API requests.
    </p>
  `;
  container.appendChild(explanation);

  // Append to body
  document.body.innerHTML = "";
  document.body.appendChild(container);
}

// Run the tests
async function runTests() {
  await testWebUserAuth();
  await testKazeApiAuth();
  displayResults();
}

// Run tests when the page loads
runTests();
