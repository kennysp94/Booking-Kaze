import { type NextRequest, NextResponse } from "next/server"

// Fetch available time slots from Kaze API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const serviceId = searchParams.get("serviceId")
    const technicianId = searchParams.get("technicianId")

    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization token required" }, { status: 401 })
    }

    // Build query parameters for Kaze API
    const params = new URLSearchParams()
    if (date) params.append("date", date)
    if (serviceId) params.append("service_id", serviceId)
    if (technicianId) params.append("technician_id", technicianId)

    const response = await fetch(`https://api.kaze.com/availability?${params}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch availability")
    }

    const data = await response.json()

    // Transform Kaze response to Cal.com format
    const transformedSlots =
      data.available_slots?.map((slot: any) => ({
        start: slot.start_time,
        end: slot.end_time,
        available: slot.is_available,
        technicianId: slot.technician_id,
        serviceId: slot.service_id,
      })) || []

    return NextResponse.json({
      success: true,
      slots: transformedSlots,
      date: date,
      total: transformedSlots.length,
    })
  } catch (error) {
    console.error("Availability fetch error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch availability" }, { status: 500 })
  }
}
