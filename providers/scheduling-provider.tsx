"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { toast } from "sonner";
import type {
  AvailabilityResponse,
  BookingCreateBody,
  EventType,
  BookingResponse,
} from "@/types/cal";
import { DEFAULT_EVENT_TYPES } from "@/types/event-types";
import { formatDateFrench, formatTimeFrench } from "@/lib/date-utils";
import { getAuthToken, getStoredUser, authFetch } from "@/lib/client-auth";

// Generate mock availability slots for demo purposes when Kaze API doesn't support availability
function generateMockSlots(date: Date): string[] {
  const mockSlots: string[] = [];

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
    const slotStart = new Date(date);
    slotStart.setHours(hour, minute, 0, 0);

    // Only show slots that haven't passed yet
    const now = new Date();
    const isAvailable = slotStart > now && Math.random() > 0.2; // 80% chance of being available

    if (isAvailable) {
      // Return in 24-hour format (French standard)
      const timeString = slotStart.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      mockSlots.push(timeString);
    }
  });

  return mockSlots;
}

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
}

interface SchedulingContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  selectedService: string | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  availableSlots: string[];
  bookedSlots: Set<string>; // Track booked time slots
  selectedEventType: EventType | null;
  eventTypes: EventType[];
  isLoading: boolean;
  confirmationData: any | null; // Store booking confirmation data
  setSelectedService: (service: string) => void;
  setSelectedDate: (date: Date) => void;
  setSelectedTime: (time: string) => void;
  setSelectedEventType: (eventType: EventType) => void;
  fetchAvailability: (date: Date) => Promise<void>;
  checkForDuplicate: (timeSlot: string, date: Date) => Promise<boolean>; // New method
  createBooking: (details: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    notes?: string;
  }) => Promise<any>;
  resetBookingFlow: () => void; // Reset to start new booking
  clearConfirmation: () => void; // Clear confirmation to go back to booking
}

const SchedulingContext = createContext<SchedulingContextType | undefined>(
  undefined
);

export function SchedulingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set()); // Track booked slots
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(
    null
  );
  const [eventTypes] = useState<EventType[]>(DEFAULT_EVENT_TYPES);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationData, setConfirmationData] = useState<any | null>(null); // Booking confirmation
  const [user, setUser] = useState<User | null>(null);

  // Check for existing user on mount
  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const fetchAvailability = useCallback(
    async (date: Date) => {
      if (!selectedEventType) {
        toast.error("Please select a service first");
        return;
      }

      if (!user) {
        toast.error("Please login to view availability");
        return;
      }

      setIsLoading(true);
      try {
        // Format date for Kaze API (YYYY-MM-DD format)
        const dateString = date.toISOString().split("T")[0];

        // Fetch availability from Kaze API
        const response = await authFetch(
          `/api/kaze/availability?date=${dateString}&serviceId=${selectedEventType.id}`
        );

        const data = await response.json();

        if (!response.ok) {
          // Handle specific error responses
          console.error("Availability API error:", data);
          toast.error(
            `Erreur lors de la récupération des créneaux: ${
              data.message || "Erreur inconnue"
            }`
          );

          // Log detailed error information for debugging
          console.log("📊 API Error Details:", {
            status: response.status,
            error: data.error,
            message: data.message,
          });

          setAvailableSlots([]);
          return;
        }

        if (!data.success) {
          console.error("API returned unsuccessful response:", data);
          toast.error(
            `Erreur de disponibilité: ${
              data.message || data.error || "Réponse non réussie"
            }`
          );
          setAvailableSlots([]);
          return;
        }

        if (!data.slots || !Array.isArray(data.slots)) {
          console.warn("API returned no slots or invalid slots format:", data);
          toast.info("Aucun créneau disponible trouvé pour cette date");
          setAvailableSlots([]);
          return;
        }

        // Log successful API call
        console.log(
          `✅ Successfully fetched ${data.slots.length} slots from availability API`,
          {
            source: data.source,
            total: data.total,
            date: data.date,
            businessHours: data.businessHours,
          }
        );

        // Transform Kaze API response to time slots
        const slots = data.slots
          .filter((slot: any) => {
            const slotTime = new Date(slot.start);
            const now = new Date();
            const minimumNoticeMinutes = selectedEventType.minimumBookingNotice;

            // Create slot key for tracking booked slots
            const slotKey = `${date.toDateString()}_${slotTime.toLocaleTimeString(
              "fr-FR",
              {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }
            )}`;

            // Filter available slots with minimum notice and exclude booked slots
            return (
              slot.available &&
              slotTime.getTime() - now.getTime() >=
                minimumNoticeMinutes * 60 * 1000 &&
              !bookedSlots.has(slotKey)
            );
          })
          .map((slot: any) => {
            const time = new Date(slot.start);
            // Return in 24-hour format (French standard)
            return time.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });
          });

        setAvailableSlots(slots);

        // Log success for debugging
        console.log(
          `✅ Fetched ${slots.length} available slots from Kaze API for ${dateString}`
        );
      } catch (error) {
        console.error("Error fetching availability from Kaze API:", error);

        // Provide more specific error messages
        if (error instanceof Error) {
          if (error.message.includes("Failed to fetch")) {
            toast.error(
              "Impossible de se connecter à l'API Kaze. Veuillez vérifier votre connexion réseau."
            );
          } else if (error.message.includes("not configured")) {
            toast.error(
              "Configuration API Kaze manquante. Veuillez contacter l'administrateur."
            );
          } else {
            toast.error(
              `Erreur lors de la récupération des créneaux: ${error.message}`
            );
          }
        } else {
          toast.error(
            "Impossible de récupérer les créneaux horaires disponibles depuis l'API Kaze"
          );
        }

        setAvailableSlots([]);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedEventType, bookedSlots, user]
  );

  // Check for duplicate bookings when user selects a time slot
  const checkForDuplicate = useCallback(
    async (timeSlot: string, date: Date): Promise<boolean> => {
      if (!user || !selectedEventType) {
        return false;
      }

      try {
        // Parse the selected time
        const [hours, minutes] = timeSlot.split(":").map(Number);
        const startTime = new Date(date);
        startTime.setHours(hours, minutes, 0, 0);

        const endTime = new Date(startTime);
        endTime.setMinutes(startTime.getMinutes() + selectedEventType.length);

        const response = await authFetch("/api/cal/check-duplicate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userEmail: user.email,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
          }),
        });

        if (response.status === 409) {
          // Duplicate found
          const data = await response.json();
          toast.error(
            data.message || "You already have a booking at this time"
          );
          return true;
        }

        if (!response.ok) {
          console.warn("Duplicate check failed:", response.status);
          // Don't block booking if check fails
          return false;
        }

        const data = await response.json();
        return data.isDuplicate || false;
      } catch (error) {
        console.warn("Error checking for duplicates:", error);
        // Don't block booking if check fails
        return false;
      }
    },
    [user, selectedEventType]
  );

  const createBooking = async (details: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    notes?: string;
  }) => {
    if (!selectedDate || !selectedTime || !selectedEventType) {
      toast.error("Veuillez sélectionner un service et un créneau horaire");
      return;
    }

    if (!user) {
      toast.error("Veuillez vous connecter pour effectuer une réservation");
      return;
    }

    setIsLoading(true);
    try {
      // Parse the selected time - now in 24-hour format (HH:MM)
      const [hours, minutes] = selectedTime.split(":").map(Number);

      const startTime = new Date(selectedDate);
      // Since we're already in 24-hour format, no need to convert
      startTime.setHours(hours, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(startTime.getMinutes() + selectedEventType.length);

      const bookingData: BookingCreateBody = {
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        eventTypeId: selectedEventType.id,
        eventTypeSlug: selectedEventType.slug,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: "fr",
        user: user.email, // Use authenticated user's email
        responses: {
          email: user.email, // Use authenticated user's email
          name: user.name, // Use authenticated user's name
          phone: user.phone || details.phone,
          notes: details.notes,
          location: {
            optionValue: "in_person",
            value: details.address || "Customer Location",
          },
        },
      };

      console.log(
        "Creating booking with authenticated user data:",
        bookingData
      );

      // Authenticated booking request
      console.log("=== AUTHENTICATED BOOKING ===");
      console.log("Processing booking request with user authentication");

      // Use authFetch for authenticated booking
      const response = await authFetch("/api/cal/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Check for duplicate booking error
        if (errorData.error === "duplicate_booking") {
          toast.error("You already have a booking for this time slot.");
          throw new Error(
            "Duplicate booking detected. You already have an appointment at this time."
          );
        }

        throw new Error(
          errorData.message || errorData.error || "Failed to create booking"
        );
      }

      const responseData: BookingResponse = await response.json();

      if (responseData.status === "SUCCESS") {
        toast.success("Booking created successfully!");

        // Mark this time slot as booked
        if (selectedDate && selectedTime) {
          const slotKey = `${selectedDate.toDateString()}_${selectedTime}`;
          setBookedSlots((prev) => new Set([...prev, slotKey]));
        }

        // Store confirmation data for display
        setConfirmationData(responseData.booking || responseData);

        // Reset selection after successful booking
        setSelectedService(null);
        setSelectedDate(null);
        setSelectedTime(null);
        setSelectedEventType(null);
        return responseData;
      } else {
        throw new Error(responseData.message || "Booking failed");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error(
        `Failed to create booking: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset booking flow to start over
  const resetBookingFlow = useCallback(() => {
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedEventType(null);
    setConfirmationData(null);
  }, []);

  // Clear confirmation to go back to booking
  const clearConfirmation = useCallback(() => {
    setConfirmationData(null);
  }, []);

  return (
    <SchedulingContext.Provider
      value={{
        user,
        setUser,
        selectedService,
        selectedDate,
        selectedTime,
        availableSlots,
        bookedSlots,
        selectedEventType,
        eventTypes,
        isLoading,
        confirmationData,
        setSelectedService,
        setSelectedDate,
        setSelectedTime,
        setSelectedEventType,
        fetchAvailability,
        checkForDuplicate,
        createBooking,
        resetBookingFlow,
        clearConfirmation,
      }}
    >
      {children}
    </SchedulingContext.Provider>
  );
}

export function useScheduling() {
  const context = useContext(SchedulingContext);
  if (context === undefined) {
    throw new Error("useScheduling must be used within a SchedulingProvider");
  }
  return context;
}
