import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { BookingStore, type StoredBooking } from "@/lib/booking-store";

// Check if a specific slot is already booked
export async function POST(request: NextRequest) {
  try {
    const { date, time, eventTypeId } = await request.json();

    if (!date || !time || !eventTypeId) {
      return NextResponse.json(
        { error: "Date, time, and eventTypeId are required" },
        { status: 400 }
      );
    }

    // Get current user (optional - can check without auth)
    const user = await AuthService.getUserFromRequest(request);

    // Check if slot is booked by anyone
    const slotCheck = await BookingStore.isSlotBooked(
      date,
      time,
      eventTypeId,
      user?.id // Exclude current user's bookings from the check
    );

    // If user is authenticated, also check if they have a booking for this slot
    let userBookingCheck: { hasBooked: boolean; booking?: StoredBooking } = {
      hasBooked: false,
      booking: undefined,
    };
    if (user) {
      userBookingCheck = await BookingStore.hasUserBookedSlot(
        user.id,
        date,
        time,
        eventTypeId
      );
    }

    return NextResponse.json({
      isAvailable: !slotCheck.isBooked,
      isBookedByOthers: slotCheck.isBooked,
      isBookedByUser: userBookingCheck.hasBooked,
      bookedBy: slotCheck.booking?.customerName,
      userBooking: userBookingCheck.booking,
    });
  } catch (error) {
    console.error("Booking check error:", error);
    return NextResponse.json(
      { error: "Failed to check booking status" },
      { status: 500 }
    );
  }
}

// Check if a user has a booking for a date/time by email
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");
    const date = searchParams.get("date");
    const time = searchParams.get("time");

    if (!email || !date) {
      return NextResponse.json(
        { error: "Email and date are required" },
        { status: 400 }
      );
    }

    // Get authenticated user
    const currentUser = await AuthService.getUserFromRequest(request);

    // Only proceed if user is authenticated and the email matches
    if (!currentUser || currentUser.email !== email) {
      return NextResponse.json(
        { error: "Authentication required or email mismatch" },
        { status: 401 }
      );
    }

    // Check if this email has any bookings for this date/time
    const bookings = await BookingStore.findUserBookingsByEmail(
      email,
      date,
      time
    );

    return NextResponse.json({
      hasDuplicateBooking: bookings.length > 0,
      bookings: bookings,
    });
  } catch (error) {
    console.error("Email booking check error:", error);
    return NextResponse.json(
      { error: "Failed to check bookings" },
      { status: 500 }
    );
  }
}
