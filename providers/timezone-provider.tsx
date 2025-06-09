"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface TimezoneContextType {
  timezone: string;
  setTimezone: (timezone: string) => void;
  formatDateForTimezone: (date: Date) => string;
  formatDateEuropean: (date: Date) => string;
  formatTimeForTimezone: (date: Date) => string;
  formatDateTimeForTimezone: (date: Date) => string;
  getCurrentTimeInTimezone: () => string;
  convertToUserTimezone: (date: Date) => Date;
  convertFromUserTimezone: (date: Date) => Date;
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(
  undefined
);

interface TimezoneProviderProps {
  children: ReactNode;
}

export function TimezoneProvider({ children }: TimezoneProviderProps) {
  const [timezone, setTimezoneState] = useState<string>("Europe/Paris");

  // Function to validate if a timezone is valid
  const isValidTimezone = (tz: string): boolean => {
    try {
      new Date().toLocaleDateString("fr-FR", { timeZone: tz });
      return true;
    } catch (error) {
      console.warn(`Invalid timezone detected: ${tz}`, error);
      return false;
    }
  };

  // Initialize timezone from localStorage or detect user's timezone
  useEffect(() => {
    // Try to get saved timezone from localStorage
    const savedTimezone = localStorage.getItem("user-timezone");

    if (savedTimezone && isValidTimezone(savedTimezone)) {
      setTimezoneState(savedTimezone);
    } else {
      // Clear invalid timezone from localStorage
      if (savedTimezone && !isValidTimezone(savedTimezone)) {
        localStorage.removeItem("user-timezone");
        console.log(
          `Cleared invalid timezone from localStorage: ${savedTimezone}`
        );
      }

      // Detect user's timezone
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Common European/African timezones that we support
      const supportedTimezones = [
        "Europe/Paris",
        "Europe/Brussels",
        "Europe/Zurich",
        "Europe/Luxembourg",
        "Europe/Monaco",
        "Europe/London",
        "Europe/Madrid",
        "Europe/Rome",
        "Europe/Berlin",
        "Europe/Amsterdam",
        "Africa/Casablanca",
        "Africa/Algiers",
        "Africa/Tunis",
        "Africa/Dakar",
        "Africa/Bamako",
        "Africa/Ouagadougou",
        "Africa/Abidjan",
        "Africa/Kinshasa",
        "Africa/Brazzaville",
        "Africa/Douala",
        "Africa/Bangui",
        "Africa/Libreville",
        "Africa/Niamey",
        "Africa/Ndjamena",
        "America/Martinique",
        "America/Guadeloupe",
        "America/Cayenne",
        "Indian/Reunion",
        "Indian/Mayotte",
        "Pacific/Noumea",
        "Pacific/Tahiti",
      ];

      // Use detected timezone if it's in our supported list, otherwise default to Paris
      const initialTimezone = supportedTimezones.includes(detected)
        ? detected
        : "Europe/Paris";
      setTimezoneState(initialTimezone);
      localStorage.setItem("user-timezone", initialTimezone);
    }
  }, []);

  // Update localStorage when timezone changes
  const setTimezone = (newTimezone: string) => {
    if (!isValidTimezone(newTimezone)) {
      console.error(
        `Invalid timezone provided: ${newTimezone}, defaulting to Europe/Paris`
      );
      setTimezoneState("Europe/Paris");
      localStorage.setItem("user-timezone", "Europe/Paris");
      return;
    }
    setTimezoneState(newTimezone);
    localStorage.setItem("user-timezone", newTimezone);
  };

  // Format date for the selected timezone
  const formatDateForTimezone = (date: Date): string => {
    try {
      return date.toLocaleDateString("fr-FR", {
        timeZone: timezone,
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      console.error(`Error formatting date for timezone ${timezone}:`, error);
      // Fallback to Paris timezone
      return date.toLocaleDateString("fr-FR", {
        timeZone: "Europe/Paris",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  };

  // Format date in DD/MM/YYYY European format
  const formatDateEuropean = (date: Date): string => {
    try {
      return date.toLocaleDateString("fr-FR", {
        timeZone: timezone,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      console.error(
        `Error formatting European date for timezone ${timezone}:`,
        error
      );
      return date.toLocaleDateString("fr-FR", {
        timeZone: "Europe/Paris",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
  };

  // Format time for the selected timezone (24-hour format - European standard)
  const formatTimeForTimezone = (date: Date): string => {
    try {
      return date.toLocaleTimeString("fr-FR", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false, // 24-hour format is European standard
      });
    } catch (error) {
      console.error(`Error formatting time for timezone ${timezone}:`, error);
      // Fallback to Paris timezone
      return date.toLocaleTimeString("fr-FR", {
        timeZone: "Europe/Paris",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
  };

  // Format date and time for the selected timezone
  const formatDateTimeForTimezone = (date: Date): string => {
    return `${formatDateForTimezone(date)} à ${formatTimeForTimezone(date)}`;
  };

  // Get current time in the selected timezone
  const getCurrentTimeInTimezone = (): string => {
    return formatTimeForTimezone(new Date());
  };

  // Convert a date to user's selected timezone (for display)
  const convertToUserTimezone = (date: Date): Date => {
    try {
      // Create a new date that represents the same moment in the user's timezone
      const utcTime = date.getTime() + date.getTimezoneOffset() * 60000;

      // Get timezone offset for the selected timezone
      const targetDate = new Date(utcTime);
      const tempDate = new Date(
        targetDate.toLocaleString("en-US", { timeZone: timezone })
      );
      const targetOffset = tempDate.getTime() - utcTime;

      return new Date(utcTime + targetOffset);
    } catch (error) {
      console.error(`Error converting to timezone ${timezone}:`, error);
      // Return original date as fallback
      return date;
    }
  };

  // Convert a date from user's selected timezone to UTC (for API calls)
  const convertFromUserTimezone = (date: Date): Date => {
    try {
      // This assumes the input date is in the user's selected timezone
      // and converts it to UTC for API storage
      const tempDate = new Date(
        date.toLocaleString("en-US", { timeZone: "UTC" })
      );
      const utcOffset = tempDate.getTime() - date.getTime();

      return new Date(date.getTime() + utcOffset);
    } catch (error) {
      console.error(`Error converting from timezone ${timezone}:`, error);
      // Return original date as fallback
      return date;
    }
  };

  const value: TimezoneContextType = {
    timezone,
    setTimezone,
    formatDateForTimezone,
    formatDateEuropean,
    formatTimeForTimezone,
    formatDateTimeForTimezone,
    getCurrentTimeInTimezone,
    convertToUserTimezone,
    convertFromUserTimezone,
  };

  return (
    <TimezoneContext.Provider value={value}>
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone(): TimezoneContextType {
  const context = useContext(TimezoneContext);
  if (context === undefined) {
    throw new Error("useTimezone must be used within a TimezoneProvider");
  }
  return context;
}

export default TimezoneProvider;
