"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { fr } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  Clock,
  Video,
  Info,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useScheduling } from "@/providers/scheduling-provider";
import { useTimezone } from "@/providers/timezone-provider";
import TimezoneSelector from "@/components/timezone-selector";
import BookingForm from "./booking-form";
import BookingConfirmation from "./booking-confirmation";
import UserAuth from "./user-auth";

interface BookingInterfaceProps {
  eventType?: {
    title: string;
    description: string;
    length: number;
  };
  organizer: {
    name: string;
    image: string;
  };
}

export default function BookingInterface({
  eventType,
  organizer,
}: BookingInterfaceProps) {
  const {
    user,
    setUser,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    availableSlots,
    bookedSlots,
    isLoading,
    fetchAvailability,
    confirmationData,
    resetBookingFlow,
    checkForDuplicate,
  } = useScheduling();

  const {
    timezone,
    setTimezone,
    formatDateForTimezone,
    formatTimeForTimezone,
    formatDateTimeForTimezone,
  } = useTimezone();

  const [mounted, setMounted] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Only access browser APIs after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Set default date and fetch initial availability (4 months in future for testing)
  useEffect(() => {
    if (!selectedDate) {
      const now = new Date();
      // Set default date to 4 months in the future for safe testing
      const defaultDate = new Date(now.getFullYear(), now.getMonth() + 4, 15);
      setSelectedDate(defaultDate);
      setSelectedMonth(
        new Date(defaultDate.getFullYear(), defaultDate.getMonth(), 1)
      );
      fetchAvailability(defaultDate);
    }
  }, [selectedDate, setSelectedDate, fetchAvailability]);

  // Fetch availability when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchAvailability(selectedDate);
    }
  }, [selectedDate, fetchAvailability]);

  // Navigation functions
  const navigateMonth = useCallback(
    (direction: "prev" | "next") => {
      const newMonth = new Date(selectedMonth);
      if (direction === "prev") {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      setSelectedMonth(newMonth);
    },
    [selectedMonth]
  );

  // Generate available dates in a month (for demo purposes)
  const getAvailableDatesInMonth = (month: Date) => {
    const availableDates = new Set<string>();
    const currentDate = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    while (currentDate <= lastDay) {
      if (currentDate >= new Date()) {
        // For demo purposes, make weekdays available
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
          availableDates.add(currentDate.toISOString().split("T")[0]);
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return availableDates;
  };

  // Get available time slots for a specific date
  const getAvailableSlotsForDate = (date: Date) => {
    // Filter out slots that are already booked
    return availableSlots.filter((timeString) => {
      const slotKey = `${date.toDateString()}_${timeString}`;
      return !bookedSlots.has(slotKey);
    });
  };

  const availableDates = getAvailableDatesInMonth(selectedMonth);

  // Show confirmation page if booking was successful
  if (confirmationData) {
    return (
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 min-h-screen flex items-center justify-center p-8">
        <BookingConfirmation
          booking={confirmationData}
          onNewBooking={resetBookingFlow}
        />
      </div>
    );
  }

  // Show authentication form if user is not logged in
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Login Required
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Please login or create an account to book an appointment.
            </p>
          </div>
          <UserAuth onAuthChange={setUser} />
        </div>
      </div>
    );
  }

  // Show booking form if both date and time are selected
  if (showBookingForm && selectedDate && selectedTime && eventType) {
    return (
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 min-h-screen flex items-center justify-center p-8">
        <BookingForm
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          eventType={eventType}
          onCancel={() => setShowBookingForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 min-h-screen">
      <div className="p-8">
        {/* Header with event info and timezone selector */}
        <div className="mb-8 space-y-6">
          {/* Profile and event section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <Avatar>
                <Image
                  src={organizer.image}
                  alt={organizer.name}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {organizer.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Prestataire de Service
                </p>
              </div>
            </div>

            {/* Timezone selector in header */}
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Europe/Paris
              </span>
            </div>
          </div>

          {/* Event details */}
          {eventType && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {eventType.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>{eventType.length} minutes</span>
                </div>
                <div className="flex items-center">
                  <Video className="w-4 h-4 mr-2" />
                  <span>Détails fournis après confirmation</span>
                </div>
                <div className="flex items-center">
                  <Info className="w-4 h-4 mr-2" />
                  <span>{eventType.description}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Calendar and Time Slots Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedMonth.toLocaleString("fr-FR", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("prev")}
                disabled={selectedMonth.getMonth() === new Date().getMonth()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Calendar
            mode="single"
            selected={selectedDate || undefined}
            onSelect={(date) => {
              if (date) {
                setSelectedDate(date);
                setSelectedTime("");
                // Update selected month when picking a date from a different month
                if (date.getMonth() !== selectedMonth.getMonth()) {
                  setSelectedMonth(
                    new Date(date.getFullYear(), date.getMonth(), 1)
                  );
                }
              }
            }}
            month={selectedMonth}
            onMonthChange={setSelectedMonth}
            className="rounded-md border shadow-sm p-3"
            weekStartsOn={1} // Monday as first day of week (European standard)
            locale={fr} // French locale for days/months
            classNames={{
              months: "space-y-4",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button:
                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell:
                "text-gray-500 dark:text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: cn(
                "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                "hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              ),
              day_selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "text-gray-400 opacity-50",
              day_disabled: "text-gray-400 opacity-50",
              day_range_middle:
                "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
            modifiers={{
              available: (date) =>
                availableDates.has(date.toISOString().split("T")[0]),
            }}
            modifiersClassNames={{
              available: "font-medium text-green-600 dark:text-green-400",
            }}
            disabled={(date) =>
              date < new Date() ||
              !availableDates.has(date.toISOString().split("T")[0])
            }
          />
        </div>

        {/* Time slots */}
        {selectedDate && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Créneaux disponibles pour{" "}
              {mounted ? formatDateForTimezone(selectedDate) : "..."}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {getAvailableSlotsForDate(selectedDate).length > 0 ? (
                getAvailableSlotsForDate(selectedDate).map(
                  (timeString, index) => {
                    const slotKey = `${selectedDate.toDateString()}_${timeString}`;
                    const isBooked = bookedSlots.has(slotKey);

                    return (
                      <Button
                        key={index}
                        variant={
                          selectedTime === timeString ? "default" : "outline"
                        }
                        size="sm"
                        className={cn(
                          "text-sm transition-all duration-200",
                          isBooked &&
                            "opacity-50 cursor-not-allowed line-through",
                          selectedTime === timeString &&
                            "ring-2 ring-primary ring-offset-2"
                        )}
                        disabled={isBooked || isLoading || checkingDuplicate}
                        onClick={async () => {
                          if (!isBooked && !checkingDuplicate) {
                            setCheckingDuplicate(true);
                            try {
                              // Check for duplicate before allowing selection
                              const hasDuplicate = await checkForDuplicate(
                                timeString,
                                selectedDate
                              );

                              if (hasDuplicate) {
                                // Duplicate found - checkForDuplicate already shows toast
                                return;
                              }

                              // No duplicate - proceed with selection
                              setSelectedTime(timeString);
                              // Show booking form when time is selected
                              setShowBookingForm(true);
                            } finally {
                              setCheckingDuplicate(false);
                            }
                          }
                        }}
                      >
                        {checkingDuplicate ? "Vérification..." : timeString}
                        {isBooked && (
                          <span className="ml-1 text-xs">(Réservé)</span>
                        )}
                      </Button>
                    );
                  }
                )
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                  <Clock className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-sm">
                    Aucun créneau disponible pour cette date.
                  </p>
                  <p className="text-xs mt-2">
                    Veuillez sélectionner une date différente.
                  </p>
                </div>
              )}
            </div>
            {isLoading && (
              <div className="text-center py-4">
                <div className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="animate-spin h-4 w-4 mr-2" />
                  Chargement des créneaux disponibles...
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
