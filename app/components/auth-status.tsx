"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Mail,
  Phone,
  LogOut,
  Shield,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import UserAuth from "./user-auth";
import { getStoredUser, storeUser, clearAuth } from "@/lib/client-auth";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
}

export default function AuthStatus() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [authStatusMessage, setAuthStatusMessage] = useState(
    "Checking authentication..."
  );
  const [authStatusColor, setAuthStatusColor] = useState("text-gray-500");

  // Check if user is already logged in
  useEffect(() => {
    checkAuthStatus();

    // Add window storage event listener to keep auth status in sync across tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "kaze_user") {
        if (event.newValue) {
          try {
            const userData = JSON.parse(event.newValue);
            setUser(userData);
            setAuthStatusMessage("Signed in successfully");
            setAuthStatusColor("text-green-500");
          } catch (error) {
            console.error("Failed to parse stored user data:", error);
          }
        } else {
          setUser(null);
          setAuthStatusMessage("Authentication required");
          setAuthStatusColor("text-red-500");
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      // First try to get user data from localStorage
      const userData = getStoredUser();
      if (userData) {
        setUser(userData);
        setAuthStatusMessage("Signed in successfully");
        setAuthStatusColor("text-green-500");
        setIsLoading(false);
        return;
      }

      // If not in localStorage, try to get from server session
      const response = await fetch("/api/auth/me", {
        credentials: "include", // Include cookies for authentication
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setAuthStatusMessage("Signed in successfully");
        setAuthStatusColor("text-green-500");

        // Store user data in localStorage for persistence
        storeUser(data.user);

        // Test cookie status
        await fetchCookieDebug();
      } else {
        setAuthStatusMessage("Authentication required");
        setAuthStatusColor("text-red-500");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setAuthStatusMessage("Authentication check failed");
      setAuthStatusColor("text-red-500");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCookieDebug = async () => {
    try {
      const response = await fetch("/api/debug/cookies", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Cookie debug:", data);
      }
    } catch (error) {
      console.error("Cookie debug failed:", error);
    }
  };

  const handleSignInClick = () => {
    setShowLogin(true);
  };

  const handleAuthChange = (newUser: AuthUser | null) => {
    setUser(newUser);

    if (newUser) {
      setAuthStatusMessage("Signed in successfully");
      setAuthStatusColor("text-green-500");
    } else {
      setAuthStatusMessage("Authentication required");
      setAuthStatusColor("text-red-500");
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5" />
            Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-center text-gray-600">
            Checking authentication status...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (showLogin) {
    return <UserAuth onAuthChange={handleAuthChange} />;
  }

  if (user) {
    return (
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5" />
            Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex items-center gap-2 pb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className={`font-medium ${authStatusColor}`}>
              {authStatusMessage}
            </span>
          </div>

          <div className="space-y-3 border-t pt-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{user.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{user.phone}</span>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            onClick={async () => {
              try {
                const response = await fetch("/api/auth/logout", {
                  method: "POST",
                  credentials: "include",
                });

                if (response.ok) {
                  setUser(null);
                  handleAuthChange(null);

                  // Clear authentication data from localStorage
                  clearAuth();

                  toast.success("Logged out successfully!");
                } else {
                  toast.error("Logout failed");
                }
              } catch (error) {
                console.error("Logout error:", error);
                toast.error("Logout failed");
              }
            }}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-md">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="w-5 h-5" />
          Authentication Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="flex items-center gap-2 pb-2">
          <XCircle className="w-5 h-5 text-red-500" />
          <span className={`font-medium ${authStatusColor}`}>
            {authStatusMessage}
          </span>
        </div>

        <p className="text-sm text-gray-600">
          You need to sign in to book appointments and prevent double bookings.
        </p>

        <Button onClick={handleSignInClick} className="w-full">
          <User className="w-4 h-4 mr-2" />
          Sign In Now
        </Button>
      </CardContent>
    </Card>
  );
}
