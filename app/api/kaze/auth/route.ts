import { type NextRequest, NextResponse } from "next/server"

// Kaze API authentication endpoint
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const response = await fetch("https://api.kaze.com/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })

    if (!response.ok) {
      throw new Error("Authentication failed")
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      token: data.token,
      user: data.user,
    })
  } catch (error) {
    console.error("Kaze auth error:", error)
    return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 401 })
  }
}
