// Client-side authentication utilities

interface StoredUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
}

/**
 * Get the current user from localStorage
 */
export const getStoredUser = (): StoredUser | null => {
  if (typeof window === "undefined") return null;

  try {
    const storedUser = localStorage.getItem("kaze_user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Failed to parse stored user data:", error);
    return null;
  }
};

/**
 * Get the auth token from localStorage
 */
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kaze_token");
};

/**
 * Store user data in localStorage
 */
export const storeUser = (user: StoredUser): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("kaze_user", JSON.stringify(user));
};

/**
 * Store auth token in localStorage
 */
export const storeAuthToken = (token: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("kaze_token", token);
};

/**
 * Clear authentication data from localStorage
 */
export const clearAuth = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("kaze_user");
  localStorage.removeItem("kaze_token");
};

/**
 * Add auth headers to a fetch request
 */
export const addAuthHeaders = (headers: HeadersInit = {}): HeadersInit => {
  const token = getAuthToken();
  if (token) {
    return {
      ...headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return headers;
};

/**
 * Authenticated fetch that adds auth token from localStorage
 */
export const authFetch = (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();
  const headers = addAuthHeaders(options.headers || {});

  // Log for debugging
  console.log("AuthFetch - URL:", url);
  console.log("AuthFetch - Token present:", !!token);
  if (token) {
    console.log(
      "Token snippet:",
      token.substring(0, 5) + "..." + token.substring(token.length - 5)
    );
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include", // Always include cookies as well
  });
};
