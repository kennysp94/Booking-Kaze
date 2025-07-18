import { type NextRequest, NextResponse } from "next/server";
import { kazeRealAvailabilityService } from "@/lib/kaze-real-availability";
import { serverBookingStorage } from "@/lib/server-booking-storage";

// Fetch available time slots using real Kaze API data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const technicianId = searchParams.get("technicianId");

    console.log("🔍 Fetching real availability from Kaze API...");

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          error: "Date parameter is required",
        },
        { status: 400 }
      );
    }

    // Use the real Kaze API availability service
    const realAvailabilityData =
      await kazeRealAvailabilityService.getRealAvailabilityForDate(
        date,
        technicianId || undefined
      );

    // ALWAYS check against our local server bookings for conflicts
    // This ensures conflicts are detected even if Kaze API fails
    const localBookings = serverBookingStorage.getBookingsForDate(
      date,
      technicianId || undefined
    );

    console.log(
      `📅 Found ${localBookings.length} local bookings + ${realAvailabilityData.kazeJobs.length} Kaze jobs for ${date}`
    );

    // Filter out slots that conflict with local bookings
    // This is critical for preventing double-bookings when Kaze API fails
    const finalAvailableSlots = realAvailabilityData.slots.map((slot) => {
      // Start with the slot's current availability status
      let slotAvailable = slot.available;

      // Always check against local server bookings regardless of Kaze API status
      if (slotAvailable) {
        const slotStart = new Date(slot.start);
        const slotEnd = new Date(slot.end);

        const hasLocalConflict = !serverBookingStorage.isSlotAvailable(
          slotStart,
          slotEnd,
          technicianId || "default"
        );

        if (hasLocalConflict) {
          slotAvailable = false;
          console.log(
            `🚫 Slot ${slot.start} blocked by local booking conflict`
          );
        }
      }

      return {
        ...slot,
        available: slotAvailable,
      };
    });

    const finalAvailableCount = finalAvailableSlots.filter(
      (slot) => slot.available
    ).length;

    console.log(
      `✅ Generated ${finalAvailableSlots.length} total slots, ${finalAvailableCount} available for ${date}`
    );

    return NextResponse.json({
      success: true,
      source: "kaze-real-api",
      slots: finalAvailableSlots.map((slot) => ({
        start: slot.start,
        end: slot.end,
        available: slot.available,
        technicianId: slot.technicianId,
        serviceId: slot.serviceId,
      })),
      date: date,
      total: finalAvailableSlots.length,
      available: finalAvailableCount,
      businessHours: realAvailabilityData.businessHours,
      kazeJobsFound: realAvailabilityData.kazeJobs.length,
      localBookingsFound: localBookings.length,
      note: "Using real Kaze API job data with local booking conflict checking",
    });
  } catch (error) {
    console.error("Real availability fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch availability",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
