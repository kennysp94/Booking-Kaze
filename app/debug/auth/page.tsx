"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { getAuthToken } from "@/lib/client-auth";

export default function AuthDebugPage() {
  interface UserAuth {
    token: string | null;
    isAuthenticated: boolean;
    user: any | null;
    loading: boolean;
    error?: string;
  }

  interface KazeAuth {
    isValid: boolean | null;
    message: string | null;
    tokenInfo: any | null;
    loading: boolean;
    error: string | null;
  }

  const [userAuth, setUserAuth] = useState<UserAuth>({
    token: null,
    isAuthenticated: false,
    user: null,
    loading: true,
  });

  const [kazeAuth, setKazeAuth] = useState<KazeAuth>({
    isValid: null,
    message: null,
    tokenInfo: null,
    loading: true,
    error: null,
  });

  // Test web user authentication
  useEffect(() => {
    async function checkUserAuth() {
      try {
        // Get token from localStorage
        const token = getAuthToken();

        if (!token) {
          setUserAuth({
            token: null,
            isAuthenticated: false,
            user: null,
            loading: false,
          });
          return;
        }

        // Try to get user info using the token
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserAuth({
            token: token,
            isAuthenticated: true,
            user: data.user,
            loading: false,
          });
        } else {
          setUserAuth({
            token: token,
            isAuthenticated: false,
            user: null,
            loading: false,
            error: "Invalid token",
          });
        }
      } catch (error) {
        setUserAuth({
          token: null,
          isAuthenticated: false,
          user: null,
          loading: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    }

    checkUserAuth();
  }, []);

  // Test Kaze API authentication
  useEffect(() => {
    async function checkKazeAuth() {
      try {
        const response = await fetch("/api/kaze/test-token");
        const data = await response.json();

        setKazeAuth({
          isValid: data.success,
          message: data.message || data.error,
          tokenInfo: data.token_info,
          loading: false,
          error: data.error || null,
        });
      } catch (error) {
        setKazeAuth({
          isValid: false,
          message: null,
          tokenInfo: null,
          loading: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    }

    checkKazeAuth();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Authentication Debug Tools</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Web User Authentication Card */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">
            Web User Authentication
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            This system identifies users in the web application. It uses JWT
            tokens stored in localStorage and cookies.
          </p>

          {userAuth.loading ? (
            <div className="flex items-center justify-center h-32">
              <p>Loading authentication status...</p>
            </div>
          ) : userAuth.isAuthenticated ? (
            <Alert className="bg-green-50 border-green-200">
              <AlertTitle className="text-green-600">
                ✅ Authenticated
              </AlertTitle>
              <AlertDescription>
                <div className="mt-2">
                  <p>
                    <strong>User:</strong> {userAuth.user?.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {userAuth.user?.email}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Token: {userAuth.token?.substring(0, 10)}...
                    {userAuth.token?.substring(userAuth.token.length - 10)}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-red-50 border-red-200">
              <AlertTitle className="text-red-600">
                ❌ Not Authenticated
              </AlertTitle>
              <AlertDescription>
                <p className="mt-2">
                  You are not logged in or your token is invalid.
                </p>
                {userAuth.error && (
                  <p className="text-sm text-red-600 mt-2">
                    Error: {userAuth.error}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Separator className="my-6" />

          <div className="space-y-4">
            <h3 className="font-medium">Actions:</h3>
            <Button
              onClick={() => (window.location.href = "/login")}
              className="w-full"
            >
              Go to Login Page
            </Button>
          </div>
        </Card>

        {/* Kaze API Authentication Card */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">
            Kaze API Authentication
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            This system is used by the server to communicate with the Kaze
            backend. It uses the KAZE_API_TOKEN from environment variables.
          </p>

          {kazeAuth.loading ? (
            <div className="flex items-center justify-center h-32">
              <p>Testing Kaze API token...</p>
            </div>
          ) : kazeAuth.isValid ? (
            <Alert className="bg-green-50 border-green-200">
              <AlertTitle className="text-green-600">
                ✅ Valid Kaze API Token
              </AlertTitle>
              <AlertDescription>
                <div className="mt-2">
                  <p>{kazeAuth.message}</p>
                  {kazeAuth.tokenInfo && (
                    <div className="mt-2 text-xs">
                      <p>
                        <strong>Length:</strong> {kazeAuth.tokenInfo.length}{" "}
                        characters
                      </p>
                      <p>
                        <strong>Format:</strong> {kazeAuth.tokenInfo.format}
                      </p>
                      {kazeAuth.tokenInfo.issues?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-amber-600">
                            <strong>Issues:</strong>
                          </p>
                          <ul className="list-disc pl-5">
                            {kazeAuth.tokenInfo.issues.map(
                              (issue: string, i: number) => (
                                <li key={i} className="text-amber-600">
                                  {issue}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-red-50 border-red-200">
              <AlertTitle className="text-red-600">
                ❌ Invalid Kaze API Token
              </AlertTitle>
              <AlertDescription>
                <div className="mt-2">
                  <p>
                    {kazeAuth.message ||
                      "The server could not authenticate with the Kaze API."}
                  </p>
                  {kazeAuth.error && (
                    <p className="text-sm text-red-600 mt-2">
                      Error: {kazeAuth.error}
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Separator className="my-6" />

          <div className="space-y-4">
            <h3 className="font-medium">Important Notes:</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>This token is stored in server environment variables</li>
              <li>It is NEVER exposed to the client side</li>
              <li>Issues with this token will affect all booking operations</li>
            </ul>
          </div>
        </Card>
      </div>

      {/* Authentication Systems Explanation */}
      <Card className="p-6 mt-8">
        <h2 className="text-xl font-semibold mb-4">
          How These Authentication Systems Work Together
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-medium mb-2">When creating a booking:</h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>
                <strong>Step 1:</strong> The client uses{" "}
                <strong>Web User Authentication</strong> to identify the user
                making the booking
              </li>
              <li>
                <strong>Step 2:</strong> The server validates the user's
                identity and processes the booking details
              </li>
              <li>
                <strong>Step 3:</strong> The server uses{" "}
                <strong>Kaze API Authentication</strong> to communicate with
                Kaze backend
              </li>
              <li>
                <strong>Step 4:</strong> Kaze processes the booking and returns
                a confirmation
              </li>
            </ol>
          </div>

          <div>
            <h3 className="font-medium mb-2">Important distinction:</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                Web User Authentication token is NEVER used to communicate with
                Kaze API
              </li>
              <li>Kaze API token is NEVER exposed to the client side</li>
              <li>These are two separate systems with different purposes</li>
              <li>Both must be working correctly for bookings to succeed</li>
            </ul>
          </div>
        </div>

        <div className="mt-6">
          <Button
            onClick={() =>
              (window.location.href = "/AUTHENTICATION-SYSTEMS.md")
            }
            variant="outline"
            className="w-full"
          >
            View Full Authentication Documentation
          </Button>
        </div>
      </Card>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        For more information, see the{" "}
        <a href="/AUTHENTICATION-SYSTEMS.md" className="underline">
          Authentication Systems documentation
        </a>
        .
      </div>
    </div>
  );
}
