import { type NextRequest, NextResponse } from "next/server";
import { getCleanKazeToken, getKazeApiHeaders } from "@/lib/kaze-token";

// Fetch available time slots from Kaze API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const serviceId = searchParams.get("serviceId");
    const technicianId = searchParams.get("technicianId");

    console.log("🔍 Fetching availability from Kaze API...");

    // Use server-side KAZE_API_TOKEN (not client-side authorization)
    const { token, issues } = getCleanKazeToken();

    if (!token) {
      console.log("❌ No Kaze API token found");
      return NextResponse.json(
        {
          success: false,
          error: "Kaze API token not configured",
        },
        { status: 500 }
      );
    }

    if (issues.length > 0) {
      console.warn("⚠️ Kaze API token issues:", issues);
    }

    // Build query parameters for Kaze API
    const params = new URLSearchParams();
    if (date) params.append("date", date);
    if (serviceId) params.append("service_id", serviceId);
    if (technicianId) params.append("technician_id", technicianId);

    // Note: The actual Kaze API doesn't have an /availability endpoint
    // For now, return mock data until we get the correct endpoint
    console.log(
      "📅 Returning mock availability data (Kaze /availability endpoint not available)"
    );

    // Generate mock time slots for the requested date
    const requestedDate = new Date(
      date || new Date().toISOString().split("T")[0]
    );
    const mockSlots: Array<{
      start: string;
      end: string;
      available: boolean;
      technicianId: string;
      serviceId: string;
    }> = [];

    // Generate slots from 8 AM to 5 PM, every 90 minutes (service duration)
    // Using 24-hour format for European/French standard
    const businessHours = [
      { hour: 8, minute: 0 }, // 08:00
      { hour: 9, minute: 30 }, // 09:30
      { hour: 11, minute: 0 }, // 11:00
      { hour: 12, minute: 30 }, // 12:30
      { hour: 14, minute: 0 }, // 14:00
      { hour: 15, minute: 30 }, // 15:30
    ];

    businessHours.forEach(({ hour, minute }) => {
      const slotStart = new Date(requestedDate);
      slotStart.setHours(hour, minute, 0, 0);

      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotStart.getMinutes() + 90); // 90-minute slots

      // Only show slots that haven't passed yet
      const now = new Date();
      const isAvailable = slotStart > now && Math.random() > 0.2; // 80% chance of being available

      mockSlots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        available: isAvailable,
        technicianId: technicianId || "tech1",
        serviceId: serviceId || "1",
      });
    });

    return NextResponse.json({
      success: true,
      slots: mockSlots,
      date: date,
      total: mockSlots.length,
    });
  } catch (error) {
    console.error("Availability fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
