import { type NextRequest, NextResponse } from "next/server";
import {
  getCleanKazeToken,
  getTokenDebugInfo,
  makeKazeApiRequest,
} from "@/lib/kaze-token";
import { serverBookingStorage } from "@/lib/server-booking-storage";

// Create a new booking in Kaze using the job workflow endpoint AND store in local database
export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json();

    // Get and validate the Kaze API token
    const { token, issues } = getCleanKazeToken();

    if (!token) {
      console.error("KAZE_API_TOKEN is not set in environment variables");
      return NextResponse.json(
        { error: "Kaze API token not configured" },
        { status: 401 }
      );
    }

    // Log any token issues
    if (issues.length > 0) {
      console.warn("KAZE_API_TOKEN issues detected:", issues);
    }

    console.log("=== KAZE API BOOKING REQUEST - SERVER TO SERVER ===");
    console.log("Kaze API Token info:", getTokenDebugInfo(token));
    console.log("Booking data received (user info redacted):", {
      start_time: bookingData.start_time,
      end_time: bookingData.end_time,
      customer_name: "REDACTED",
      customer_email: "REDACTED",
      service_id: bookingData.service_id,
      technician_id: bookingData.technician_id,
      job_address: "REDACTED",
    });

    // IMPORTANT: This endpoint uses the KAZE_API_TOKEN from environment variables
    // This is separate from the web user authentication token
    console.log("NOTE: Using server-side KAZE_API_TOKEN, not user auth token");

    // Validate required fields
    const {
      start_time,
      end_time,
      customer_name,
      customer_email,
      customer_phone,
      service_id,
      technician_id,
      notes,
      job_address,
    } = bookingData;

    if (!start_time || !customer_email || !customer_name) {
      return NextResponse.json(
        {
          error:
            "Missing required booking fields (start_time, customer_email, customer_name)",
        },
        { status: 400 }
      );
    }

    // Format the booking date and time for Kaze
    const bookingDateTime = new Date(start_time);
    const formattedDateTime = bookingDateTime.toISOString();

    // Prepare the job creation payload according to Kaze API specification
    const jobPayload = {
      target_id: "59850ec3-1aaa-4fb8-b311-702777f52265", // Target ID from your specification
      data: {
        info_mission: {
          info_commentaire: {
            data:
              notes ||
              `Booking created via web interface for ${customer_name} (${customer_email})`,
          },
          info_mission: {
            job_due_date: formattedDateTime,
            job_title: `WEB BOOKING - ${
              service_id || "Service"
            } - ${customer_name}`,
            job_address: job_address || "Address to be confirmed",
          },
        },
      },
    };

    console.log("Job payload prepared:", JSON.stringify(jobPayload, null, 2));

    // Use the dedicated makeKazeApiRequest utility to handle all authentication methods
    const baseUrl =
      "https://app.kaze.so/api/job_workflows/d177b08a-8fed-4f5a-8b21-d42843e5d232/job.json";
    console.log("Base URL for Kaze API:", baseUrl);

    // Make the request with all possible authentication methods
    console.log("Making Kaze API request with multiple authentication methods");
    let response: Response;

    try {
      response = await makeKazeApiRequest(baseUrl, jobPayload);

      if (response.ok) {
        console.log("Kaze API request succeeded");
      }
    } catch (error) {
      console.error("Error making Kaze API request:", error);
      throw new Error(
        `Failed to connect to Kaze API: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    // Check if the request failed and provide detailed error information
    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = "Could not extract error text from response";
      }

      console.error("=== KAZE API AUTHENTICATION FAILED ===");
      console.error("Response status:", response.status);
      console.error(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      );
      console.error("Response body:", errorText);

      // Provide specific error messages based on status code
      if (response.status === 401) {
        throw new Error(
          `Authentication failed with Kaze API: Invalid token. Please check your KAZE_API_TOKEN environment variable. Status: ${response.status}`
        );
      } else if (response.status === 403) {
        throw new Error(
          `Permission denied from Kaze API: Your token doesn't have sufficient permissions. Status: ${response.status}`
        );
      } else if (response.status === 404) {
        throw new Error(
          `Endpoint not found: The Kaze API workflow URL may be incorrect (${baseUrl}). Status: ${response.status}`
        );
      } else if (response.status >= 500) {
        throw new Error(
          `Kaze API server error (${response.status}): The server encountered an error processing your request.`
        );
      } else {
        throw new Error(
          `Kaze API Error: ${response.status} - ${errorText.substring(0, 200)}`
        );
      }
    }

    const kazeResponse = await response.json();
    console.log("=== SUCCESS: Kaze job created ===");
    console.log("Kaze response:", JSON.stringify(kazeResponse, null, 2));

    // Store booking in server-side storage for availability tracking
    const localBooking = serverBookingStorage.createBooking({
      start: start_time,
      end: end_time,
      customerName: customer_name,
      customerEmail: customer_email,
      customerPhone: customer_phone,
      serviceId: service_id || "1",
      technicianId: technician_id || "default",
      kazeJobId: kazeResponse.id || `booking_${Date.now()}`
    });

    console.log("✅ Booking stored in server storage:", localBooking.id);

    // Transform Kaze response to match expected booking format
    const booking = {
      id: kazeResponse.id || `booking_${Date.now()}`,
      localId: localBooking.id, // Include local database ID
      start_time: start_time,
      end_time: end_time,
      status: "confirmed",
      customer: {
        name: customer_name,
        email: customer_email,
        phone: customer_phone,
      },
      service: {
        id: service_id,
        title: jobPayload.data.info_mission.info_mission.job_title,
      },
      technician: technician_id ? { id: technician_id } : null,
      job_address: job_address,
      kaze_job: kazeResponse, // Include the full Kaze response for reference
    };

    return NextResponse.json({
      success: true,
      booking: booking,
    });
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Booking failed",
      },
      { status: 500 }
    );
  }
}

// Get booking details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("id");

    // Get and validate the Kaze API token
    const { token, issues } = getCleanKazeToken();

    if (!token) {
      console.error("KAZE_API_TOKEN is not set in environment variables");
      return NextResponse.json(
        { error: "Kaze API token not configured" },
        { status: 401 }
      );
    }

    // Log any token issues
    if (issues.length > 0) {
      console.warn("KAZE_API_TOKEN issues detected:", issues);
    }

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    // For now, return a mock booking since we don't have a GET endpoint for Kaze
    return NextResponse.json({
      id: bookingId,
      status: "confirmed",
      message: "Booking details would be fetched from Kaze here",
    });
  } catch (error) {
    console.error("Get booking error:", error);
    return NextResponse.json(
      { error: "Failed to get booking" },
      { status: 500 }
    );
  }
}
