import { type NextRequest, NextResponse } from "next/server"

// Fetch available technicians from Kaze
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get("serviceId")
    const date = searchParams.get("date")

    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization token required" }, { status: 401 })
    }

    // Build query parameters
    const params = new URLSearchParams()
    if (serviceId) params.append("service_id", serviceId)
    if (date) params.append("date", date)

    const response = await fetch(`https://api.kaze.com/technicians?${params}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch technicians")
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      technicians: data.technicians || [],
    })
  } catch (error) {
    console.error("Technicians fetch error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch technicians" }, { status: 500 })
  }
}
