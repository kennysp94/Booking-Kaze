import { type NextRequest, NextResponse } from "next/server";
import { getCleanKazeToken, getKazeApiHeaders } from "@/lib/kaze-token";

// Fetch available technicians from Kaze
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");
    const date = searchParams.get("date");

    console.log("🔍 Fetching technicians from Kaze API...");

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

    // Build query parameters
    const params = new URLSearchParams();
    if (serviceId) params.append("service_id", serviceId);
    if (date) params.append("date", date);

    // Note: The actual Kaze API doesn't have a /technicians endpoint
    // For now, return mock data until we get the correct endpoint
    console.log(
      "👷 Returning mock technicians data (Kaze /technicians endpoint not available)"
    );

    return NextResponse.json({
      success: true,
      technicians: [
        {
          id: "tech1",
          name: "Jean Dupont",
          email: "jean.dupont@example.com",
          specialties: ["plumbing", "heating"],
          available: true,
        },
        {
          id: "tech2",
          name: "Marie Martin",
          email: "marie.martin@example.com",
          specialties: ["plumbing", "electrical"],
          available: true,
        },
        {
          id: "tech3",
          name: "Pierre Bernard",
          email: "pierre.bernard@example.com",
          specialties: ["plumbing", "installation"],
          available: true,
        },
      ],
    });
  } catch (error) {
    console.error("❌ Technicians fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch technicians",
      },
      { status: 500 }
    );
  }
}
