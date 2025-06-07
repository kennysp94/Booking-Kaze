"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
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

interface SchedulingContextType {
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

  const fetchAvailability = useCallback(
    async (date: Date) => {
      if (!selectedEventType) {
        toast.error("Please select a service first");
        return;
      }

      setIsLoading(true);
      try {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        // Use authFetch utility to automatically include auth token
        const response = await authFetch(
          `/api/cal/availability?start=${startDate.toISOString()}&end=${endDate.toISOString()}&eventTypeId=${
            selectedEventType.id
          }`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch availability");
        }

        const data: AvailabilityResponse = await response.json();

        // Transform availableSlots considering buffer times
        if (!data.availableSlots) {
          setAvailableSlots([]);
          return;
        }

        const slots = data.availableSlots
          .filter((slot) => {
            const slotTime = new Date(slot.time);
            const now = new Date();
            const minimumNoticeMinutes = selectedEventType.minimumBookingNotice;
            const slotKey = `${date.toDateString()}_${slotTime.toLocaleTimeString(
              "fr-FR",
              {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }
            )}`;

            // Filter out booked slots and slots too close to current time
            return (
              slotTime.getTime() - now.getTime() >=
                minimumNoticeMinutes * 60 * 1000 && !bookedSlots.has(slotKey) // Exclude already booked slots
            );
          })
          .map((slot) => {
            const time = new Date(slot.time);
            return time.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });
          });

        setAvailableSlots(slots);
      } catch (error) {
        console.error("Error fetching availability:", error);
        toast.error(
          "Impossible de récupérer les créneaux horaires disponibles"
        );
        setAvailableSlots([]);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedEventType, bookedSlots]
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
        language: "en",
        user: "default",
        responses: {
          email: details.email,
          name: details.name,
          phone: details.phone,
          notes: details.notes,
          location: {
            optionValue: "in_person",
            value: details.address || "Customer Location",
          },
        },
      };

      console.log("Creating booking with data:", bookingData);

      // Check if we have a token before making the request
      const token = getAuthToken();
      if (!token) {
        console.error("No authentication token found in localStorage");
        toast.error(
          "Authentication required. Please sign in to book appointments."
        );
        throw new Error("No authentication token found. Please sign in first.");
      }

      console.log(
        "Using auth token:",
        token.substring(0, 5) + "..." + token.substring(token.length - 5)
      );

      // Make the request with a direct approach to ensure token is included
      const response = await fetch("/api/cal/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Check for specific authentication error
        if (response.status === 401) {
          console.log("Authentication issue detected:", errorData);
          toast.error(
            "Authentication required. Please sign in to book appointments."
          );
          throw new Error("Authentication required. Please sign in first.");
        }

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
        toast.success("Booking created successfully in Kaze!");

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
