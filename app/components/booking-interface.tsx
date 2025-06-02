"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  Clock,
  Video,
  Info,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useScheduling } from "@/providers/scheduling-provider";

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
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    availableSlots,
    isLoading,
    fetchAvailability,
  } = useScheduling();

  const [timeZone, setTimeZone] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Only access browser APIs after mount
  useEffect(() => {
    setMounted(true);
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  // Set default date and fetch initial availability
  useEffect(() => {
    if (!selectedDate) {
      const now = new Date();
      const defaultDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
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
    // First ensure both dates are midnight for comparison
    const targetDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    return availableSlots;
  };

  const availableDates = getAvailableDatesInMonth(selectedMonth);

  return (
    <div className="max-w-5xl mx-auto bg-white">
      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Left side - fixed width sidebar */}
        <div className="w-full md:w-[340px] p-8 border-r border-gray-200">
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
                <h2 className="font-medium text-gray-900">{organizer.name}</h2>
                <p className="text-sm text-gray-500">Service Provider</p>
              </div>
            </div>

            {/* Event details */}
            {eventType && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight mb-2">
                    {eventType.title}
                  </h1>
                  <div className="flex items-start gap-2 text-gray-600">
                    <Info className="w-4 h-4 mt-1 shrink-0" />
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {eventType.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-3 text-gray-400" />
                    <span className="text-sm">{eventType.length} minutes</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Video className="w-4 h-4 mr-3 text-gray-400" />
                    <span className="text-sm">
                      Web conferencing details provided upon booking
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Globe className="w-4 h-4 mr-3 text-gray-400" />
                    <span className="text-sm">{timeZone}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side - calendar and time slots */}
        <div className="flex-1 p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedMonth.toLocaleString("default", {
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
                  "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: cn(
                  "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                  "hover:bg-gray-100 rounded-md transition-colors",
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
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                Available time slots for {selectedDate.toLocaleDateString()}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {getAvailableSlotsForDate(selectedDate).map(
                  (timeString, index) => (
                    <Button
                      key={index}
                      variant={
                        selectedTime === timeString ? "default" : "outline"
                      }
                      className="w-full justify-center py-2"
                      onClick={() => setSelectedTime(timeString)}
                    >
                      {timeString}
                    </Button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
