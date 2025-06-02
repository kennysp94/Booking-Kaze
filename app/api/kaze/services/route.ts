import { type NextRequest, NextResponse } from "next/server"

// Fetch available services from Kaze
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization token required" }, { status: 401 })
    }

    const response = await fetch("https://api.kaze.com/services", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch services")
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      services: data.services || [],
    })
  } catch (error) {
    console.error("Services fetch error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch services" }, { status: 500 })
  }
}
