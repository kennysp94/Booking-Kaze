# Authentication Systems in Kaze Scheduling

This document explains the two separate authentication systems used in the Kaze Scheduling application and how they work together.

## 1. Web User Authentication

**Purpose:** Identifies and authenticates users in the web application.

**Used for:**

- User login/logout
- Tracking which user is making bookings
- Preventing duplicate bookings by the same user
- Access control to protected sections of the web application

**Authentication flow:**

1. User logs in through the login form
2. Server validates credentials and issues a JWT token
3. Token is stored in:
   - `localStorage` as `kaze_token`
   - HTTP-only cookie for additional security
4. Token is sent in the `Authorization` header for authenticated requests
5. Client-side `authFetch` utility automatically includes this token

**Key components:**

- `lib/auth.ts` - Server-side authentication utilities
- `lib/client-auth.ts` - Client-side authentication utilities
- `app/api/auth/*` - Authentication API endpoints

## 2. Kaze API Authentication

**Purpose:** Allows the server to communicate with the Kaze backend API.

**Used for:**

- Creating bookings in the Kaze system
- Fetching data from the Kaze API
- Any server-to-server communication with Kaze

**Authentication flow:**

1. Server reads `KAZE_API_TOKEN` from environment variables
2. The token is validated and cleaned using `getCleanKazeToken()`
3. Server includes this token when communicating with Kaze API
4. The token is NEVER exposed to the client side

**Key components:**

- `lib/kaze-token.ts` - Utilities for working with the Kaze API token
- `KAZE_API_TOKEN` in `.env.local` - Securely stored API token
- `app/api/kaze/*` - Server endpoints that use the Kaze API token

## How They Work Together

The booking flow demonstrates how these two authentication systems work together:

1. **Client-side (Web User Auth)**

   - User logs in and receives a web authentication token
   - User selects booking details and submits the form
   - Client includes web auth token in the request to `/api/cal/bookings`

2. **Server-side (Both Auth Systems)**

   - Server validates the user's web auth token to identify the user
   - Server processes booking details and prepares Kaze API request
   - Server uses the `KAZE_API_TOKEN` (not the user's token) to communicate with Kaze

3. **Server-to-Kaze (Kaze API Auth)**
   - Server sends request to Kaze API with the Kaze API token
   - Kaze validates the API token and processes the request
   - Server receives response from Kaze and returns results to client

## Authentication Rules

1. **NEVER use the web user authentication token to communicate with Kaze API**
2. **NEVER expose the Kaze API token to the client side**
3. **ALWAYS use `getCleanKazeToken()` to properly handle the Kaze API token**
4. **ALWAYS include proper error handling for both authentication systems**

## Common Issues and Solutions

### Web User Authentication Issues

- **Issue:** User appears logged out despite successful login

  - **Solution:** Check for proper token storage in localStorage and cookies

- **Issue:** Authentication fails despite correct credentials
  - **Solution:** Ensure token is correctly formatted and included in requests

### Kaze API Authentication Issues

- **Issue:** KAZE_API_TOKEN is invalid or misconfigured

  - **Solution:** Check the token format in `.env.local` (no quotes, no "Bearer" prefix)

- **Issue:** Failed to authenticate with Kaze API
  - **Solution:** Use `test-token` endpoint to diagnose specific authentication issues

## Debugging Tools

1. **Web User Authentication**

   - Check browser console for authentication errors
   - Use `localStorage.getItem('kaze_token')` to verify token presence
   - Call `/api/auth/me` to validate token

2. **Kaze API Authentication**
   - Use the `/api/kaze/test-token` endpoint to test Kaze API token
   - Run `diagnose-auth-issues.sh` script for comprehensive diagnostics
   - Check server logs for token validation issues

## Best Practices

1. Always use `authFetch` on the client side to ensure proper web authentication
2. Always use `getCleanKazeToken()` on the server side to handle Kaze API token
3. Include clear error messages that distinguish between authentication systems
4. Log authentication failures with sufficient context for debugging
5. Never expose sensitive token information in client-side code or logs
