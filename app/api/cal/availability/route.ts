import { NextResponse } from "next/server";
import { BookingStore } from "@/lib/booking-store";
import { serverBookingStorage } from "@/lib/server-booking-storage";
import type {
  AvailabilityResponse,
  DateRange,
  AvailabilitySlot,
} from "@/types/cal";
import { DEFAULT_EVENT_TYPES } from "@/types/event-types";

// Cal.com compatible availability endpoint
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const eventTypeId = searchParams.get("eventTypeId");

    if (!start || !end) {
      return NextResponse.json(
        { error: "Start and end dates are required" },
        { status: 400 }
      );
    }

    const eventType = eventTypeId
      ? DEFAULT_EVENT_TYPES.find((et) => et.id === Number(eventTypeId))
      : DEFAULT_EVENT_TYPES[0];

    if (!eventType) {
      return NextResponse.json(
        { error: "Event type not found" },
        { status: 404 }
      );
    }

    // Generate time slots based on working hours (9 AM to 5 PM)
    const startDate = new Date(start);
    const endDate = new Date(end);
    const availableSlots: AvailabilitySlot[] = [];
    const currentDate = new Date(startDate);

    // Get booked slots for the date range
    const dateKey = startDate.toISOString().split("T")[0];
    const bookedTimes = await BookingStore.getBookedTimeSlotsForDate(
      dateKey,
      eventType.id
    );

    while (currentDate < endDate) {
      // Skip weekends
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        // Working hours: 8 AM to 5 PM (8:00 - 17:00)
        for (let hour = 8; hour < 17; hour++) {
          // Create slots every eventType.length minutes
          for (let minute = 0; minute < 60; minute += 30) {
            const slotTime = new Date(currentDate);
            slotTime.setHours(hour, minute, 0, 0);

            // Skip slots that are in the past
            if (slotTime <= new Date()) {
              continue;
            }

            // Check if this slot is already booked (both BookingStore and server storage)
            const timeString = slotTime.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });

            if (bookedTimes.includes(timeString)) {
              continue; // Skip booked slots from BookingStore
            }

            // Also check server-side storage for conflicts
            const slotEnd = new Date(slotTime.getTime() + 30 * 60 * 1000); // 30-minute slots
            const isServerBooked = !serverBookingStorage.isSlotAvailable(
              slotTime,
              slotEnd,
              "default"
            );

            if (isServerBooked) {
              continue; // Skip booked slots from server storage
            }
            const now = new Date();
            if (slotTime <= now) {
              continue;
            }

            // Skip slots that don't meet minimum booking notice
            const minimumNoticeMinutes = eventType.minimumBookingNotice;
            if (
              slotTime.getTime() - now.getTime() >=
              minimumNoticeMinutes * 60 * 1000
            ) {
              availableSlots.push({
                time: slotTime.toISOString(),
                userIds: [1], // Default user ID
                attendees: 0,
                bookingUid: undefined,
                users: [
                  {
                    id: 1,
                    name: "Default Technician",
                    username: "technician",
                    email: "tech@example.com",
                    timeZone: "UTC",
                  },
                ],
              });
            }
          }
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const response: AvailabilityResponse = {
      busy: [], // In a real app, this would come from calendar integration
      timeZone: "UTC",
      workingHours: [
        {
          userId: 1,
          eventTypeId: eventType.id,
          days: [1, 2, 3, 4, 5], // Monday to Friday
          startTime: "08:00",
          endTime: "17:00",
        },
      ],
      dateRanges: [
        {
          start: start,
          end: end,
        },
      ],
      availableSlots: availableSlots,
      // Note: userBookings removed to reduce load during availability fetching
      // Duplicate checking will happen during booking creation
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Availability error:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
