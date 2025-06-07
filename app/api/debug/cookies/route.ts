import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const allCookies = request.cookies.getAll();
    const sessionToken = request.cookies.get("session-token");

    return NextResponse.json({
      url: request.url,
      userAgent: request.headers.get("user-agent"),
      allCookies: allCookies,
      sessionToken: sessionToken,
      cookieCount: allCookies.length,
      headers: Object.fromEntries(request.headers.entries()),
    });
  } catch (error) {
    console.error("Debug cookies error:", error);
    return NextResponse.json({ error: "Debug failed" }, { status: 500 });
  }
}
