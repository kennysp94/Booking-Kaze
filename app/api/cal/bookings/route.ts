import { type NextRequest, NextResponse } from "next/server"
import { kazeClient } from "@/lib/kaze-client"

// Cal.com compatible booking endpoint
export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json()

    // Get token from session or environment
    const token = process.env.KAZE_API_TOKEN || request.headers.get("x-kaze-token")

    if (!token) {
      return NextResponse.json({ error: "Kaze API token required" }, { status: 401 })
    }

    kazeClient.setToken(token)

    // Transform Cal.com booking data to Kaze format
    const kazeBookingData = {
      start_time: bookingData.start,
      end_time: bookingData.end,
      customer_name: bookingData.attendees?.[0]?.name || bookingData.name,
      customer_email: bookingData.attendees?.[0]?.email || bookingData.email,
      customer_phone: bookingData.attendees?.[0]?.phone || bookingData.phone,
      service_id: bookingData.eventTypeId?.toString(),
      notes: bookingData.notes || bookingData.description,
      technician_id: bookingData.technicianId,
    }

    // Create booking in Kaze
    const booking = await kazeClient.createBooking(kazeBookingData)

    // Return Cal.com compatible response
    return NextResponse.json({
      id: booking.id,
      uid: booking.id.toString(),
      title: `Plumbing Service - ${booking.customer.name}`,
      description: booking.notes || "",
      startTime: booking.start_time,
      endTime: booking.end_time,
      attendees: [
        {
          email: booking.customer.email,
          name: booking.customer.name,
          timeZone: "UTC",
        },
      ],
      organizer: {
        email: booking.technician?.email || "admin@yourcompany.com",
        name: booking.technician?.name || "Plumbing Service",
        timeZone: "UTC",
      },
      status: "ACCEPTED",
      location: booking.location || "Customer Location",
    })
  } catch (error) {
    console.error("Cal.com booking error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Booking failed" }, { status: 500 })
  }
}
