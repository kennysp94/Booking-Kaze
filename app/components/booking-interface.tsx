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
  Menu,
  X,
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
  const [showSidebar, setShowSidebar] = useState(true);
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

  // Refetch availability when timezone changes to ensure proper time formatting
  useEffect(() => {
    if (selectedDate && timezone) {
      fetchAvailability(selectedDate);
    }
  }, [timezone, selectedDate, fetchAvailability]);

  // Don't render date/time sensitive content until after mount
  if (!mounted) {
    return null;
  }

  const navigateMonth = (direction: "prev" | "next") => {
    const increment = direction === "next" ? 1 : -1;
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);

    // Prevent navigating to past months
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (direction === "prev" && newMonth < today) {
      return;
    }

    setSelectedMonth(newMonth);

    // Find first available date in the new month
    const availableDatesArray = Array.from(getAvailableDatesInMonth(newMonth));
    if (availableDatesArray.length > 0) {
      const newSelectedDate = new Date(availableDatesArray[0]);
      setSelectedDate(newSelectedDate);
      setSelectedTime("");
    }
  };

  const getAvailableDatesInMonth = (date: Date) => {
    const availableDates = new Set<string>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate dates for current month
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      if (currentDate >= today) {
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
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-900 min-h-screen flex items-center justify-center p-8">
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
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-900 min-h-screen flex items-center justify-center p-8">
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
    // Authenticated booking requirement
    return (
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-900 min-h-screen flex items-center justify-center p-8">
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
    <div className="max-w-5xl mx-auto bg-white dark:bg-gray-900">
      <div className="flex flex-col md:flex-row min-h-screen relative">
        {/* Toggle button for sidebar - visible on mobile */}
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="absolute top-4 left-4 md:hidden z-10 p-2 rounded-md bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700"
          aria-label={showSidebar ? "Close sidebar" : "Open sidebar"}
        >
          {showSidebar ? (
            <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>

        {/* Left side - toggleable sidebar */}
        <div
          className={`${showSidebar ? "block" : "hidden"} md:${
            showSidebar ? "block" : "hidden"
          } w-full md:w-[340px] p-8 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-all duration-200`}
        >
          <div className="space-y-8">
            {/* Profile section */}
            <div className="flex items-center space-x-3">
              <Avatar>
                <Image
                  src={organizer.image}
                  alt={organizer.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              </Avatar>
              <div>
                <h2 className="font-medium text-gray-900 dark:text-white">
                  {organizer.name}
                </h2>{" "}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Prestataire de Service
                </p>
              </div>
            </div>

            {/* Event details */}
            {eventType && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight mb-2 text-gray-900 dark:text-white">
                    {eventType.title}
                  </h1>
                  <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                    <Info className="w-4 h-4 mt-1 shrink-0" />
                    <p className="text-sm leading-relaxed">
                      {eventType.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <Clock className="w-4 h-4 mr-3 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm">{eventType.length} minutes</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <Video className="w-4 h-4 mr-3 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm">
                      Les détails de la réservation seront fournis après
                      confirmation
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <Globe className="w-4 h-4 mr-3 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm">{timezone}</span>
                  </div>
                </div>

                {/* Timezone Selector */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Fuseau horaire
                  </h3>
                  <TimezoneSelector
                    value={timezone}
                    onValueChange={setTimezone}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side - calendar and time slots */}
        <div className="flex-1 p-8">
          {/* Desktop sidebar toggle */}
          <div className="hidden md:block mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"
            >
              {showSidebar ? (
                <>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  <span>Masquer les détails</span>
                </>
              ) : (
                <>
                  <ChevronRight className="h-4 w-4 mr-2" />
                  <span>Afficher les détails</span>
                </>
              )}
            </Button>
          </div>

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
              disabled={(date) => {
                return !Array.from(availableDates).includes(
                  date.toISOString().split("T")[0]
                );
              }}
            />
          </div>

          {/* Time slots grid */}
          {selectedDate && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                Plages horaires disponibles pour{" "}
                {selectedDate ? formatDateForTimezone(selectedDate) : ""}
              </h3>
              <div className="grid grid-cols-3 gap-2">
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
                          className={cn(
                            "w-full justify-center py-2",
                            isBooked &&
                              "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                          )}
                          disabled={isBooked || isLoading || checkingDuplicate}
                          onClick={async () => {
                            if (!isBooked && selectedDate) {
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
                  <div className="col-span-3 text-center py-8 text-gray-500 dark:text-gray-400">
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
    </div>
  );
}
