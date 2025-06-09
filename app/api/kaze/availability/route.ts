import { type NextRequest, NextResponse } from "next/server";
import { availabilityService } from "@/lib/availability-service";
import { databaseAvailability } from "@/lib/database-availability";

// Fetch available time slots using the real availability service
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const serviceId = searchParams.get("serviceId");
    const technicianId = searchParams.get("technicianId");

    console.log("🔍 Fetching availability using new availability service...");

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          error: "Date parameter is required",
        },
        { status: 400 }
      );
    }

    // Use the real availability service
    const availabilityData = await availabilityService.getAvailabilityForDate(
      date,
      serviceId || "1",
      technicianId || "default"
    );

    // Filter out slots that conflict with existing bookings in our database
    const existingBookings = databaseAvailability.getBookingsForDate(
      date,
      technicianId || undefined
    );
    console.log(
      `📅 Found ${existingBookings.length} existing bookings for ${date}`
    );

    const availableSlots = availabilityData.slots
      .filter((slot) => {
        if (!slot.available) return false;

        // Check against local database bookings
        const slotStart = new Date(slot.start);
        const slotEnd = new Date(slot.end);

        const hasConflict = !databaseAvailability.isSlotAvailable(
          slotStart,
          slotEnd,
          slot.technicianId || "default"
        );

        return !hasConflict;
      })
      .map((slot) => ({
        start: slot.start,
        end: slot.end,
        available: slot.available,
        technicianId: slot.technicianId,
        serviceId: slot.serviceId,
      }));

    console.log(
      `✅ Generated ${availableSlots.length} available slots for ${date}`
    );

    return NextResponse.json({
      success: true,
      source: "availability-service",
      slots: availableSlots,
      date: date,
      total: availableSlots.length,
      businessHours: availabilityData.businessHours,
      note: "Using real availability service with database conflict checking",
    });
  } catch (error) {
    console.error("Availability fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch availability",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
