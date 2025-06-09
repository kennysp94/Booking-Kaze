import { type NextRequest, NextResponse } from "next/server";
import { availabilityService } from "@/lib/availability-service";
import { databaseAvailability } from "@/lib/database-availability";

// Fetch available time slots using real availability service
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const serviceId = searchParams.get("serviceId");
    const technicianId = searchParams.get("technicianId");

    console.log("🔍 Fetching real availability with database integration...");

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          error: "Date parameter is required",
          message: "Veuillez fournir une date pour vérifier la disponibilité"
        },
        { status: 400 }
      );
    }

    // Get availability from our real availability service
    const availability = await availabilityService.getAvailabilityForDate(
      date,
      serviceId || undefined,
      technicianId || undefined
    );

    // Filter slots based on actual bookings in our database
    const filteredSlots = availability.slots.map(slot => {
      const slotStart = new Date(slot.start);
      const slotEnd = new Date(slot.end);
      
      // Check if this slot is actually available (not booked in our database)
      const isReallyAvailable = databaseAvailability.isSlotAvailable(
        slotStart,
        slotEnd,
        slot.technicianId || 'default'
      );

      return {
        ...slot,
        available: slot.available && isReallyAvailable
      };
    });

    // Only return available slots
    const availableSlots = filteredSlots.filter(slot => slot.available);

    console.log(`✅ Found ${availableSlots.length} available slots for ${date}`);
    console.log(`📊 Business hours: ${availability.businessHours.start} - ${availability.businessHours.end} (${availability.businessHours.timezone})`);

    return NextResponse.json({
      success: true,
      slots: availableSlots,
      date: date,
      total: availableSlots.length,
      businessHours: availability.businessHours,
      source: "real-availability-service",
      message: "Créneaux récupérés depuis le service de disponibilité avec vérification en base de données"
    });

  } catch (error) {
    console.error("💥 Error in availability service:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        message: "Erreur lors de la récupération des créneaux disponibles",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
