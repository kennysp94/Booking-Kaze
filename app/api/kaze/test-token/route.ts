import { NextRequest, NextResponse } from "next/server";
import { getCleanKazeToken, getTokenDebugInfo } from "@/lib/kaze-token";

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 Testing Kaze API token...");

    // Get the clean token and debug info
    const tokenResult = getCleanKazeToken();
    const debugInfo = getTokenDebugInfo(tokenResult.token);

    if (!tokenResult.token) {
      console.log("❌ No Kaze API token found");
      return NextResponse.json({
        success: false,
        error: "No Kaze API token configured",
        token_info: debugInfo,
      });
    }

    // Test the token by making a simple request to Kaze API
    try {
      const response = await fetch(
        `${process.env.KAZE_API_BASE_URL}/auth/validate`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${tokenResult.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(`🔍 Kaze API validation response: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Kaze API token is valid");
        return NextResponse.json({
          success: true,
          message: "Kaze API token is valid and working",
          token_info: debugInfo,
          validation_response: data,
        });
      } else {
        const errorText = await response.text();
        console.log(
          `❌ Kaze API validation failed: ${response.status} - ${errorText}`
        );
        return NextResponse.json({
          success: false,
          error: `Kaze API validation failed: ${response.status}`,
          token_info: debugInfo,
          validation_error: errorText,
        });
      }
    } catch (apiError) {
      console.log("❌ Error communicating with Kaze API:", apiError);
      return NextResponse.json({
        success: false,
        error: "Failed to communicate with Kaze API",
        token_info: debugInfo,
        api_error:
          apiError instanceof Error ? apiError.message : "Unknown API error",
      });
    }
  } catch (error) {
    console.error("❌ Error testing Kaze token:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error while testing token",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
