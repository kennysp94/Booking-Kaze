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

interface SchedulingContextType {
  selectedService: string | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  availableSlots: string[];
  selectedEventType: EventType | null;
  eventTypes: EventType[];
  isLoading: boolean;
  setSelectedService: (service: string) => void;
  setSelectedDate: (date: Date) => void;
  setSelectedTime: (time: string) => void;
  setSelectedEventType: (eventType: EventType) => void;
  fetchAvailability: (date: Date) => Promise<void>;
  createBooking: (details: { name: string; email: string }) => Promise<void>;
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
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(
    null
  );
  const [eventTypes] = useState<EventType[]>(DEFAULT_EVENT_TYPES);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAvailability = useCallback(
    async (date: Date) => {
      if (!selectedEventType || !date) {
        return;
      }

      setIsLoading(true);
      try {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        const response = await fetch(
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
            return (
              slotTime.getTime() - now.getTime() >=
              minimumNoticeMinutes * 60 * 1000
            );
          })
          .map((slot) => {
            const time = new Date(slot.time);
            return time.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });
          });

        setAvailableSlots(slots);
      } catch (error) {
        console.error("Error fetching availability:", error);
        toast.error("Failed to fetch available time slots");
        setAvailableSlots([]);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedEventType]
  );

  const createBooking = async (details: { name: string; email: string }) => {
    if (!selectedDate || !selectedTime || !selectedEventType) {
      toast.error("Please select a service and time slot");
      return;
    }

    setIsLoading(true);
    try {
      const startTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(":");
      startTime.setHours(Number(hours), Number(minutes));

      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + selectedEventType.length / 60);

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
          location: {
            optionValue: "in_person",
            value: "Customer Location",
          },
        },
      };

      const response = await fetch("/api/cal/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        throw new Error("Failed to create booking");
      }

      const responseData: BookingResponse = await response.json();

      if (responseData.status === "SUCCESS") {
        toast.success("Booking created successfully!");
        // Reset selection after successful booking
        setSelectedService(null);
        setSelectedDate(null);
        setSelectedTime(null);
        setSelectedEventType(null);
      } else {
        throw new Error(responseData.message || "Booking failed");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("Failed to create booking. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SchedulingContext.Provider
      value={{
        selectedService,
        selectedDate,
        selectedTime,
        availableSlots,
        selectedEventType,
        eventTypes,
        isLoading,
        setSelectedService,
        setSelectedDate,
        setSelectedTime,
        setSelectedEventType,
        fetchAvailability,
        createBooking,
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
