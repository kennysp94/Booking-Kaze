# Authentication Fixes for Kaze Scheduling System

This document describes the authentication fixes implemented in the Kaze Scheduling system to address issues with token handling during the booking process.

## Problem Overview

Users were experiencing authentication failures when creating bookings, despite being successfully logged in. The main issues were:

1. The user authentication token from localStorage was not being properly passed or recognized in API requests
2. Confusion between two separate authentication systems:
   - Web user authentication (using `kaze_token` in localStorage)
   - Kaze API authentication (using `KAZE_API_TOKEN` from environment variables)

## Authentication Architecture

The application uses two distinct authentication systems that should not be mixed:

1. **Web User Authentication**: Used for identifying users and preventing duplicate bookings

   - Token stored in localStorage as `kaze_token`
   - Used in client-side requests via `Authorization: Bearer <token>` header
   - Managed through the `authFetch()` utility

2. **Kaze API Authentication**: Used for communicating with the Kaze backend system
   - Uses `KAZE_API_TOKEN` from environment variables (`.env` file)
   - Only used in server-side requests
   - Never exposed to clients
   - Used by API endpoints when they need to communicate with Kaze

## Fixes Implemented

### 1. Separated Two Authentication Systems

- **Web User Authentication**: Used for controlling access and preventing duplicate bookings
  - Uses `kaze_token` stored in localStorage
  - Included as `Authorization: Bearer <token>` in web requests
  - Used for identifying users and their bookings
- **Kaze API Authentication**: Used for communication with the Kaze backend system
  - Uses `KAZE_API_TOKEN` from environment variables
  - Used server-side in API routes that communicate with Kaze
  - Not exposed to the client

### 2. Enhanced Auth Fetch Utility (`/lib/auth-fetch.ts`)

- Improved header handling to properly merge existing headers with web authentication headers
- Added better error logging for debugging authentication issues
- Ensured consistent token handling across all requests

### 3. Updated KazeClient (`/lib/kaze-client.ts`)

- Removed client-side token requirement for Kaze API calls
- Updated to rely on server-side environment variables for Kaze API authentication
- Added documentation to clarify the separation of auth methods

### 4. Updated Scheduling Provider (`/providers/scheduling-provider.tsx`)

- Fixed token variable redeclaration that was causing issues
- Added verification of both token and user data before making booking requests
- Enhanced error messaging and logging
- Uses web authentication for booking requests

### 5. Improved Booking API Endpoint (`/app/api/cal/bookings/route.ts`)

- Simplified and improved web authentication logic
- Prioritized token authentication from the Authorization header
- Added multiple fallback authentication methods
- Properly separates web auth from Kaze API auth
- Uses environment variables for Kaze API requests

### 6. Added Authentication Debugging Endpoints

- Created `/app/api/debug/auth/route.ts` for inspecting authentication state
- Added comprehensive logging throughout the authentication flow

## Testing the Authentication Flow

Two testing scripts are provided to verify that the authentication and booking processes work correctly:

### Basic Authentication Testing

Run the following command to test basic authentication:

```bash
chmod +x ./test-auth.sh
./test-auth.sh
```

This script will:

1. Check the debug auth endpoint
2. Log in a test user
3. Verify the token is received
4. Check user authentication status
5. Test if the token can be used for API calls

### Full Booking Flow Testing

Run the following command to test the complete booking flow:

```bash
chmod +x ./test-booking-flow.sh
./test-booking-flow.sh
```

This script will:

1. Authenticate a test user
2. Check authentication status via multiple methods
3. Test slot availability checking
4. Create bookings using both token and cookie authentication
5. Test duplicate booking prevention
6. Test logout functionality
7. Verify that unauthenticated booking attempts are rejected

## Troubleshooting

If authentication issues persist:

1. Check the browser console for any JavaScript errors
2. Verify that localStorage is available and working in the browser
3. Make sure cookies are not being blocked
4. Check the server logs for authentication-related messages
5. Use the `/api/debug/auth` endpoint to see the current session state

## Next Steps

If the in-memory session storage is still causing issues, consider implementing more robust session persistence using:

1. A database for session storage
2. Redis or similar in-memory data store
3. JWT tokens with proper validation and refresh mechanisms
