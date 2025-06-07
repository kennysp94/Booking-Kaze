/**
 * Utility to validate and work with the Kaze API token
 */

/**
 * Clean and validate Kaze API token
 */
export function getCleanKazeToken(): {
  token: string | null;
  issues: string[];
} {
  const token = process.env.KAZE_API_TOKEN;
  const issues: string[] = [];

  if (!token) {
    return {
      token: null,
      issues: ["KAZE_API_TOKEN is not defined in environment variables"],
    };
  }

  // Clean the token
  const cleanToken = token.trim().replace(/^["']|["']$/g, "");

  // Check for common issues
  if (cleanToken !== token) {
    issues.push(
      "Token contained whitespace or quote characters that were removed"
    );
  }

  if (cleanToken.length < 20) {
    issues.push(
      `Token is suspiciously short (${cleanToken.length} characters)`
    );
  }

  if (cleanToken.includes(" ")) {
    issues.push("Token contains spaces which may cause authentication issues");
  }

  // Additional validation
  if (cleanToken.includes("Bearer ")) {
    issues.push("Token contains 'Bearer ' prefix which should be removed");
  }

  if (cleanToken.toLowerCase().includes("bearer")) {
    issues.push(
      "Token may contain authorization scheme text which should be removed"
    );
  }

  return {
    token: cleanToken,
    issues,
  };
}

/**
 * Print a safe debug representation of the token for logs
 */
export function getTokenDebugInfo(token: string | null): string {
  if (!token) return "null";
  if (token.length <= 10) return "[too short to safely truncate]";

  return `${token.substring(0, 5)}...${token.substring(token.length - 5)} (${
    token.length
  } chars)`;
}

/**
 * Get standardized headers to use with Kaze API
 */
export function getKazeApiHeaders(
  token: string,
  includeToken: boolean = true
): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "Kaze-Scheduling-Integration/1.0",
  };

  if (includeToken) {
    // Add token in most common format
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Helper function for making Kaze API requests with multiple auth methods
 */
export async function makeKazeApiRequest(
  url: string,
  payload: any,
  method: string = "POST"
): Promise<Response> {
  const { token, issues } = getCleanKazeToken();

  if (!token) {
    throw new Error("No Kaze API token available");
  }

  if (issues.length > 0) {
    console.warn("Kaze API token issues detected:", issues);
  }

  // Log the request attempt
  console.log(`Attempting Kaze API request to ${url}`);
  console.log(`Using token: ${getTokenDebugInfo(token)}`);

  // Track authentication attempts for diagnostics
  const attemptResults: { method: string; status: number }[] = [];

  // Try all authentication methods until one works
  // Method 1: API key in query parameter
  const separator = url.includes("?") ? "&" : "?";
  let response = await fetch(
    `${url}${separator}api_key=${encodeURIComponent(token)}`,
    {
      method,
      headers: getKazeApiHeaders(token, false),
      body: method === "GET" ? undefined : JSON.stringify(payload),
    }
  );

  attemptResults.push({
    method: "Query parameter (api_key)",
    status: response.status,
  });
  if (response.ok) return response;

  // Method 2: Bearer token
  response = await fetch(url, {
    method,
    headers: getKazeApiHeaders(token),
    body: method === "GET" ? undefined : JSON.stringify(payload),
  });

  attemptResults.push({
    method: "Bearer token",
    status: response.status,
  });
  if (response.ok) return response;

  // Method 3: Direct token
  response = await fetch(url, {
    method,
    headers: {
      ...getKazeApiHeaders(token, false),
      Authorization: token,
    },
    body: method === "GET" ? undefined : JSON.stringify(payload),
  });

  attemptResults.push({
    method: "Direct token in Authorization header",
    status: response.status,
  });
  if (response.ok) return response;

  // Method 4: X-API-Key header
  response = await fetch(url, {
    method,
    headers: {
      ...getKazeApiHeaders(token, false),
      "X-API-Key": token,
    },
    body: method === "GET" ? undefined : JSON.stringify(payload),
  });

  attemptResults.push({
    method: "X-API-Key header",
    status: response.status,
  });
  if (response.ok) return response;

  // Method 5: Include in body (only for POST requests)
  if (method !== "GET") {
    const payloadWithToken = {
      ...payload,
      api_key: token,
    };

    response = await fetch(url, {
      method,
      headers: getKazeApiHeaders(token, false),
      body: JSON.stringify(payloadWithToken),
    });

    attemptResults.push({
      method: "Token in request body",
      status: response.status,
    });
    if (response.ok) return response;
  }

  // If all methods failed, log detailed authentication attempts
  if (!response.ok) {
    console.error("All Kaze API authentication methods failed:");
    console.table(attemptResults);
  }

  // Return final response regardless of status
  return response;
}
