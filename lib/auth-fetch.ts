/**
 * Helper functions for authenticated fetch requests
 */

/**
 * Get authentication token from localStorage
 */
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kaze_token");
};

/**
 * Make a fetch request with authentication headers
 */
export const authFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();

  // Create a new headers object with existing headers
  const headers = new Headers();

  // Copy any existing headers
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers.set(key, value);
      });
    } else if (typeof options.headers === "object") {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (value !== undefined) headers.set(key, value.toString());
      });
    }
  }

  // Add auth token if available
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
    console.log("Auth header set:", `Bearer ${token.substring(0, 5)}...`);
  } else {
    console.warn("No auth token available for request to", url);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include", // Always include cookies
  });
};
