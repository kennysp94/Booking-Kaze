# Kaze Scheduling Authentication System

This document explains the two separate authentication systems used in the Kaze Scheduling application and how they interact.

## Two Authentication Systems

The application uses two completely separate authentication systems:

### 1. Web User Authentication

**Purpose**: Used for identifying users and preventing duplicate bookings.

**Implementation**:

- Stores token in `localStorage` as `kaze_token`
- Used in client-side requests through the `Authorization: Bearer <token>` header
- Managed through `/lib/auth-fetch.ts` and `/lib/client-auth.ts`
- Used to track which user is making bookings and prevent duplicate bookings

**Flow**:

1. User logs in through the web interface
2. Token is stored in localStorage
3. Token is included in API requests to web endpoints
4. Server validates the token against its session store

### 2. Kaze API Authentication

**Purpose**: Used for communicating with the Kaze backend service.

**Implementation**:

- Uses `KAZE_API_TOKEN` from environment variables (`.env` file)
- Only used in server-side requests
- Never exposed to the client-side
- Used for actual booking creation in the Kaze system
- Managed through server-side API endpoints

**Flow**:

1. Client makes authenticated request to web server
2. Web server validates the web user token
3. If valid, the server makes a request to Kaze API using the Kaze API token
4. Kaze API processes the request and returns a response

## Authentication Flow for Booking

The complete authentication flow for booking involves both systems:

1. Client authenticates with web user authentication:

   ```javascript
   const token = localStorage.getItem("kaze_token");
   fetch("/api/cal/bookings", {
     headers: { Authorization: `Bearer ${token}` },
     // other options...
   });
   ```

2. Server validates web user token:

   ```typescript
   // In /app/api/cal/bookings/route.ts
   const authHeader = request.headers.get("Authorization");
   if (authHeader?.startsWith("Bearer ")) {
     const token = authHeader.substring(7);
     const session = await AuthService.getSession(token);
     if (session?.user) {
       // User is authenticated, continue
     }
   }
   ```

3. Server makes request to Kaze API using separate API token:
   ```typescript
   // In /app/api/kaze/booking/route.ts
   const token = process.env.KAZE_API_TOKEN;
   const response = await fetch("https://api.kaze.com/...", {
     headers: { Authorization: token },
     // other options...
   });
   ```

## Testing Authentication

The following scripts are provided to test the authentication systems:

- `test-auth.sh`: Tests basic web user authentication
- `test-booking-flow.sh`: Tests the complete booking flow using web authentication
- `test-both-auth.sh`: Tests both authentication systems simultaneously

Run them as follows:

```bash
./test-auth.sh
./test-booking-flow.sh
./test-both-auth.sh
```

## Debugging Authentication

For authentication issues, you can:

1. Check web user authentication:

   ```bash
   curl http://localhost:3000/api/debug/auth
   ```

2. Check Kaze API token:

   ```bash
   curl http://localhost:3000/api/kaze/test-token
   ```

3. Monitor auth-related logs in the console
