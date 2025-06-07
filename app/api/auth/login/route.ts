import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, name, phone } = await request.json();

    // Basic validation
    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Create or get user
    const user = await AuthService.createOrGetUser({
      email: email.toLowerCase().trim(),
      name: name.trim(),
      phone: phone?.trim(),
    });

    console.log("Created/retrieved user:", user.email);

    // Create session
    const sessionToken = await AuthService.createSession(user);
    console.log(
      "Created session token:",
      sessionToken.substring(0, 5) +
        "..." +
        sessionToken.substring(sessionToken.length - 5)
    );

    // Create response and set session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      token: sessionToken, // Include token in response for localStorage storage
      message: "Login successful",
    });

    // Set session cookie for localhost development
    response.cookies.set("session-token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // False for localhost
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
      // Don't set domain for localhost to avoid cookie issues
    });

    // Debug cookie being set
    console.log("Setting session cookie:", {
      token:
        sessionToken.substring(0, 5) +
        "..." +
        sessionToken.substring(sessionToken.length - 5),
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
