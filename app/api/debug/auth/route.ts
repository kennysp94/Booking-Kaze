import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Log session info
    const cookieToken = request.cookies.get("session-token")?.value;
    const sessions = AuthService.debug_getAllSessions();
    const authHeader = request.headers.get("Authorization");

    let headerToken = null;
    if (authHeader?.startsWith("Bearer ")) {
      headerToken = authHeader.substring(7);
    }

    // Check if any method works
    let user = null;
    let authMethod = "none";

    if (cookieToken) {
      const session = await AuthService.getSession(cookieToken);
      if (session?.user) {
        user = session.user;
        authMethod = "cookie";
      }
    }

    if (!user && headerToken) {
      const session = await AuthService.getSession(headerToken);
      if (session?.user) {
        user = session.user;
        authMethod = "header";
      }
    }

    return NextResponse.json({
      cookieToken: cookieToken
        ? {
            value:
              cookieToken.substring(0, 5) +
              "..." +
              cookieToken.substring(cookieToken.length - 5),
            sessionExists: sessions.has(cookieToken),
          }
        : null,
      headerToken: headerToken
        ? {
            value:
              headerToken.substring(0, 5) +
              "..." +
              headerToken.substring(headerToken.length - 5),
            sessionExists: sessions.has(headerToken),
          }
        : null,
      activeSession: authMethod,
      user: user
        ? {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        : null,
      allSessions: Array.from(sessions.entries()).map(([token, session]) => ({
        token:
          token.substring(0, 5) + "..." + token.substring(token.length - 5),
        user: session.user.email,
        expires: session.expires,
      })),
    });
  } catch (error) {
    console.error("Debug auth error:", error);
    return NextResponse.json(
      { error: "Failed to debug auth" },
      { status: 500 }
    );
  }
}
