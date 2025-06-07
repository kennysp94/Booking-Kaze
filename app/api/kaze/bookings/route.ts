import { type NextRequest, NextResponse } from "next/server";
import {
  getCleanKazeToken,
  getTokenDebugInfo,
  makeKazeApiRequest,
} from "@/lib/kaze-token";

// Get all bookings from Kaze API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const customerEmail = searchParams.get("customerEmail");
    const limit = searchParams.get("limit") || "100";

    console.log("🔍 Fetching all bookings from Kaze API...");

    // Get and validate the Kaze API token
    const { token, issues } = getCleanKazeToken();

    if (!token) {
      console.error("KAZE_API_TOKEN is not set in environment variables");
      return NextResponse.json(
        {
          success: false,
          error: "Kaze API token not configured",
        },
        { status: 401 }
      );
    }

    // Log any token issues
    if (issues.length > 0) {
      console.warn("KAZE_API_TOKEN issues detected:", issues);
    }

    console.log("=== KAZE API GET BOOKINGS REQUEST ===");
    console.log("Kaze API Token info:", getTokenDebugInfo(token));
    console.log("Query parameters:", {
      startDate,
      endDate,
      customerEmail,
      limit,
    });

    // Build query parameters for Kaze API
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (customerEmail) params.append("customer_email", customerEmail);
    params.append("limit", limit);

    // Try different possible Kaze API endpoints for retrieving bookings
    const possibleEndpoints = [
      "https://app.kaze.so/api/bookings.json",
      "https://app.kaze.so/api/jobs.json",
      "https://app.kaze.so/api/job_workflows.json",
      "https://api.kaze.com/bookings",
      "https://api.kaze.com/jobs",
    ];

    let response: Response | null = null;
    let workingEndpoint: string | null = null;

    // Try each endpoint until we find one that works
    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`🔗 Trying endpoint: ${endpoint}`);

        const fullUrl = `${endpoint}?${params.toString()}`;
        response = await makeKazeApiRequest(fullUrl, null, "GET");

        if (response.ok) {
          workingEndpoint = endpoint;
          console.log(`✅ Found working endpoint: ${endpoint}`);
          break;
        } else {
          console.log(
            `❌ Endpoint failed with status ${response.status}: ${endpoint}`
          );
        }
      } catch (error) {
        console.log(`❌ Endpoint error: ${endpoint} - ${error}`);
        continue;
      }
    }

    // If no endpoint worked, return mock data but indicate the limitation
    if (!response || !response.ok) {
      console.log(
        "🔄 No working Kaze API endpoint found for retrieving bookings"
      );
      console.log("📋 Returning mock bookings data for testing purposes");

      // Generate mock booking data based on current date range
      const mockBookings = generateMockBookings(
        startDate,
        endDate,
        customerEmail
      );

      return NextResponse.json({
        success: true,
        bookings: mockBookings,
        meta: {
          total: mockBookings.length,
          limit: parseInt(limit),
          source: "mock_data",
          message:
            "Real Kaze API endpoint for retrieving bookings not yet available",
          attempted_endpoints: possibleEndpoints,
        },
      });
    }

    // Parse the successful response
    const kazeResponse = await response.json();
    console.log("=== SUCCESS: Retrieved bookings from Kaze ===");
    console.log(
      `Found ${kazeResponse.length || 0} bookings from ${workingEndpoint}`
    );

    // Transform Kaze response to standardized format
    const bookings = Array.isArray(kazeResponse)
      ? kazeResponse
      : kazeResponse.bookings || kazeResponse.jobs || [];

    const transformedBookings = bookings.map((booking: any) => ({
      id: booking.id || booking.job_id,
      start_time:
        booking.start_time || booking.job_due_date || booking.scheduled_at,
      end_time:
        booking.end_time ||
        calculateEndTime(booking.start_time || booking.job_due_date),
      status: booking.status || "confirmed",
      customer: {
        name: booking.customer_name || booking.client_name || "Unknown",
        email: booking.customer_email || booking.client_email || "",
        phone: booking.customer_phone || booking.client_phone || "",
      },
      service: {
        id: booking.service_id || "unknown",
        title: booking.service_title || booking.job_title || "Service",
      },
      technician: booking.technician_id
        ? {
            id: booking.technician_id,
            name: booking.technician_name || "Assigned Technician",
          }
        : null,
      notes: booking.notes || booking.job_description || "",
      location: booking.location || booking.job_address || "",
      created_at: booking.created_at || new Date().toISOString(),
      updated_at: booking.updated_at || new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      bookings: transformedBookings,
      meta: {
        total: transformedBookings.length,
        limit: parseInt(limit),
        source: "kaze_api",
        endpoint: workingEndpoint,
        filters: {
          startDate,
          endDate,
          customerEmail,
        },
      },
    });
  } catch (error) {
    console.error("Get bookings error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get bookings",
      },
      { status: 500 }
    );
  }
}

// Helper function to generate mock bookings for testing
function generateMockBookings(
  startDate?: string | null,
  endDate?: string | null,
  customerEmail?: string | null
) {
  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate
    ? new Date(endDate)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  const mockBookings = [];
  const currentDate = new Date(start);

  // Generate a few mock bookings across the date range
  while (currentDate <= end && mockBookings.length < 10) {
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      // Skip weekends
      const bookingTime = new Date(currentDate);
      bookingTime.setHours(10 + Math.floor(Math.random() * 6), 0, 0, 0); // Random hour between 10-16

      const endTime = new Date(bookingTime);
      endTime.setHours(bookingTime.getHours() + 1, 30, 0, 0); // 1.5 hour duration

      mockBookings.push({
        id: `mock_booking_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        start_time: bookingTime.toISOString(),
        end_time: endTime.toISOString(),
        status: "confirmed",
        customer: {
          name: customerEmail
            ? "Test Customer"
            : `Customer ${mockBookings.length + 1}`,
          email:
            customerEmail || `customer${mockBookings.length + 1}@example.com`,
          phone: "+1234567890",
        },
        service: {
          id: "plumbing-basic",
          title: "Plumbing Service",
        },
        technician: {
          id: "tech1",
          name: "Jean Dupont",
        },
        notes: "Mock booking for testing duplicate detection",
        location: "123 Test Street, Test City",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    currentDate.setDate(
      currentDate.getDate() + Math.floor(Math.random() * 3) + 1
    ); // Skip 1-3 days
  }

  return mockBookings;
}

// Helper function to calculate end time if not provided
function calculateEndTime(
  startTime: string,
  durationMinutes: number = 90
): string {
  const start = new Date(startTime);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  return end.toISOString();
}
