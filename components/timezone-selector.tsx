"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Globe } from "lucide-react";

// European and African timezones commonly used for French-speaking regions
const TIMEZONE_OPTIONS = [
  // European timezones
  {
    group: "Europe",
    zones: [
      { value: "Europe/Paris", label: "Paris (CET/CEST)", offset: "+01:00" },
      {
        value: "Europe/Brussels",
        label: "Bruxelles (CET/CEST)",
        offset: "+01:00",
      },
      {
        value: "Europe/Zurich",
        label: "Genève/Zurich (CET/CEST)",
        offset: "+01:00",
      },
      {
        value: "Europe/Luxembourg",
        label: "Luxembourg (CET/CEST)",
        offset: "+01:00",
      },
      { value: "Europe/Monaco", label: "Monaco (CET/CEST)", offset: "+01:00" },
      { value: "Europe/London", label: "Londres (GMT/BST)", offset: "+00:00" },
      { value: "Europe/Madrid", label: "Madrid (CET/CEST)", offset: "+01:00" },
      { value: "Europe/Rome", label: "Rome (CET/CEST)", offset: "+01:00" },
      { value: "Europe/Berlin", label: "Berlin (CET/CEST)", offset: "+01:00" },
      {
        value: "Europe/Amsterdam",
        label: "Amsterdam (CET/CEST)",
        offset: "+01:00",
      },
    ],
  },
  // African timezones (French-speaking regions)
  {
    group: "Afrique",
    zones: [
      {
        value: "Africa/Casablanca",
        label: "Casablanca (WET/WEST)",
        offset: "+01:00",
      },
      { value: "Africa/Algiers", label: "Alger (CET)", offset: "+01:00" },
      { value: "Africa/Tunis", label: "Tunis (CET)", offset: "+01:00" },
      { value: "Africa/Dakar", label: "Dakar (GMT)", offset: "+00:00" },
      { value: "Africa/Bamako", label: "Bamako (GMT)", offset: "+00:00" },
      {
        value: "Africa/Ouagadougou",
        label: "Ouagadougou (GMT)",
        offset: "+00:00",
      },
      { value: "Africa/Abidjan", label: "Abidjan (GMT)", offset: "+00:00" },
      { value: "Africa/Kinshasa", label: "Kinshasa (WAT)", offset: "+01:00" },
      {
        value: "Africa/Brazzaville",
        label: "Brazzaville (WAT)",
        offset: "+01:00",
      },
      { value: "Africa/Douala", label: "Douala (WAT)", offset: "+01:00" },
      { value: "Africa/Bangui", label: "Bangui (WAT)", offset: "+01:00" },
      {
        value: "Africa/Libreville",
        label: "Libreville (WAT)",
        offset: "+01:00",
      },
      { value: "Africa/Niamey", label: "Niamey (WAT)", offset: "+01:00" },
      { value: "Africa/Ndjamena", label: "N'Djamena (WAT)", offset: "+01:00" },
    ],
  },
  // DOM-TOM (French overseas territories)
  {
    group: "DOM-TOM",
    zones: [
      {
        value: "America/Martinique",
        label: "Martinique (AST)",
        offset: "-04:00",
      },
      {
        value: "America/Guadeloupe",
        label: "Guadeloupe (AST)",
        offset: "-04:00",
      },
      {
        value: "America/Cayenne",
        label: "Guyane française (GFT)",
        offset: "-03:00",
      },
      { value: "Indian/Reunion", label: "La Réunion (RET)", offset: "+04:00" },
      { value: "Indian/Mayotte", label: "Mayotte (EAT)", offset: "+03:00" },
      {
        value: "Pacific/Noumea",
        label: "Nouvelle-Calédonie (NCT)",
        offset: "+11:00",
      },
      { value: "Pacific/Tahiti", label: "Tahiti (TAHT)", offset: "-10:00" },
    ],
  },
];

interface TimezoneSelectProps {
  value?: string;
  onValueChange?: (timezone: string) => void;
  className?: string;
  disabled?: boolean;
}

export function TimezoneSelector({
  value,
  onValueChange,
  className = "",
  disabled = false,
}: TimezoneSelectProps) {
  const [detectedTimezone, setDetectedTimezone] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");

  // Detect user's timezone on mount
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setDetectedTimezone(detected);

    // If no value is set, use detected timezone or default to Paris
    if (!value && onValueChange) {
      // Check if detected timezone is in our list
      const isInList = TIMEZONE_OPTIONS.some((group) =>
        group.zones.some((zone) => zone.value === detected)
      );
      onValueChange(isInList ? detected : "Europe/Paris");
    }
  }, [value, onValueChange]);

  // Update current time every minute
  useEffect(() => {
    const updateTime = () => {
      if (value) {
        try {
          const now = new Date();
          const timeString = now.toLocaleTimeString("fr-FR", {
            timeZone: value,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
          setCurrentTime(timeString);
        } catch (error) {
          console.warn("Invalid timezone:", value);
          setCurrentTime("");
        }
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [value]);

  // Get the display label for selected timezone
  const getSelectedLabel = () => {
    if (!value) return "Sélectionner un fuseau horaire";

    for (const group of TIMEZONE_OPTIONS) {
      const zone = group.zones.find((z) => z.value === value);
      if (zone) return zone.label;
    }

    // If not in our predefined list, try to format it nicely
    const parts = value.split("/");
    return parts[parts.length - 1].replace("_", " ");
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
        <Globe className="w-4 h-4" />
        Fuseau horaire
      </Label>

      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue>
            <div className="flex items-center justify-between w-full">
              <span>{getSelectedLabel()}</span>
              {currentTime && (
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                  {currentTime}
                </span>
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[400px] overflow-y-auto">
          {/* Auto-detected timezone (if different from selected) */}
          {detectedTimezone && detectedTimezone !== value && (
            <>
              <SelectItem value={detectedTimezone} className="font-medium">
                🎯 Détecté automatiquement:{" "}
                {detectedTimezone.split("/").pop()?.replace("_", " ")}
              </SelectItem>
              <div className="border-b border-gray-200 dark:border-gray-700 my-2" />
            </>
          )}

          {TIMEZONE_OPTIONS.map((group) => (
            <div key={group.group}>
              <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {group.group}
              </div>
              {group.zones.map((zone) => (
                <SelectItem key={zone.value} value={zone.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{zone.label}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      {zone.offset}
                    </span>
                  </div>
                </SelectItem>
              ))}
              <div className="border-b border-gray-100 dark:border-gray-800 my-1" />
            </div>
          ))}
        </SelectContent>
      </Select>

      {value && (
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <span>Heure actuelle:</span>
          <span className="font-mono font-medium">{currentTime}</span>
          {detectedTimezone && value !== detectedTimezone && (
            <span className="text-amber-600 dark:text-amber-400">
              (Différent de votre fuseau local:{" "}
              {detectedTimezone.split("/").pop()})
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default TimezoneSelector;
