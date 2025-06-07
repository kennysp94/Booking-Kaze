"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, LogOut } from "lucide-react";
import { toast } from "sonner";
import {
  getStoredUser,
  storeUser,
  storeAuthToken,
  clearAuth,
} from "@/lib/client-auth";

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
}

interface UserAuthProps {
  onAuthChange: (user: User | null) => void;
}

export default function UserAuth({ onAuthChange }: UserAuthProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
  });

  // Check if user is already logged in
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // First try to get user data from localStorage
      const userData = getStoredUser();
      if (userData) {
        setUser(userData);
        onAuthChange(userData);
        return;
      }

      // If not in localStorage, try to get from server session
      const response = await fetch("/api/auth/me", {
        credentials: "include", // Include cookies for authentication
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        onAuthChange(data.user);
        // Store user data in localStorage for persistence
        storeUser(data.user);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.name) {
      toast.error("Email and name are required");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        onAuthChange(data.user);
        setShowLogin(false);

        // Store user data in localStorage for persistence
        storeUser(data.user);

        // Also store the token if it's provided
        if (data.token) {
          storeAuthToken(data.token);

          // Test token storage success
          console.log(
            "Auth token stored in localStorage:",
            data.token.substring(0, 5) +
              "..." +
              data.token.substring(data.token.length - 5)
          );
        }

        toast.success("Logged in successfully!");

        // Dispatch a storage event to notify other components
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("storage"));
        }
      } else {
        toast.error(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Include cookies for authentication
      });

      if (response.ok) {
        setUser(null);
        onAuthChange(null);
        setFormData({ email: "", name: "", phone: "" });

        // Clear authentication data from localStorage using utility function
        clearAuth();

        toast.success("Logged out successfully!");
      } else {
        toast.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
    } finally {
      setIsLoading(false);
    }
  };

  // If user is logged in, show user info
  if (user) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5" />
            Welcome back!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
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
            onClick={handleLogout}
            disabled={isLoading}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If showing login form
  if (showLogin) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Sign In to Book</CardTitle>
          <p className="text-sm text-gray-600">
            Please provide your details to book a service
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Signing In..." : "Sign In & Continue"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLogin(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Default state - show sign in prompt
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4 text-center">
        <CardTitle className="text-lg">Ready to Book?</CardTitle>
        <p className="text-sm text-gray-600">
          Sign in to secure your appointment and prevent double bookings
        </p>
      </CardHeader>
      <CardContent>
        <Button onClick={() => setShowLogin(true)} className="w-full">
          <User className="w-4 h-4 mr-2" />
          Sign In to Book
        </Button>
        <p className="text-xs text-gray-500 mt-3 text-center">
          We'll use your email to send booking confirmations and prevent
          duplicate bookings.
        </p>
      </CardContent>
    </Card>
  );
}
