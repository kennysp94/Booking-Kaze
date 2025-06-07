// Monkeypatch fetch to automatically include auth headers from localStorage
if (typeof window !== "undefined") {
  const originalFetch = window.fetch;

  window.fetch = function (url: RequestInfo | URL, options: RequestInit = {}) {
    // Get auth token from localStorage
    const token = localStorage.getItem("kaze_token");

    // If token exists, add it to the headers
    if (token) {
      options = {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      };
    }

    // Always include credentials
    options.credentials = "include";

    // Call original fetch with modified options
    return originalFetch(url, options);
  };
}

export {};
