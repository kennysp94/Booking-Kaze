import { type NextRequest, NextResponse } from "next/server";
import { getCleanKazeToken, getKazeApiHeaders } from "@/lib/kaze-token";

// Fetch available services from Kaze
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Fetching services from Kaze API...");

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

    // Note: The actual Kaze API doesn't have a /services endpoint
    // For now, return mock data until we get the correct endpoint
    console.log(
      "📋 Returning mock services data (Kaze /services endpoint not available)"
    );

    return NextResponse.json({
      success: true,
      services: [
        {
          id: "1",
          title: "Standard Plumbing Inspection",
          description: "Comprehensive plumbing system inspection",
          duration: 90,
          price: "150",
        },
        {
          id: "2",
          title: "Emergency Plumbing Service",
          description: "Urgent plumbing repairs and fixes",
          duration: 60,
          price: "200",
        },
        {
          id: "3",
          title: "Pipe Installation",
          description: "New pipe installation and replacement",
          duration: 120,
          price: "300",
        },
      ],
    });
  } catch (error) {
    console.error("❌ Services fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch services",
      },
      { status: 500 }
    );
  }
}
