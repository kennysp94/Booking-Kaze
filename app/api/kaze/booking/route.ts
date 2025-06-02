import { type NextRequest, NextResponse } from "next/server"

// Create a new booking in Kaze
export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json()
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization token required" }, { status: 401 })
    }

    // Validate required fields
    const { start_time, end_time, customer_name, customer_email, customer_phone, service_id, technician_id, notes } =
      bookingData

    if (!start_time || !end_time || !customer_email || !service_id) {
      return NextResponse.json({ error: "Missing required booking fields" }, { status: 400 })
    }

    // Create booking in Kaze
    const response = await fetch("https://api.kaze.com/bookings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        start_time,
        end_time,
        customer: {
          name: customer_name,
          email: customer_email,
          phone: customer_phone,
        },
        service_id,
        technician_id,
        notes,
        status: "confirmed",
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Booking creation failed")
    }

    const booking = await response.json()

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        start_time: booking.start_time,
        end_time: booking.end_time,
        status: booking.status,
        customer: booking.customer,
        service: booking.service,
        technician: booking.technician,
      },
    })
  } catch (error) {
    console.error("Booking creation error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Booking failed" },
      { status: 500 },
    )
  }
}

// Get booking details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get("id")
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization token required" }, { status: 401 })
    }

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID required" }, { status: 400 })
    }

    const response = await fetch(`https://api.kaze.com/bookings/${bookingId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch booking")
    }

    const booking = await response.json()

    return NextResponse.json({
      success: true,
      booking,
    })
  } catch (error) {
    console.error("Booking fetch error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch booking" }, { status: 500 })
  }
}
