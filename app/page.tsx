"use client";

import { useScheduling } from "@/providers/scheduling-provider";
import BookingInterface from "@/app/components/booking-interface";
import { useEffect } from "react";

export default function SchedulingPage() {
  const {
    selectedEventType,
    eventTypes,
    selectedDate,
    selectedTime,
    availableSlots,
    isLoading,
    setSelectedEventType,
    setSelectedDate,
    setSelectedTime,
    fetchAvailability,
    createBooking,
  } = useScheduling();

  // Set default event type when component mounts
  useEffect(() => {
    if (!selectedEventType && eventTypes.length > 0) {
      setSelectedEventType(eventTypes[0]);
    }
  }, [eventTypes, selectedEventType, setSelectedEventType]);

  return (
    <main className="min-h-screen bg-white">
      <BookingInterface
        eventType={
          selectedEventType
            ? {
                title: selectedEventType.title,
                description:
                  selectedEventType.description || "No description provided",
                length: selectedEventType.length,
              }
            : undefined
        }
        organizer={{
          name: "Alex Fisher",
          image: "/placeholder-user.jpg",
        }}
      />
    </main>
  );
}
