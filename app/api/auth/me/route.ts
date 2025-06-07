import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    console.log("Auth check request received");

    // Log if we have a session cookie
    const sessionCookie = request.cookies.get("session-token")?.value;
    console.log("Session cookie present:", !!sessionCookie);

    // Log if we have an auth header
    const authHeader = request.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      console.log(
        "Auth token found:",
        token.substring(0, 5) + "..." + token.substring(token.length - 5)
      );
    }

    // Try to get user from cookie first
    let user = await AuthService.getUserFromRequest(request);

    // If no user from cookie, check for authorization header (for localStorage token)
    if (!user) {
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const session = await AuthService.getSession(token);
        user = session?.user || null;
        if (user) {
          console.log("User authenticated via Authorization header");
        }
      }
    } else {
      console.log("User authenticated via session cookie");
    }

    if (!user) {
      console.log("No authenticated user found");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log("User authenticated:", user.email);
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
  }
}
