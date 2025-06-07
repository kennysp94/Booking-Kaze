import { NextResponse } from "next/server";
import { BookingStore } from "@/lib/booking-store";
import { AuthService } from "@/lib/auth";

// Check if user already has a booking at the specified time
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, startTime, endTime } = body;

    if (!userEmail || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Get user's existing bookings for the specific time range
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    // Check for 24-hour window around the requested time
    const checkStart = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
    const checkEnd = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);

    const userBookings = await BookingStore.getUserBookingsInDateRange(
      userEmail,
      checkStart.toISOString(),
      checkEnd.toISOString()
    );

    // Check for exact time conflicts
    const hasConflict = userBookings.some((booking) => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);

      // Check if there's any overlap
      return (
        (startDate >= bookingStart && startDate < bookingEnd) ||
        (endDate > bookingStart && endDate <= bookingEnd) ||
        (startDate <= bookingStart && endDate >= bookingEnd)
      );
    });

    if (hasConflict) {
      console.log(
        `🔄 Duplicate booking detected for ${userEmail} at ${startTime}`
      );
      return NextResponse.json(
        {
          isDuplicate: true,
          error: "duplicate_booking",
          message: "You already have a booking at this time",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      isDuplicate: false,
      message: "No conflict found",
    });
  } catch (error) {
    console.error("Duplicate check error:", error);
    return NextResponse.json(
      { error: "Failed to check for duplicates" },
      { status: 500 }
    );
  }
}
