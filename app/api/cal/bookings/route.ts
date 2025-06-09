import { type NextRequest, NextResponse } from "next/server";
import { BookingStore } from "@/lib/booking-store";
import { AuthService } from "@/lib/auth";
import { serverBookingStorage } from "@/lib/server-booking-storage";

// Cal.com compatible booking endpoint that creates jobs in Kaze
export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json();
    console.log("Received booking data:", bookingData);

    // Check for authentication
    const authHeader = request.headers.get("authorization");
    const sessionCookie = request.cookies.get("session-token");

    let authenticatedUser = null;

    if (authHeader || sessionCookie) {
      console.log("=== AUTHENTICATED BOOKING ===");
      console.log("Processing booking request with user authentication");

      try {
        const token =
          authHeader?.replace("Bearer ", "") || sessionCookie?.value;
        if (token) {
          const session = await AuthService.getSession(token);
          if (session) {
            authenticatedUser = session.user;
            console.log("✅ User authenticated:", authenticatedUser?.email);
          }
        }
      } catch (error) {
        console.warn(
          "Authentication failed, falling back to anonymous booking:",
          error
        );
      }
    } else {
      console.log("=== ANONYMOUS BOOKING ===");
      console.log("Processing booking request without authentication");
    }

    // Extract customer info from Cal.com format
    const customerName =
      authenticatedUser?.name || // Use authenticated user's name
      bookingData.responses?.name ||
      bookingData.name ||
      "Anonymous Customer";
    const customerEmail =
      authenticatedUser?.email || // Use authenticated user's email
      bookingData.responses?.email ||
      bookingData.email;
    const customerPhone =
      authenticatedUser?.phone || // Use authenticated user's phone
      bookingData.responses?.phone ||
      bookingData.phone;
    const notes = bookingData.responses?.notes || bookingData.notes || "";
    const location =
      bookingData.responses?.location?.value ||
      bookingData.location ||
      "Customer Location";

    if (!customerEmail) {
      return NextResponse.json(
        {
          status: "ERROR",
          message: "Customer email is required",
        },
        { status: 400 }
      );
    }

    console.log(
      "✅ Booking request validated - customer email:",
      customerEmail
    );

    // Extract date and time for duplicate checking
    const startTime = new Date(bookingData.start);
    const date = startTime.toISOString().split("T")[0]; // YYYY-MM-DD

    // Use the same time format as the frontend (24-hour format HH:MM)
    const time = startTime.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    // Check if this exact slot is already booked by anyone
    const slotCheck = await BookingStore.isSlotBooked(
      date,
      time,
      bookingData.eventTypeId
    );

    if (slotCheck.isBooked) {
      return NextResponse.json(
        {
          status: "ERROR",
          message:
            "This time slot is no longer available. Please select a different time.",
          code: "SLOT_UNAVAILABLE",
          bookedBy: slotCheck.booking?.customerName,
        },
        { status: 409 }
      );
    }

    // Check for duplicate booking by the same user (authenticated users only)
    if (authenticatedUser && customerEmail) {
      const existingUserBookings = await BookingStore.findUserBookingsByEmail(
        customerEmail,
        date,
        time
      );

      if (existingUserBookings.length > 0) {
        console.log("🚫 Duplicate booking detected for user:", customerEmail);
        return NextResponse.json(
          {
            status: "ERROR",
            error: "duplicate_booking",
            message: "You already have a booking for this date and time.",
            code: "DUPLICATE_BOOKING",
            existingBooking: existingUserBookings[0],
          },
          { status: 409 }
        );
      }
    }

    console.log(
      "✅ No duplicate bookings found, proceeding with booking creation"
    );

    // Prepare booking data for Kaze
    const kazeBookingData = {
      start_time: bookingData.start,
      end_time: bookingData.end,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      service_id: bookingData.eventTypeId?.toString() || "general",
      technician_id: bookingData.technicianId,
      notes: notes,
      job_address: location,
    };

    console.log("=== KAZE API REQUEST (SERVER TO SERVER) ===");
    console.log("Using KAZE_API_TOKEN from environment variables");
    console.log("Preparing to send data to Kaze API endpoint");

    // Create booking in Kaze using our updated endpoint
    const response = await fetch(`${request.nextUrl.origin}/api/kaze/booking`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(kazeBookingData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Kaze booking error:", errorData);
      throw new Error(errorData.error || "Failed to create booking in Kaze");
    }

    const kazeResult = await response.json();

    if (!kazeResult.success) {
      throw new Error(kazeResult.error || "Kaze booking failed");
    }

    const booking = kazeResult.booking;

    // Create a temporary anonymous user for booking storage
    const anonymousUser = {
      id: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: customerEmail,
      name: customerName,
      phone: customerPhone,
      created_at: new Date().toISOString(),
    };

    // Store booking in our system for slot tracking
    const storedBooking = await BookingStore.createBooking(anonymousUser, {
      date,
      time,
      startTime: bookingData.start,
      endTime: bookingData.end,
      eventTypeId: bookingData.eventTypeId,
      customerName,
      customerEmail,
      customerPhone,
      serviceAddress: location,
      notes,
      kazeJobId: booking.kaze_job?.id || booking.id,
    });

    // Also store in server-side storage for availability checking
    const serverBooking = serverBookingStorage.createBooking({
      start: bookingData.start,
      end: bookingData.end,
      customerName,
      customerEmail,
      customerPhone,
      serviceId: bookingData.eventTypeId?.toString() || "1",
      technicianId: "default",
      kazeJobId: booking.kaze_job?.id || booking.id,
    });

    console.log("Booking stored successfully:", storedBooking.id, "Server:", serverBooking.id);

    // Return Cal.com compatible response
    return NextResponse.json({
      status: "SUCCESS",
      id: storedBooking.id,
      uid: storedBooking.id,
      title: `${bookingData.eventTypeSlug || "Service"} - ${customerName}`,
      description: notes || "Service appointment",
      startTime: bookingData.start,
      endTime: bookingData.end,
      attendees: [
        {
          email: customerEmail,
          name: customerName,
          phone: customerPhone,
          timeZone: bookingData.timeZone || "UTC",
        },
      ],
      organizer: {
        email: "booking@kazescheduling.com",
        name: "Kaze Scheduling",
        timeZone: "UTC",
      },
      bookingStatus: "ACCEPTED",
      location: location,
      eventTypeId: bookingData.eventTypeId,
      // Include additional data
      kazeJob: booking.kaze_job,
      customer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
      },
      message: "Booking created successfully in Kaze system (no auth required)",
    });
  } catch (error) {
    console.error("Cal.com booking error:", error);
    return NextResponse.json(
      {
        status: "ERROR",
        message: error instanceof Error ? error.message : "Booking failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
